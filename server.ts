import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import { createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";

dotenv.config();

const app = express();
app.use(express.json({
  limit: "10mb",
  verify: (req, _res, buffer) => {
    if ((req as any).originalUrl === "/api/billing/webhook") (req as any).rawBody = Buffer.from(buffer);
  },
}));

const PORT = Number(process.env.PORT || 3000);
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.7-flash";
const requireAiAuth = process.env.AI_REQUIRE_AUTH === "true" || process.env.NODE_ENV === "production";
const serverSupabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serverSupabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const authClient = serverSupabaseUrl && serverSupabaseAnonKey ? createClient(serverSupabaseUrl, serverSupabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const serverSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const billingAdminClient = serverSupabaseUrl && serverSupabaseServiceRoleKey ? createClient(serverSupabaseUrl, serverSupabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
const contentAdminClient = billingAdminClient;
const paymentProvider = process.env.PAYMENT_PROVIDER || "stripe";
const paymentSecret = process.env.PAYMENT_SECRET || process.env.STRIPE_SECRET_KEY;
const paymentWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
const paymentPriceIds: Record<string, string | undefined> = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
};
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const GEMINI_FALLBACK_TEXT_MODEL = process.env.GEMINI_FALLBACK_TEXT_MODEL || "gemini-3.6-flash";
const GEMINI_SECOND_FALLBACK_TEXT_MODEL = process.env.GEMINI_SECOND_FALLBACK_TEXT_MODEL || "gemini-2.5-flash";

async function generateTextContent(ai: GoogleGenAI, request: any) {
  const models = Array.from(new Set([request.model, GEMINI_FALLBACK_TEXT_MODEL, GEMINI_SECOND_FALLBACK_TEXT_MODEL]));
  let lastError: unknown;
  for (const model of models) {
    try {
      return await ai.models.generateContent({ ...request, model });
    } catch (error: any) {
      lastError = error;
      const status = Number(error?.status || error?.error?.code);
      if (status !== 429 && status !== 503) throw error;
      if (model !== models[models.length - 1]) console.warn(`Gemini ${model} unavailable (${status}); trying the next configured text model.`);
    }
  }
  throw lastError || new Error("No Gemini text model is available.");
}

const cefrSchema = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);
const nativeLanguageSchema = z.enum(["Spanish", "Chinese (Mandarin)", "Japanese", "Portuguese", "Arabic", "French", "Vietnamese", "Korean", "German", "Russian", "Hindi", "Turkish", "Indonesian", "Thai"]);
const nonEmptyText = (max: number) => z.string().trim().min(1).max(max);
const speechAssessmentSchema = z.object({
  accuracyScore: z.number().min(0).max(100),
  fluencyScore: z.number().min(0).max(100),
  pronunciationScore: z.number().min(0).max(100),
  overallCEFR: cefrSchema,
  feedbackText: nonEmptyText(1200),
  wordFeedback: z.array(z.object({ word: nonEmptyText(80), accuracy: z.number().min(0).max(100), status: nonEmptyText(80) }).strict()).min(1).max(80),
  nativeAlternative: nonEmptyText(500),
}).strict();
const teacherResponseSchema = z.object({
  reply: nonEmptyText(1200),
  grammarCorrection: z.string().trim().max(800).nullable().optional(),
  betterPhrasing: nonEmptyText(800),
  pronunciationFocus: z.array(nonEmptyText(80)).max(5),
  followUpQuestion: nonEmptyText(500),
}).strict();
const translationResponseSchema = z.object({
  translatedText: nonEmptyText(1200),
  literalMeaning: nonEmptyText(1200),
  culturalNote: nonEmptyText(1200),
  keyVocabulary: z.array(z.object({ word: nonEmptyText(80), definition: nonEmptyText(500), example: nonEmptyText(500) }).strict()).max(20),
}).strict();
const customLessonSchema = z.object({
  title: nonEmptyText(160),
  cefrLevel: cefrSchema,
  description: nonEmptyText(1500),
  dialogue: z.array(z.object({ speaker: nonEmptyText(80), text: nonEmptyText(600), translation: nonEmptyText(600) }).strict()).min(2).max(30),
  vocabularyList: z.array(z.object({ term: nonEmptyText(80), phonetic: nonEmptyText(120), definition: nonEmptyText(500) }).strict()).min(1).max(40),
  speakingPrompts: z.array(nonEmptyText(500)).min(1).max(10),
}).strict();
const fullLessonRequestSchema = z.object({ level: cefrSchema.optional(), unitNumber: z.number().int().min(1).max(100), moduleNumber: z.number().int().min(1).max(100), topicTitle: nonEmptyText(240), userNativeLang: nativeLanguageSchema }).strict();
const fullLessonResponseSchema = z.object({
  id: nonEmptyText(160).optional(), level: cefrSchema.optional(), unitNumber: z.number().int().min(1), moduleNumber: z.number().int().min(1), title: nonEmptyText(200), subtitle: nonEmptyText(300).optional(), category: nonEmptyText(80).optional(), estimatedMinutes: z.number().int().min(1).max(240).optional(), xpReward: z.number().int().min(0).max(10000).optional(), learningObjective: nonEmptyText(1500),
  grammarExplanation: z.object({ summary: nonEmptyText(1500), rules: z.array(z.object({ ruleTitle: nonEmptyText(160), explanation: nonEmptyText(800), example: nonEmptyText(500) }).strict()).min(1).max(20), commonMistakes: z.array(z.object({ incorrect: nonEmptyText(500), correct: nonEmptyText(500), reason: nonEmptyText(800) }).strict()).max(20) }).strict(),
  vocabularyList: z.array(z.object({ term: nonEmptyText(100), phonetic: nonEmptyText(160), partOfSpeech: nonEmptyText(80).optional(), definition: nonEmptyText(600), example: nonEmptyText(600).optional(), nativeTranslation: nonEmptyText(600).optional() }).strict()).min(1).max(50),
  exampleSentences: z.array(z.object({ english: nonEmptyText(600), nativeTranslation: nonEmptyText(600), contextNote: nonEmptyText(600) }).strict()).min(1).max(30),
  listeningScript: z.object({ title: nonEmptyText(200), audioText: nonEmptyText(2000), speakers: z.array(z.object({ speaker: nonEmptyText(80), text: nonEmptyText(600), translation: nonEmptyText(600) }).strict()).min(1).max(30), comprehensionCheck: z.array(z.object({ question: nonEmptyText(500), options: z.array(nonEmptyText(200)).min(2).max(8), correctIndex: z.number().int().min(0).max(7), explanation: nonEmptyText(800) }).strict()).min(1).max(20) }).strict(),
  speakingPractice: z.object({ targetPhrases: z.array(z.object({ phrase: nonEmptyText(600), phonetic: nonEmptyText(160), translation: nonEmptyText(600), pronunciationTip: nonEmptyText(600) }).strict()).min(1).max(20), phonemeFocus: z.array(nonEmptyText(80)).max(20) }).strict(),
  aiConversationScenario: z.object({ scenarioTitle: nonEmptyText(200), roleplayRole: nonEmptyText(120), teacherRole: nonEmptyText(120), initialMessage: nonEmptyText(800), suggestedResponses: z.array(nonEmptyText(500)).min(1).max(20), contextGoal: nonEmptyText(800) }).strict(),
  pronunciationPractice: z.object({ stressPatterns: z.array(z.object({ word: nonEmptyText(100), stressedSyllable: nonEmptyText(120), phonetic: nonEmptyText(160) }).strict()).max(30), minimalPairs: z.array(z.object({ wordA: nonEmptyText(100), wordB: nonEmptyText(100), difference: nonEmptyText(300) }).strict()).max(30), intonationType: nonEmptyText(300) }).strict(),
  exercises: z.array(z.object({ id: nonEmptyText(100), type: nonEmptyText(80), prompt: nonEmptyText(800), options: z.array(nonEmptyText(200)).max(10).optional(), correctAnswer: nonEmptyText(500), hint: nonEmptyText(500) }).strict()).max(30),
  quiz: z.array(z.object({ id: nonEmptyText(100), question: nonEmptyText(800), options: z.array(nonEmptyText(200)).min(2).max(8), correctIndex: z.number().int().min(0).max(7), explanation: nonEmptyText(800) }).strict()).min(1).max(30),
  homework: z.object({ assignmentTitle: nonEmptyText(200), instructions: nonEmptyText(1200), writingPrompt: nonEmptyText(800).optional(), speakingTaskPrompt: nonEmptyText(800).optional() }).strict(),
  aiEvaluationCriteria: z.object({ targetGrammarMastery: z.number().min(0).max(100), targetVocabularyDiversity: z.number().min(0).max(100), accuracyThresholdPercent: z.number().min(0).max(100), keyFeedbackFocusPoints: z.array(nonEmptyText(160)).max(20) }).strict(),
}).passthrough();
const roadmapSchema = z.object({
  curriculumName: nonEmptyText(180), assignedCEFR: cefrSchema, weeklyFocus: z.array(nonEmptyText(160)).min(1).max(8), recommendedTeacher: nonEmptyText(120),
  dailyPlan: z.array(z.object({ day: nonEmptyText(40), topic: nonEmptyText(180), minutes: z.number().int().min(5).max(240) }).strict()).min(1).max(14), aiTip: nonEmptyText(800),
}).strict();
function parseValidatedJson<T>(response: { text?: string }, schema: z.ZodType<T>): T {
  const parsed = JSON.parse(response.text || "{}");
  const result = schema.safeParse(parsed);
  if (!result.success) throw new Error(`AI response failed validation: ${result.error.issues[0]?.message || "invalid structure"}`);
  return result.data;
}
function requestText(value: unknown, max: number, fallback = "") {
  const text = typeof value === "string" ? value.trim() : fallback;
  return text.slice(0, max);
}
function normalizedTitle(value: string) { return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function parseRequest<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) { const error = new Error(result.error.issues[0]?.message || "Invalid request."); (error as any).statusCode = 400; throw error; }
  return result.data;
}
function requireAiClient() {
  const ai = getGeminiClient();
  if (!ai) { const error = new Error("AI service is not configured."); (error as any).statusCode = 503; throw error; }
  return ai;
}
const learnerContextSchema = z.object({ completedLessons: z.number().int().min(0).max(10000), totalXp: z.number().int().min(0).max(10000000), fluencyScore: z.number().min(0).max(100), weakAreas: z.array(nonEmptyText(120)).max(10) }).strict();
const roadmapRequestSchema = z.object({ nativeLanguage: nativeLanguageSchema, level: cefrSchema, goal: nonEmptyText(160), dailyMinutes: z.number().int().min(5).max(240), learningStyle: nonEmptyText(80), learnerContext: learnerContextSchema.optional() }).strict();
const teacherRequestSchema = z.object({ teacherId: nonEmptyText(80).optional(), teacherName: nonEmptyText(120).optional(), persona: nonEmptyText(500).optional(), userMessage: nonEmptyText(1200), history: z.array(z.object({ sender: z.enum(["user", "teacher"]), text: nonEmptyText(1200) }).strict()).max(30), cefrLevel: cefrSchema, goal: nonEmptyText(160) }).strict();
const speechRequestSchema = z.object({ transcript: nonEmptyText(2000), targetPhrase: nonEmptyText(1000).optional(), cefrLevel: cefrSchema }).strict();
const translationRequestSchema = z.object({ text: nonEmptyText(2000), nativeLanguage: nativeLanguageSchema }).strict();
const customLessonRequestSchema = z.object({ topic: nonEmptyText(240), cefrLevel: cefrSchema, userGoal: nonEmptyText(200), learnerContext: learnerContextSchema.optional() }).strict();
const saveCustomLessonRequestSchema = customLessonSchema.extend({ unitId: z.string().uuid() });

app.use("/api/gemini", async (req, res, next) => {
  const key = req.header("authorization") || req.ip || "anonymous";
  const now = Date.now();
  const windowState = requestWindows.get(key);
  if (!windowState || now - windowState.startedAt >= 60_000) {
    requestWindows.set(key, { startedAt: now, count: 1 });
  } else if (windowState.count >= 20) {
    res.status(429).json({ error: "Too many AI requests. Please wait a minute and try again." });
    return;
  } else {
    windowState.count += 1;
  }

  if (!requireAiAuth) {
    next();
    return;
  }
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!authClient || !token) {
    res.status(401).json({ error: "Authentication is required for AI features." });
    return;
  }
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Your session is invalid or expired." });
    return;
  }
  res.locals.userId = data.user.id;
  if (!process.env.GEMINI_API_KEY) {
    res.status(503).json({ error: "AI service is not configured." });
    return;
  }
  next();
});

function verifyStripeSignature(rawBody: Buffer | undefined, signature: string | undefined, secret: string) {
  if (!rawBody || !signature) return false;
  const timestamp = signature.split(",").find((part) => part.startsWith("t="))?.slice(2);
  const signatures = signature.split(",").filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || !signatures.length || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  return signatures.some((candidate) => candidate.length === expected.length && timingSafeEqual(Buffer.from(candidate), Buffer.from(expected)));
}

app.use("/api/billing", async (req, res, next) => {
  if (req.path === "/webhook") return next();
  const authorization = req.header("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!authClient || !token) return res.status(401).json({ error: "Authentication is required for billing." });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return res.status(401).json({ error: "Your session is invalid or expired." });
  res.locals.userId = data.user.id;
  return next();
});

app.post("/api/billing/checkout", async (req, res) => {
  try {
    const plan = String(req.body?.plan || "");
    if (!Object.prototype.hasOwnProperty.call(paymentPriceIds, plan)) return res.status(400).json({ error: "Choose a valid paid plan." });
    if (paymentProvider !== "stripe" || !paymentSecret || !paymentPriceIds[plan]) return res.status(503).json({ error: "Paid billing is not configured for this deployment." });
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const form = new URLSearchParams({
      mode: "subscription",
      "line_items[0][price]": paymentPriceIds[plan] as string,
      "line_items[0][quantity]": "1",
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      client_reference_id: res.locals.userId,
      "metadata[user_id]": res.locals.userId,
      "metadata[plan]": plan,
    });
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${paymentSecret}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = await response.json() as { url?: string; error?: { message?: string } };
    if (!response.ok || !data.url) return res.status(response.status >= 400 ? response.status : 502).json({ error: data.error?.message || "Checkout session could not be created." });
    return res.json({ checkoutUrl: data.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return res.status(500).json({ error: "Checkout session could not be created." });
  }
});

app.post("/api/billing/webhook", async (req, res) => {
  if (paymentProvider !== "stripe" || !paymentWebhookSecret || !billingAdminClient) return res.status(503).json({ error: "Billing webhook is not configured for this deployment." });
  if (!verifyStripeSignature((req as any).rawBody, req.header("stripe-signature"), paymentWebhookSecret)) return res.status(400).json({ error: "Invalid billing webhook signature." });
  const event = req.body as any;
  if (event?.type === "checkout.session.completed") {
    const session = event.data?.object || {};
    const userId = session.client_reference_id || session.metadata?.user_id;
    const plan = session.metadata?.plan;
    if (userId && (plan === "premium" || plan === "professional")) {
      const { error } = await billingAdminClient.from("subscriptions").upsert({
        user_id: userId,
        plan_name: plan,
        status: "active",
        payment_provider: "stripe",
        provider_customer_id: session.customer || null,
        provider_subscription_id: session.subscription || null,
        start_date: new Date().toISOString(),
      }, { onConflict: "provider_subscription_id" });
      if (error) return res.status(500).json({ error: "Subscription record could not be synchronized." });
      await billingAdminClient.from("profiles").update({ plan, updated_at: new Date().toISOString() }).eq("id", userId);
    }
  }
  return res.json({ received: true });
});

// Initialize Gemini Client safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. AI endpoints will fail closed with HTTP 503.");
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "I O I Education Network" });
});

// 1. Personalized Learning Roadmap Generation
app.post("/api/gemini/onboarding-roadmap", async (req, res) => {
  try {
    const { nativeLanguage, level, goal, dailyMinutes, learningStyle, learnerContext } = parseRequest(roadmapRequestSchema, req.body);
    const ai = requireAiClient();

    const prompt = `Create a highly personalized English learning roadmap for an IOI Education Network student with the following profile:
- Native Language: ${nativeLanguage || "Spanish"}
- Current Self-Assessed Level: ${level || "B1"}
- Primary Goal: ${goal || "Daily Conversation"}
- Daily Time Commitment: ${dailyMinutes || 15} minutes/day
- Preferred Learning Style: ${learningStyle}
- Progress and speaking context: ${JSON.stringify(learnerContext || { completedLessons: 0, totalXp: 0, fluencyScore: 0, weakAreas: [] })}

Return JSON conforming strictly to the requested schema.`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the Head Curriculum Architect at IOI Education Network. Output realistic, structured, highly motivating English learning plans tailored specifically to learners of their native language.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            curriculumName: { type: Type.STRING },
            assignedCEFR: { type: Type.STRING },
            weeklyFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendedTeacher: { type: Type.STRING },
            dailyPlan: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  minutes: { type: Type.NUMBER }
                },
                required: ["day", "topic", "minutes"]
              }
            },
            aiTip: { type: Type.STRING }
          },
          required: ["curriculumName", "assignedCEFR", "weeklyFocus", "recommendedTeacher", "dailyPlan", "aiTip"]
        }
      }
    });

    const data = parseValidatedJson(response, roadmapSchema);
    res.json(data);
  } catch (error: any) {
    console.error("Roadmap generation error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : "Failed to generate roadmap" });
  }
});

// 2. AI Avatar Teacher Conversational Chat Endpoint
app.post("/api/gemini/chat-teacher", async (req, res) => {
  try {
    const { teacherName, persona, userMessage, history, cefrLevel, goal } = parseRequest(teacherRequestSchema, req.body);
    const ai = requireAiClient();
    const response = await generateTextContent(ai, { model: GEMINI_TEXT_MODEL, contents: [
      ...(history || []).map((h) => ({ role: h.sender === "user" ? "user" : "model", parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: userMessage }] },
    ], config: { systemInstruction: `You are ${teacherName || "an encouraging English teacher"}. Persona: ${persona || "warm and precise"}. Student CEFR: ${cefrLevel}. Goal: ${goal}. Reply in concise JSON.`, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { reply: { type: Type.STRING }, grammarCorrection: { type: Type.STRING, nullable: true }, betterPhrasing: { type: Type.STRING }, pronunciationFocus: { type: Type.ARRAY, items: { type: Type.STRING } }, followUpQuestion: { type: Type.STRING } }, required: ["reply", "betterPhrasing", "pronunciationFocus", "followUpQuestion"] } } });
    res.json(parseValidatedJson(response, teacherResponseSchema));
  } catch (error: any) {
    console.error("Teacher chat error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : error?.statusCode === 400 ? error.message : "Failed to communicate with AI teacher" });
  }
});

// 3. Speech & Pronunciation Assessment
app.post("/api/gemini/assess-speech", async (req, res) => {
  try {
    const { transcript, targetPhrase, cefrLevel } = parseRequest(speechRequestSchema, req.body);
    const ai = requireAiClient();
    const prompt = `Evaluate only this captured learner transcript: "${transcript}". Target phrase or context: "${targetPhrase || "free response"}". Current CEFR: ${cefrLevel}. Return scores from 0 to 100, a CEFR estimate, word feedback, concise grammar/pronunciation feedback, and a native alternative.`;
    const response = await generateTextContent(ai, { model: GEMINI_TEXT_MODEL, contents: prompt, config: { systemInstruction: "You are a precise English speech evaluator. Never invent audio evidence; assess only the supplied transcript.", responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { accuracyScore: { type: Type.NUMBER }, fluencyScore: { type: Type.NUMBER }, pronunciationScore: { type: Type.NUMBER }, overallCEFR: { type: Type.STRING }, feedbackText: { type: Type.STRING }, wordFeedback: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, accuracy: { type: Type.NUMBER }, status: { type: Type.STRING } }, required: ["word", "accuracy", "status"] } }, nativeAlternative: { type: Type.STRING } }, required: ["accuracyScore", "fluencyScore", "pronunciationScore", "overallCEFR", "feedbackText", "wordFeedback", "nativeAlternative"] } } });
    res.json(parseValidatedJson(response, speechAssessmentSchema));
  } catch (error: any) {
    console.error("Speech assessment error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : error?.statusCode === 400 ? error.message : "Failed to assess speech" });
  }
});

// 4. Server-Side TTS Speech Synthesis
app.post("/api/gemini/generate-tts", async (req, res) => {
  try {
    const text = requestText(req.body?.text, 2000);
    if (!text) return res.status(400).json({ error: "Text is required for speech synthesis." });
    const ai = requireAiClient();
    const voice = requestText(req.body?.voiceName, 40, "Kore");
    const response = await ai.models.generateContent({ model: "gemini-3.1-flash-tts-preview", contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } });
    const audioBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioBase64) return res.status(502).json({ error: "No audio was returned by the speech service." });
    res.json({ audioBase64 });
  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : "Speech synthesis is unavailable." });
  }
});

// 5. Essay & Writing Evaluation
app.post("/api/gemini/assess-essay", async (req, res) => {
  try {
    const essayText = requestText(req.body?.essayText, 12000);
    const promptTopic = requestText(req.body?.promptTopic, 500, "General topic");
    const targetCEFR = cefrSchema.safeParse(req.body?.targetCEFR).success ? req.body.targetCEFR : "B2";
    if (!essayText) return res.status(400).json({ error: "Essay text is required." });
    const ai = requireAiClient();
    const response = await generateTextContent(ai, { model: GEMINI_TEXT_MODEL, contents: `Grade this English essay. Topic: ${promptTopic}. Target CEFR: ${targetCEFR}. Essay: ${essayText}`, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { cefrGrade: { type: Type.STRING }, overallScore: { type: Type.NUMBER }, grammarScore: { type: Type.NUMBER }, vocabularyScore: { type: Type.NUMBER }, coherenceScore: { type: Type.NUMBER }, corrections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, suggestion: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ["original", "suggestion", "explanation"] } }, advancedVocabularySuggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { basic: { type: Type.STRING }, advanced: { type: Type.STRING } }, required: ["basic", "advanced"] } }, summaryFeedback: { type: Type.STRING } }, required: ["cefrGrade", "overallScore", "grammarScore", "vocabularyScore", "coherenceScore", "corrections", "advancedVocabularySuggestions", "summaryFeedback"] } } });
    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Essay assessment error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : "Failed to assess essay" });
  }
});

// 6. Native Language Translation & Explanation Tool
app.post("/api/gemini/translate-explain", async (req, res) => {
  try {
    const { text, nativeLanguage } = parseRequest(translationRequestSchema, req.body);
    const ai = requireAiClient();
    const response = await generateTextContent(ai, { model: GEMINI_TEXT_MODEL, contents: `Translate and explain this English phrase for a learner whose native language is ${nativeLanguage}. Preserve the English original and return assistance only: "${text}"`, config: { systemInstruction: `You are a precise multilingual English-learning assistant. Translate into ${nativeLanguage}; never replace or rewrite the original English lesson content.`, responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { translatedText: { type: Type.STRING }, literalMeaning: { type: Type.STRING }, culturalNote: { type: Type.STRING }, keyVocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, definition: { type: Type.STRING }, example: { type: Type.STRING } }, required: ["word", "definition", "example"] } } }, required: ["translatedText", "literalMeaning", "culturalNote", "keyVocabulary"] } } });
    res.json(parseValidatedJson(response, translationResponseSchema));
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : error?.statusCode === 400 ? error.message : "Failed to translate" });
  }
});

// 7. On-Demand Custom Scenario Generator (AI Content Studio)
app.post("/api/gemini/generate-custom-lesson", async (req, res) => {
  try {
    const { topic, cefrLevel, userGoal, learnerContext } = parseRequest(customLessonRequestSchema, req.body);
    const ai = requireAiClient();
    const response = await generateTextContent(ai, { model: GEMINI_TEXT_MODEL, contents: `Generate a complete interactive English lesson unit. Topic: "${topic}". Target CEFR: ${cefrLevel}. Learner goal: "${userGoal}". Learner context: ${JSON.stringify(learnerContext || {})}. Address weak areas and speaking confidence in the speaking prompts. Include an English dialogue with optional assistance translations, a focused vocabulary list, and speaking prompts.`, config: { systemInstruction: "You are the IOI English curriculum generator. Return only practical, safe, structured lesson JSON.", responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, cefrLevel: { type: Type.STRING }, description: { type: Type.STRING }, dialogue: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { speaker: { type: Type.STRING }, text: { type: Type.STRING }, translation: { type: Type.STRING } }, required: ["speaker", "text", "translation"] } }, vocabularyList: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { term: { type: Type.STRING }, phonetic: { type: Type.STRING }, definition: { type: Type.STRING } }, required: ["term", "phonetic", "definition"] } }, speakingPrompts: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["title", "cefrLevel", "description", "dialogue", "vocabularyList", "speakingPrompts"] } } });
    res.json(parseValidatedJson(response, customLessonSchema));
  } catch (error: any) {
    console.error("Custom lesson generation error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : error?.statusCode === 400 ? error.message : "Failed to generate custom lesson" });
  }
});

app.post("/api/gemini/save-custom-lesson", async (req, res) => {
  try {
    const { unitId, title, cefrLevel, description, dialogue, vocabularyList, speakingPrompts } = parseRequest(saveCustomLessonRequestSchema, req.body);
    if (!contentAdminClient) return res.status(503).json({ error: "AI lesson persistence is not configured for this deployment." });
    const { data: unit, error: unitError } = await contentAdminClient.from("units").select("id,level_id").eq("id", unitId).maybeSingle();
    if (unitError || !unit) return res.status(404).json({ error: "Choose an existing course unit before saving this lesson." });
    const { data: level, error: levelError } = await contentAdminClient.from("levels").select("id,course_id").eq("id", unit.level_id).maybeSingle();
    if (levelError || !level) return res.status(404).json({ error: "The selected course unit is unavailable." });
    const { data: existingLessons, error: existingError } = await contentAdminClient.from("lessons").select("id,title").eq("unit_id", unitId).limit(200);
    if (existingError) throw existingError;
    const normalized = normalizedTitle(title);
    if ((existingLessons || []).some((lesson: any) => normalizedTitle(String(lesson.title || "")) === normalized)) return res.status(409).json({ error: "A lesson with this title already exists in the selected unit." });
    const { data: lastLesson } = await contentAdminClient.from("lessons").select("order_number").eq("unit_id", unitId).order("order_number", { ascending: false }).limit(1).maybeSingle();
    const orderNumber = Number(lastLesson?.order_number || 0) + 1;
    const lessonInsert = await contentAdminClient.from("lessons").insert({ unit_id: unitId, title, lesson_type: "Roleplay", content: { source: "authenticated-ai", cefrLevel, learningObjective: description, xpReward: 100, estimatedMinutes: 15, userId: res.locals.userId }, video_url: null, audio_url: null, ai_prompt: `Generated for ${cefrLevel} learner goal: ${description}`, order_number: orderNumber }).select("id,title,unit_id").single();
    if (lessonInsert.error || !lessonInsert.data) throw lessonInsert.error || new Error("Lesson could not be created.");
    const lessonId = lessonInsert.data.id;
    const cleanup = async () => { await contentAdminClient.from("lessons").delete().eq("id", lessonId); };
    const vocabularyInsert = await contentAdminClient.from("vocabulary").insert(vocabularyList.map((item) => ({ lesson_id: lessonId, word: item.term, pronunciation: item.phonetic, meaning: item.definition, example_sentence: `Use ${item.term} naturally when discussing this situation.` })));
    if (vocabularyInsert.error) { await cleanup(); throw vocabularyInsert.error; }
    const dialogueInsert = await contentAdminClient.from("dialogues").insert(dialogue.map((line, index) => ({ lesson_id: lessonId, speaker: line.speaker, text: line.text, order_number: index + 1 })));
    if (dialogueInsert.error) { await cleanup(); throw dialogueInsert.error; }
    const grammarInsert = await contentAdminClient.from("grammar_topics").insert({ lesson_id: lessonId, topic: `Useful grammar for ${title}`, explanation: description, examples: dialogue.map((line) => line.text).slice(0, 2).join(" ") });
    if (grammarInsert.error) { await cleanup(); throw grammarInsert.error; }
    const quizInsert = await contentAdminClient.from("quizzes").insert({ lesson_id: lessonId, question: `What is the main speaking context in ${title}?`, option_a: title, option_b: "A silent reading drill", option_c: "A spelling-only test", option_d: "No practice context", correct_answer: title, order_number: 1 });
    if (quizInsert.error) { await cleanup(); throw quizInsert.error; }
    const speakingInsert = await contentAdminClient.from("speaking_practice").insert({ lesson_id: lessonId, scenario: title, ai_instruction: speakingPrompts.join(" "), difficulty_level: cefrLevel });
    if (speakingInsert.error) { await cleanup(); throw speakingInsert.error; }
    return res.status(201).json({ lessonId, title, unitId, persisted: true });
  } catch (error: any) {
    console.error("Custom lesson persistence error:", error);
    return res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : "The custom lesson could not be saved safely." });
  }
});

// 8. Automated Master Curriculum Engine - Generate Complete 13-Part Lesson Unit
app.post("/api/gemini/generate-full-lesson", async (req, res) => {
  try {
    const { level, unitNumber, moduleNumber, topicTitle, userNativeLang } = parseRequest(fullLessonRequestSchema, req.body);
    const ai = requireAiClient();

    const targetLevel = level || "B1";
    const unitNo = unitNumber;
    const modNo = moduleNumber;
    const topic = topicTitle;
    const nativeLang = userNativeLang;

    const prompt = `Generate a complete 13-part structured lesson for IOI Education Network:
- CEFR Level: ${targetLevel}
- Unit Number: ${unitNo}
- Module Number: ${modNo}
- Topic Title: "${topic}"
- Student Native Language: "${nativeLang}"

Required 13-part lesson schema in JSON:
1. title & subtitle
2. learningObjective
3. grammarExplanation (summary, rules, commonMistakes)
4. vocabularyList (term, phonetic, partOfSpeech, definition, example, nativeTranslation)
5. exampleSentences (english, nativeTranslation, contextNote)
6. listeningScript (title, audioText, speakers, comprehensionCheck)
7. speakingPractice (targetPhrases, phonemeFocus)
8. aiConversationScenario (scenarioTitle, roleplayRole, teacherRole, initialMessage, suggestedResponses, contextGoal)
9. pronunciationPractice (stressPatterns, minimalPairs, intonationType)
10. exercises (id, type, prompt, options, correctAnswer, hint)
11. quiz (id, question, options, correctIndex, explanation)
12. homework (assignmentTitle, instructions, writingPrompt, speakingTaskPrompt)
13. aiEvaluationCriteria (targetGrammarMastery, targetVocabularyDiversity, accuracyThresholdPercent, keyFeedbackFocusPoints)`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the Chief AI Curriculum Architect at IOI Education Network. Output complete, highly educational 13-part lessons strictly adhering to JSON schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            level: { type: Type.STRING },
            unitNumber: { type: Type.NUMBER },
            moduleNumber: { type: Type.NUMBER },
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            category: { type: Type.STRING },
            estimatedMinutes: { type: Type.NUMBER },
            xpReward: { type: Type.NUMBER },
            learningObjective: { type: Type.STRING },
            grammarExplanation: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                rules: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      ruleTitle: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      example: { type: Type.STRING }
                    },
                    required: ["ruleTitle", "explanation", "example"]
                  }
                },
                commonMistakes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      incorrect: { type: Type.STRING },
                      correct: { type: Type.STRING },
                      reason: { type: Type.STRING }
                    },
                    required: ["incorrect", "correct", "reason"]
                  }
                }
              },
              required: ["summary", "rules", "commonMistakes"]
            },
            vocabularyList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  example: { type: Type.STRING },
                  nativeTranslation: { type: Type.STRING }
                },
                required: ["term", "phonetic", "definition", "example", "nativeTranslation"]
              }
            },
            exampleSentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  english: { type: Type.STRING },
                  nativeTranslation: { type: Type.STRING },
                  contextNote: { type: Type.STRING }
                },
                required: ["english", "nativeTranslation", "contextNote"]
              }
            },
            listeningScript: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                audioText: { type: Type.STRING },
                speakers: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      speaker: { type: Type.STRING },
                      text: { type: Type.STRING },
                      translation: { type: Type.STRING }
                    },
                    required: ["speaker", "text", "translation"]
                  }
                },
                comprehensionCheck: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.NUMBER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctIndex", "explanation"]
                  }
                }
              },
              required: ["title", "audioText", "speakers", "comprehensionCheck"]
            },
            speakingPractice: {
              type: Type.OBJECT,
              properties: {
                targetPhrases: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      phrase: { type: Type.STRING },
                      phonetic: { type: Type.STRING },
                      translation: { type: Type.STRING },
                      pronunciationTip: { type: Type.STRING }
                    },
                    required: ["phrase", "phonetic", "translation", "pronunciationTip"]
                  }
                },
                phonemeFocus: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["targetPhrases", "phonemeFocus"]
            },
            aiConversationScenario: {
              type: Type.OBJECT,
              properties: {
                scenarioTitle: { type: Type.STRING },
                roleplayRole: { type: Type.STRING },
                teacherRole: { type: Type.STRING },
                initialMessage: { type: Type.STRING },
                suggestedResponses: { type: Type.ARRAY, items: { type: Type.STRING } },
                contextGoal: { type: Type.STRING }
              },
              required: ["scenarioTitle", "roleplayRole", "teacherRole", "initialMessage", "suggestedResponses", "contextGoal"]
            },
            pronunciationPractice: {
              type: Type.OBJECT,
              properties: {
                stressPatterns: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      word: { type: Type.STRING },
                      stressedSyllable: { type: Type.STRING },
                      phonetic: { type: Type.STRING }
                    },
                    required: ["word", "stressedSyllable", "phonetic"]
                  }
                },
                minimalPairs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      wordA: { type: Type.STRING },
                      wordB: { type: Type.STRING },
                      difference: { type: Type.STRING }
                    },
                    required: ["wordA", "wordB", "difference"]
                  }
                },
                intonationType: { type: Type.STRING }
              },
              required: ["stressPatterns", "minimalPairs", "intonationType"]
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctAnswer: { type: Type.STRING },
                  hint: { type: Type.STRING }
                },
                required: ["id", "type", "prompt", "correctAnswer", "hint"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.NUMBER },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "question", "options", "correctIndex", "explanation"]
              }
            },
            homework: {
              type: Type.OBJECT,
              properties: {
                assignmentTitle: { type: Type.STRING },
                instructions: { type: Type.STRING },
                writingPrompt: { type: Type.STRING },
                speakingTaskPrompt: { type: Type.STRING }
              },
              required: ["assignmentTitle", "instructions"]
            },
            aiEvaluationCriteria: {
              type: Type.OBJECT,
              properties: {
                targetGrammarMastery: { type: Type.NUMBER },
                targetVocabularyDiversity: { type: Type.NUMBER },
                accuracyThresholdPercent: { type: Type.NUMBER },
                keyFeedbackFocusPoints: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["targetGrammarMastery", "targetVocabularyDiversity", "accuracyThresholdPercent", "keyFeedbackFocusPoints"]
            }
          },
          required: [
            "title", "subtitle", "learningObjective", "grammarExplanation", "vocabularyList",
            "exampleSentences", "listeningScript", "speakingPractice", "aiConversationScenario",
            "pronunciationPractice", "exercises", "quiz", "homework", "aiEvaluationCriteria"
          ]
        }
      }
    });

    const data = parseValidatedJson(response, fullLessonResponseSchema);
    res.json(data);
  } catch (error: any) {
    console.error("Full lesson generation error:", error);
    res.status(Number(error?.statusCode) || 500).json({ error: error?.statusCode === 503 ? error.message : error?.statusCode === 400 ? error.message : "Failed to generate full lesson" });
  }
});

// 6. AI Video Lesson Package Generation Pipeline
app.post("/api/gemini/generate-video-lesson", async (req, res) => {
  try {
    const { lessonTitle, cefrLevel, category, teacherName, existingLessonData } = req.body;
    const ai = getGeminiClient();

    const title = lessonTitle || "Mastering Conversational English";
    const level = cefrLevel || "B1";
    const cat = category || "General";
    const teacher = teacherName || "Emma (US Accent)";

    if (!ai) {
      // Fallback structured AI Video Lesson Package
      return res.json({
        lessonId: `vid_${Date.now()}`,
        title: title,
        cefrLevel: level,
        totalDurationSeconds: 180,
        assignedTeacher: {
          id: "emma",
          name: teacher,
          title: "Senior Conversational Lead",
          accent: "American",
          flag: "🇺🇸",
          avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80",
          voiceName: "Kore",
          specialty: "Phonetics & Fluency",
          personality: "Warm & Encouraging",
          bio: "10+ years teaching ESL to global executives.",
          sampleAudioText: "Hello! Welcome to your AI video lesson."
        },
        summary: {
          keyTakeaways: [
            `Master key structures for ${title}`,
            `Understand real-world application in ${cat} contexts`,
            `Practice native accent rhythm and clear stress patterns`
          ],
          grammarSummary: `Target grammar structures focus on natural phrasing, connectors, and active verb patterns appropriate for CEFR level ${level}.`,
          vocabularySummary: ["Fluency", "Articulation", "Precision", "Nuance", "Context"],
          estimatedXp: 120
        },
        avatarTeachingScript: {
          introduction: `[Warm Smile, Direct Eye Contact] Hello! Welcome to IOI Education Network. Today we are exploring "${title}" at CEFR Level ${level}.`,
          mainInstruction: `[Pacing Studio, Pointing to Slide] Notice how native speakers chunk phrases together. Rather than speaking word-by-word, focus on rhythm and emphasis on key content words.`,
          guidedPractice: `[Leaning Forward, Encouraging Gesture] Now let's try speaking together. Repeat after me: 'That makes total sense in this context.'`,
          conclusion: `[Thumbs Up, Smiling] Outstanding effort! You've mastered the core concepts of this lesson. Keep practicing with your AI Teacher in Voice Studio.`,
          fullNarrativeText: `Hello! Welcome to IOI Education Network. Today we are exploring "${title}" at CEFR Level ${level}. Notice how native speakers chunk phrases together. Rather than speaking word-by-word, focus on rhythm and emphasis on key content words. Now let's try speaking together. Repeat after me: 'That makes total sense in this context.' Outstanding effort! You've mastered the core concepts of this lesson.`
        },
        voiceNarrationConfig: {
          voiceName: "Kore",
          accent: "American (US)",
          recommendedRate: 0.95,
          pitch: "Medium-High Natural",
          sampleAudioText: `Welcome to this video lesson on ${title}.`
        },
        storyboard: [
          {
            sceneNumber: 1,
            title: "Introduction & Context Setting",
            durationSeconds: 30,
            cameraFraming: "Medium Close-Up",
            avatarPose: "Warm Greeting, Hands Open",
            facialExpressionCue: "[Enthusiastic]",
            backgroundDescription: "Modern minimalist IOI virtual studio with glowing blue neon accents and soft depth blur",
            motionTransition: "Smooth Dissolve",
            spokenScript: `Welcome to IOI Education Network! Today we're diving into ${title}. By the end of this video, you'll feel confident using these structures in real conversation.`,
            slideContent: {
              heading: title,
              subheading: `CEFR Level ${level} • ${cat}`,
              bulletPoints: [
                "Interactive AI Avatar Teacher guidance",
                "Phonetic & natural pronunciation rules",
                "Real-world situational dialogue application"
              ]
            },
            visualAssetSuggestions: {
              primaryGraphicPrompt: `Isometric 3D icon depicting ${title} in a high-tech modern classroom setting`,
              assetType: "3D Illustration",
              recommendedIcons: ["BookOpen", "Sparkles", "Target"],
              colorPalette: ["#4F46E5", "#06B6D4", "#0F172A"]
            }
          },
          {
            sceneNumber: 2,
            title: "Core Concept & Rule Explanation",
            durationSeconds: 45,
            cameraFraming: "Split Screen",
            avatarPose: "Pointing to Graphic Board",
            facialExpressionCue: "[Focused & Clear]",
            backgroundDescription: "High-contrast digital glass board with glowing interactive text overlays",
            motionTransition: "Slide Left",
            spokenScript: `Let's look at the foundational grammar rule. Notice how stress shifts depending on whether we want to emphasize contrast or agreement.`,
            slideContent: {
              heading: "Key Rules & Native Insights",
              grammarHighlightBox: {
                title: "Grammar Structure",
                ruleText: `Use natural sentence rhythm for ${title} to sound natural.`,
                example: "I'd really appreciate it if you could clarify that point."
              },
              bulletPoints: [
                "Stress content words (nouns, verbs, adjectives)",
                "Reduce function words (to, a, of, in)",
                "Link ending consonants to starting vowels"
              ]
            },
            visualAssetSuggestions: {
              primaryGraphicPrompt: "Clean vector diagram showing sentence intonation waves and stressed syllables",
              assetType: "Motion Infographic",
              recommendedIcons: ["Zap", "Layers", "CheckCircle"],
              colorPalette: ["#10B981", "#6366F1", "#1E293B"]
            }
          },
          {
            sceneNumber: 3,
            title: "Target Vocabulary & Pronunciation Breakdown",
            durationSeconds: 45,
            cameraFraming: "Lower Third Focus",
            avatarPose: "Nodding & Gesturing Precision",
            facialExpressionCue: "[Encouraging]",
            backgroundDescription: "3D floating glass cards displaying phonetic spellings and audio wave indicators",
            motionTransition: "Pop In Graphic",
            spokenScript: `Now let's examine our target vocabulary item. Pay special attention to the vowel clarity and syllable stress.`,
            slideContent: {
              heading: "Vocabulary Focus",
              vocabularyCard: {
                term: "Fluency",
                phonetic: "/ˈfluː.ən.si/",
                definition: "The ability to speak or write a language easily and accurately.",
                example: "She reached professional fluency through daily AI voice practice."
              },
              codeOrSentenceExample: "Example: 'Her fluency improved dramatically after consistent speaking practice.'"
            },
            visualAssetSuggestions: {
              primaryGraphicPrompt: "Minimalist glowing typography card with audio wave visuals",
              assetType: "Vector Graphic",
              recommendedIcons: ["Volume2", "Mic", "Star"],
              colorPalette: ["#F59E0B", "#8B5CF6", "#0284C7"]
            }
          },
          {
            sceneNumber: 4,
            title: "Interactive Video Checkpoint Quiz",
            durationSeconds: 30,
            cameraFraming: "Presentation Full",
            avatarPose: "Waiting Patiently, Smiling",
            facialExpressionCue: "[Inquisitive]",
            backgroundDescription: "Interactive blue translucent quiz arena with animated countdown ring",
            motionTransition: "Zoom Focus",
            spokenScript: `Time for a quick knowledge check! Pause the video or select your response right on screen.`,
            slideContent: {
              heading: "Video Checkpoint Quiz",
              subheading: "Select the correct response below:"
            },
            visualAssetSuggestions: {
              primaryGraphicPrompt: "High-tech quiz option buttons with glowing neon checkmarks",
              assetType: "Icon Grid",
              recommendedIcons: ["HelpCircle", "Brain", "Award"],
              colorPalette: ["#EC4899", "#3B82F6", "#0F172A"]
            },
            quizCheckpoint: {
              id: "q1",
              question: `Which sentence demonstrates correct natural phrasing for ${title}?`,
              options: [
                "I would appreciate if you clarify this for me.",
                "I'd really appreciate it if you could clarify this for me.",
                "Appreciate if you clarify this to me.",
                "I am appreciating your clarifying for me."
              ],
              correctIndex: 1,
              explanation: "Option B uses the polite conditional frame 'I'd really appreciate it if you could...' which is standard in professional English."
            }
          },
          {
            sceneNumber: 5,
            title: "Lesson Summary & Action Plan",
            durationSeconds: 30,
            cameraFraming: "Wide Studio",
            avatarPose: "Standing Proudly, Applause Gesture",
            facialExpressionCue: "[Warm & Proud]",
            backgroundDescription: "IOI Education Network graduation studio backdrop with floating achievement badge",
            motionTransition: "Fade through Black",
            spokenScript: `Fantastic work completing this video lesson! You've learned key phrases, improved your intonation, and passed the check. Head to Voice Studio to practice in live dialogue!`,
            slideContent: {
              heading: "Lesson Completed! 🎉",
              subheading: "Claim 120 XP • Ready for Voice Studio Practice",
              bulletPoints: [
                "Mastered core phrasing for " + title,
                "Completed 1-on-1 video checkpoint quiz",
                "Saved target vocabulary to personal dictionary"
              ]
            },
            visualAssetSuggestions: {
              primaryGraphicPrompt: "Glowing gold trophy with floating 3D XP stars and confetti particles",
              assetType: "3D Illustration",
              recommendedIcons: ["Trophy", "Award", "Flame"],
              colorPalette: ["#F59E0B", "#10B981", "#4F46E5"]
            }
          }
        ],
        subtitleScript: [
          {
            id: "sub_1",
            startTime: "00:00:00.500",
            endTime: "00:00:06.000",
            startSeconds: 0.5,
            endSeconds: 6.0,
            speaker: teacher,
            text: `Welcome to IOI Education Network! Today we're diving into ${title}.`,
            nativeTranslation: `¡Bienvenido a IOI Education Network! Hoy exploraremos ${title}.`
          },
          {
            id: "sub_2",
            startTime: "00:00:06.200",
            endTime: "00:00:12.500",
            startSeconds: 6.2,
            endSeconds: 12.5,
            speaker: teacher,
            text: "By the end of this video, you'll feel confident using these structures in real conversation.",
            nativeTranslation: "Al final de este video, te sentirás seguro usando estas estructuras en conversaciones reales."
          },
          {
            id: "sub_3",
            startTime: "00:00:30.000",
            endTime: "00:00:38.000",
            startSeconds: 30.0,
            endSeconds: 38.0,
            speaker: teacher,
            text: "Let's look at the foundational grammar rule and notice how stress shifts across the sentence.",
            nativeTranslation: "Examinemos la regla gramatical fundamental y cómo cambia el acento en la oración."
          },
          {
            id: "sub_4",
            startTime: "00:01:15.000",
            endTime: "00:01:22.000",
            startSeconds: 75.0,
            endSeconds: 82.0,
            speaker: teacher,
            text: "Now let's examine our target vocabulary item. Pay special attention to vowel clarity.",
            nativeTranslation: "Ahora examinemos nuestro vocabulario clave. Presta especial atención a la claridad de las vocales."
          },
          {
            id: "sub_5",
            startTime: "00:02:00.000",
            endTime: "00:02:08.000",
            startSeconds: 120.0,
            endSeconds: 128.0,
            speaker: teacher,
            text: "Time for a quick knowledge check! Select your response right on screen.",
            nativeTranslation: "¡Tiempo para una prueba rápida! Selecciona tu respuesta en la pantalla."
          }
        ],
        quizPresentation: {
          quizTitle: `${title} Video Checkpoint`,
          passScorePercent: 80,
          questions: [
            {
              id: "q1",
              sceneTriggerIndex: 3,
              question: `Which sentence demonstrates correct natural phrasing for ${title}?`,
              options: [
                "I would appreciate if you clarify this for me.",
                "I'd really appreciate it if you could clarify this for me.",
                "Appreciate if you clarify this to me.",
                "I am appreciating your clarifying for me."
              ],
              correctIndex: 1,
              explanation: "Option B uses the polite conditional frame 'I'd really appreciate it if you could...' which is standard in professional English."
            }
          ]
        },
        createdAt: new Date().toISOString()
      });
    }

    const prompt = `Generate a complete, professional, broadcast-quality AI Video Lesson Package for the following lesson:
- Title: ${title}
- CEFR Level: ${level}
- Category: ${cat}
- AI Teacher: ${teacher}
- Optional Source Data: ${JSON.stringify(existingLessonData || {})}

Return a valid JSON object matching the requested schema with ALL 8 required elements:
1. AI Avatar teaching script (intro, mainInstruction, guidedPractice, conclusion, fullNarrativeText with emotional/visual cues in brackets like [Warm Smile])
2. AI voice narration config (voiceName, accent, recommendedRate, pitch, sampleAudioText)
3. Scene-by-scene storyboard (array of 4 to 5 detailed scenes with sceneNumber, title, durationSeconds, cameraFraming, avatarPose, facialExpressionCue, backgroundDescription, motionTransition, spokenScript, slideContent, visualAssetSuggestions)
4. Slide content for each scene (heading, subheading, bulletPoints, grammarHighlightBox, vocabularyCard, codeOrSentenceExample)
5. Visual asset suggestions for each scene (primaryGraphicPrompt, assetType, recommendedIcons, colorPalette)
6. Subtitle script (array of timecoded cues with startTime, endTime, startSeconds, endSeconds, speaker, text, nativeTranslation)
7. Quiz presentation (quizTitle, passScorePercent, array of questions with sceneTriggerIndex, question, options, correctIndex, explanation)
8. Lesson summary (keyTakeaways, grammarSummary, vocabularySummary, estimatedXp)`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the Executive Producer & AI Video Director at IOI Education Network. Output rich, highly engaging, pedagagically sound video lesson manifests with precise timing, avatar cues, interactive quiz triggers, and slide content.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lessonId: { type: Type.STRING },
            title: { type: Type.STRING },
            cefrLevel: { type: Type.STRING },
            totalDurationSeconds: { type: Type.NUMBER },
            summary: {
              type: Type.OBJECT,
              properties: {
                keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } },
                grammarSummary: { type: Type.STRING },
                vocabularySummary: { type: Type.ARRAY, items: { type: Type.STRING } },
                estimatedXp: { type: Type.NUMBER }
              },
              required: ["keyTakeaways", "grammarSummary", "vocabularySummary", "estimatedXp"]
            },
            avatarTeachingScript: {
              type: Type.OBJECT,
              properties: {
                introduction: { type: Type.STRING },
                mainInstruction: { type: Type.STRING },
                guidedPractice: { type: Type.STRING },
                conclusion: { type: Type.STRING },
                fullNarrativeText: { type: Type.STRING }
              },
              required: ["introduction", "mainInstruction", "guidedPractice", "conclusion", "fullNarrativeText"]
            },
            voiceNarrationConfig: {
              type: Type.OBJECT,
              properties: {
                voiceName: { type: Type.STRING },
                accent: { type: Type.STRING },
                recommendedRate: { type: Type.NUMBER },
                pitch: { type: Type.STRING },
                sampleAudioText: { type: Type.STRING }
              },
              required: ["voiceName", "accent", "recommendedRate", "pitch", "sampleAudioText"]
            },
            storyboard: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  sceneNumber: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  durationSeconds: { type: Type.NUMBER },
                  cameraFraming: { type: Type.STRING },
                  avatarPose: { type: Type.STRING },
                  facialExpressionCue: { type: Type.STRING },
                  backgroundDescription: { type: Type.STRING },
                  motionTransition: { type: Type.STRING },
                  spokenScript: { type: Type.STRING },
                  slideContent: {
                    type: Type.OBJECT,
                    properties: {
                      heading: { type: Type.STRING },
                      subheading: { type: Type.STRING },
                      bulletPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                      grammarHighlightBox: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          ruleText: { type: Type.STRING },
                          example: { type: Type.STRING }
                        }
                      },
                      vocabularyCard: {
                        type: Type.OBJECT,
                        properties: {
                          term: { type: Type.STRING },
                          phonetic: { type: Type.STRING },
                          definition: { type: Type.STRING },
                          example: { type: Type.STRING }
                        }
                      },
                      codeOrSentenceExample: { type: Type.STRING }
                    },
                    required: ["heading"]
                  },
                  visualAssetSuggestions: {
                    type: Type.OBJECT,
                    properties: {
                      primaryGraphicPrompt: { type: Type.STRING },
                      assetType: { type: Type.STRING },
                      recommendedIcons: { type: Type.ARRAY, items: { type: Type.STRING } },
                      colorPalette: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["primaryGraphicPrompt", "assetType", "recommendedIcons", "colorPalette"]
                  }
                },
                required: ["sceneNumber", "title", "durationSeconds", "cameraFraming", "avatarPose", "facialExpressionCue", "backgroundDescription", "motionTransition", "spokenScript", "slideContent", "visualAssetSuggestions"]
              }
            },
            subtitleScript: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  startTime: { type: Type.STRING },
                  endTime: { type: Type.STRING },
                  startSeconds: { type: Type.NUMBER },
                  endSeconds: { type: Type.NUMBER },
                  speaker: { type: Type.STRING },
                  text: { type: Type.STRING },
                  nativeTranslation: { type: Type.STRING }
                },
                required: ["id", "startTime", "endTime", "startSeconds", "endSeconds", "speaker", "text"]
              }
            },
            quizPresentation: {
              type: Type.OBJECT,
              properties: {
                quizTitle: { type: Type.STRING },
                passScorePercent: { type: Type.NUMBER },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      sceneTriggerIndex: { type: Type.NUMBER },
                      question: { type: Type.STRING },
                      options: { type: Type.ARRAY, items: { type: Type.STRING } },
                      correctIndex: { type: Type.NUMBER },
                      explanation: { type: Type.STRING }
                    },
                    required: ["id", "sceneTriggerIndex", "question", "options", "correctIndex", "explanation"]
                  }
                }
              },
              required: ["quizTitle", "passScorePercent", "questions"]
            }
          },
          required: ["title", "cefrLevel", "totalDurationSeconds", "summary", "avatarTeachingScript", "voiceNarrationConfig", "storyboard", "subtitleScript", "quizPresentation"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    data.lessonId = data.lessonId || `vid_${Date.now()}`;
    data.createdAt = new Date().toISOString();
    res.json(data);
  } catch (error: any) {
    console.error("Video lesson package generation error:", error);
    res.status(500).json({ error: "Failed to generate video lesson package" });
  }
});


// Serve Vite in development mode or Static files in production
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`IOI Education Network server running on http://0.0.0.0:${PORT}`);
  });
}

start();
