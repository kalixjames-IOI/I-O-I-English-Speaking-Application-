import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";
import { createHmac, timingSafeEqual } from "crypto";

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
const paymentProvider = process.env.PAYMENT_PROVIDER || "stripe";
const paymentSecret = process.env.PAYMENT_SECRET || process.env.STRIPE_SECRET_KEY;
const paymentWebhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET;
const paymentPriceIds: Record<string, string | undefined> = {
  premium: process.env.STRIPE_PRICE_PREMIUM,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
};
const requestWindows = new Map<string, { startedAt: number; count: number }>();
const GEMINI_FALLBACK_TEXT_MODEL = process.env.GEMINI_FALLBACK_TEXT_MODEL || "gemini-3.6-flash";

async function generateTextContent(ai: GoogleGenAI, request: any) {
  try {
    return await ai.models.generateContent(request);
  } catch (error: any) {
    const status = Number(error?.status || error?.error?.code);
    if ((status === 429 || status === 503) && request.model !== GEMINI_FALLBACK_TEXT_MODEL) {
      console.warn(`Gemini ${request.model} unavailable (${status}); retrying with ${GEMINI_FALLBACK_TEXT_MODEL}.`);
      return ai.models.generateContent({ ...request, model: GEMINI_FALLBACK_TEXT_MODEL });
    }
    throw error;
  }
}

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
    console.warn("GEMINI_API_KEY is not set. Gemini API endpoints will run with fallback mock responses.");
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
    const { nativeLanguage, level, goal, dailyMinutes, learningStyle } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        curriculumName: `${goal} Masterclass for ${nativeLanguage} Speaker`,
        assignedCEFR: level || "B1",
        weeklyFocus: ["Pronunciation & Accent", "Vocabulary Expansion", "Roleplay Scenarios"],
        recommendedTeacher: "Emma (US Accent)",
        dailyPlan: [
          { day: "Day 1", topic: "Self Introductions & Professional Greeting", minutes: dailyMinutes || 15 },
          { day: "Day 2", topic: "Key Idioms & Conversational Connectors", minutes: dailyMinutes || 15 },
          { day: "Day 3", topic: "Live AI Avatar Roleplay Practice", minutes: dailyMinutes || 15 },
          { day: "Day 4", topic: "Pronunciation & Phoneme Polish", minutes: dailyMinutes || 15 },
          { day: "Day 5", topic: "Weekly CEFR Fluency Assessment", minutes: dailyMinutes || 15 }
        ],
        aiTip: "Focus on speaking out loud during every lesson to build muscle memory."
      });
    }

    const prompt = `Create a highly personalized English learning roadmap for an IOI Education Network student with the following profile:
- Native Language: ${nativeLanguage || "Spanish"}
- Current Self-Assessed Level: ${level || "B1"}
- Primary Goal: ${goal || "Daily Conversation"}
- Daily Time Commitment: ${dailyMinutes || 15} minutes/day
- Preferred Learning Style: ${learningStyle || "Interactive Voice"}

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

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Roadmap generation error:", error);
    res.status(500).json({ error: "Failed to generate roadmap" });
  }
});

// 2. AI Avatar Teacher Conversational Chat Endpoint
app.post("/api/gemini/chat-teacher", async (req, res) => {
  try {
    const { teacherId, teacherName, persona, userMessage, history, cefrLevel, goal } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        reply: `Hello! I'm ${teacherName || "Emma"}. That's a great observation! In English, we often say '${userMessage}' with a natural rhythm. How are you feeling about practicing today?`,
        grammarCorrection: null,
        betterPhrasing: `I would love to practice ${goal || "conversation"} with you today!`,
        pronunciationFocus: ["rhythm", "intonation"],
        followUpQuestion: "What did you do earlier today?"
      });
    }

    const systemPrompt = `You are ${teacherName || "Emma"}, an AI Avatar English Teacher at IOI Education Network.
Your Persona & Style: ${persona || "Warm, encouraging American teacher specializing in conversational fluency."}
Current Student Level: CEFR ${cefrLevel || "B1"}.
Student Goal: ${goal || "General Fluency"}.

Instructions:
1. Provide a warm, natural response as ${teacherName}.
2. Keep your spoken reply concise (1-3 sentences) so it flows naturally in voice chat.
3. Analyze the user's input. If there are minor grammar/vocabulary errors, provide a gentle "grammarCorrection" and a "betterPhrasing" (How to say it like a native).
4. Highlight 1 or 2 words for "pronunciationFocus".
5. Ask a natural "followUpQuestion" to keep the conversation going.

Respond in JSON according to schema.`;

    const contents = [
      ...(history || []).map((h: any) => ({
        role: h.sender === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      })),
      { role: "user", parts: [{ text: userMessage }] }
    ];

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING },
            grammarCorrection: { type: Type.STRING, nullable: true },
            betterPhrasing: { type: Type.STRING },
            pronunciationFocus: { type: Type.ARRAY, items: { type: Type.STRING } },
            followUpQuestion: { type: Type.STRING }
          },
          required: ["reply", "betterPhrasing", "pronunciationFocus", "followUpQuestion"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Teacher chat error:", error);
    res.status(500).json({ error: "Failed to communicate with AI teacher" });
  }
});

// 3. Speech & Pronunciation Assessment
app.post("/api/gemini/assess-speech", async (req, res) => {
  try {
    const { transcript, targetPhrase, cefrLevel } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        accuracyScore: 88,
        fluencyScore: 85,
        pronunciationScore: 90,
        overallCEFR: cefrLevel || "B1",
        feedbackText: "Great effort! Your rhythm was very clear.",
        wordFeedback: (transcript || targetPhrase || "Hello world").split(" ").map((word: string) => ({
          word,
          accuracy: Math.floor(Math.random() * 15) + 85,
          status: "good"
        })),
        nativeAlternative: targetPhrase || transcript
      });
    }

    const prompt = `Evaluate the spoken English performance of an IOI Education Network learner.
User Spoke: "${transcript}"
Target or Context Phrase: "${targetPhrase || transcript}"
Current Level: ${cefrLevel || "B1"}

Provide a comprehensive speech assessment JSON including scores (0-100), word-level feedback, and native alternative.`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the Chief Pronunciation & Speech Evaluator at IOI Education Network. Be encouraging yet precise in scoring phonemes, fluency, and expression.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accuracyScore: { type: Type.NUMBER },
            fluencyScore: { type: Type.NUMBER },
            pronunciationScore: { type: Type.NUMBER },
            overallCEFR: { type: Type.STRING },
            feedbackText: { type: Type.STRING },
            wordFeedback: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  accuracy: { type: Type.NUMBER },
                  status: { type: Type.STRING, description: "excellent | good | needs_practice" }
                },
                required: ["word", "accuracy", "status"]
              }
            },
            nativeAlternative: { type: Type.STRING }
          },
          required: ["accuracyScore", "fluencyScore", "pronunciationScore", "overallCEFR", "feedbackText", "wordFeedback", "nativeAlternative"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Speech assessment error:", error);
    res.status(500).json({ error: "Failed to assess speech" });
  }
});

// 4. Server-Side TTS Speech Synthesis
app.post("/api/gemini/generate-tts", async (req, res) => {
  try {
    const { text, voiceName } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({ audioBase64: null, message: "Use Web Speech API fallback" });
    }

    // Voice mapping: Kore, Fenrir, Zephyr, Charon, Puck
    const voice = voiceName || "Kore";

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: text || "Welcome to IOI Education Network." }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      res.json({ audioBase64: base64Audio });
    } else {
      res.json({ audioBase64: null, message: "No audio generated" });
    }
  } catch (error: any) {
    console.warn("TTS generation error:", error?.message || error);
    res.json({ audioBase64: null, fallbackWebSpeech: true });
  }
});

// 5. Essay & Writing Evaluation
app.post("/api/gemini/assess-essay", async (req, res) => {
  try {
    const { essayText, promptTopic, targetCEFR } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        cefrGrade: targetCEFR || "B2",
        overallScore: 82,
        grammarScore: 80,
        vocabularyScore: 85,
        coherenceScore: 81,
        corrections: [
          { original: "I am agree with this point", suggestion: "I agree with this point", explanation: "'Agree' is a verb, so you don't need 'am'." }
        ],
        advancedVocabularySuggestions: [
          { basic: "very good", advanced: "exceptional / noteworthy" },
          { basic: "big problem", advanced: "significant impediment" }
        ],
        summaryFeedback: "Solid essay structure with good paragraph flow! Focus on subject-verb agreement for C1 level."
      });
    }

    const prompt = `Grade this English essay for an IOI Education Network student:
Topic: "${promptTopic || "General Topic"}"
Essay Text: "${essayText}"
Target CEFR: ${targetCEFR || "B2"}

Evaluate grammar, vocabulary level, sentence structure, coherence, and suggest higher-level vocabulary replacements.`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the Senior English Writing Examiner at IOI Education Network. Provide detailed, helpful essay feedback.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cefrGrade: { type: Type.STRING },
            overallScore: { type: Type.NUMBER },
            grammarScore: { type: Type.NUMBER },
            vocabularyScore: { type: Type.NUMBER },
            coherenceScore: { type: Type.NUMBER },
            corrections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  suggestion: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["original", "suggestion", "explanation"]
              }
            },
            advancedVocabularySuggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  basic: { type: Type.STRING },
                  advanced: { type: Type.STRING }
                },
                required: ["basic", "advanced"]
              }
            },
            summaryFeedback: { type: Type.STRING }
          },
          required: ["cefrGrade", "overallScore", "grammarScore", "vocabularyScore", "coherenceScore", "corrections", "advancedVocabularySuggestions", "summaryFeedback"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Essay assessment error:", error);
    res.status(500).json({ error: "Failed to assess essay" });
  }
});

// 6. Native Language Translation & Explanation Tool
app.post("/api/gemini/translate-explain", async (req, res) => {
  try {
    const { text, nativeLanguage } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        translatedText: `[Translated to ${nativeLanguage || "Native Language"}]: ${text}`,
        literalMeaning: text,
        culturalNote: "This phrase is widely used in casual conversations across native English speaking countries.",
        keyVocabulary: [
          { word: text.split(" ")[0] || "hello", definition: "A standard greeting", example: text }
        ]
      });
    }

    const prompt = `Translate and explain the following English phrase for a learner whose native language is ${nativeLanguage || "Spanish"}:
English Text: "${text}"`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: `You are the Multilingual AI Translator for IOI Education Network. Translate accurately into ${nativeLanguage || "the user's native language"} and break down key phrases and cultural nuances.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translatedText: { type: Type.STRING },
            literalMeaning: { type: Type.STRING },
            culturalNote: { type: Type.STRING },
            keyVocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  definition: { type: Type.STRING },
                  example: { type: Type.STRING }
                },
                required: ["word", "definition", "example"]
              }
            }
          },
          required: ["translatedText", "literalMeaning", "culturalNote", "keyVocabulary"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Translation error:", error);
    res.status(500).json({ error: "Failed to translate" });
  }
});

// 7. On-Demand Custom Scenario Generator (AI Content Studio)
app.post("/api/gemini/generate-custom-lesson", async (req, res) => {
  try {
    const { topic, cefrLevel, userGoal } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        title: `Mastering ${topic || "English Roleplay"}`,
        cefrLevel: cefrLevel || "B1",
        description: `Interactive lesson and practical conversation practice for ${topic || "everyday situations"}.`,
        dialogue: [
          { speaker: "AI Teacher", text: `Hello! Welcome to our ${topic} practice session. Are you ready?`, translation: "Hola! Bienvenido..." },
          { speaker: "Learner", text: "Yes, I am ready to practice!", translation: "Sí, estoy listo..." }
        ],
        vocabularyList: [
          { term: "Confidence", phonetic: "/ˈkɒnfɪdəns/", definition: "Self-assurance in speaking" }
        ],
        speakingPrompts: [
          `How would you express your opinion regarding ${topic}?`
        ]
      });
    }

    const prompt = `Generate a complete interactive English lesson unit for IOI Education Network:
Topic: "${topic || "Ordering at a Fine Dining Restaurant"}"
Target CEFR: "${cefrLevel || "B1"}"
Learner Goal: "${userGoal || "Speaking Fluency"}"`;

    const response = await generateTextContent(ai, {
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are the AI Content Generator for IOI Education Network. Produce realistic, fun, practical roleplays and vocabulary for modern English learners.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            cefrLevel: { type: Type.STRING },
            description: { type: Type.STRING },
            dialogue: {
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
            vocabularyList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  phonetic: { type: Type.STRING },
                  definition: { type: Type.STRING }
                },
                required: ["term", "phonetic", "definition"]
              }
            },
            speakingPrompts: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["title", "cefrLevel", "description", "dialogue", "vocabularyList", "speakingPrompts"]
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Custom lesson generation error:", error);
    res.status(500).json({ error: "Failed to generate custom lesson" });
  }
});

// 8. Automated Master Curriculum Engine - Generate Complete 13-Part Lesson Unit
app.post("/api/gemini/generate-full-lesson", async (req, res) => {
  try {
    const { level, unitNumber, moduleNumber, topicTitle, userNativeLang } = req.body;
    const ai = getGeminiClient();

    const targetLevel = level || "B1";
    const unitNo = unitNumber || 1;
    const modNo = moduleNumber || 1;
    const topic = topicTitle || "Executive Communications";
    const nativeLang = userNativeLang || "Spanish";

    if (!ai) {
      return res.json({
        id: `full_lesson_${targetLevel}_u${unitNo}_m${modNo}`,
        level: targetLevel,
        unitNumber: unitNo,
        moduleNumber: modNo,
        title: `${topic} (Module ${modNo})`,
        subtitle: `Level ${targetLevel} Master Unit`,
        category: "Roleplay",
        estimatedMinutes: 15,
        xpReward: 100,
        learningObjective: `Master core sentence structures, vocabulary, and natural conversational cadence for ${topic} at CEFR level ${targetLevel}.`,
        grammarExplanation: {
          summary: `In ${topic}, native speakers utilize precise sentence markers and indirect phrasing.`,
          rules: [
            { ruleTitle: "Courtesy Expressions", explanation: "Use 'Would you mind...' or 'Could I please...' for polite requests.", example: "Could I please clarify this timeline?" }
          ],
          commonMistakes: [
            { incorrect: "I am agree with your proposal", correct: "I agree with your proposal", reason: "'Agree' is a verb in English." }
          ]
        },
        vocabularyList: [
          { term: "Elaborate", phonetic: "/ɪˈlæb.ə.reɪt/", partOfSpeech: "verb", definition: "To present an idea in detail.", example: "Could you elaborate on that?", nativeTranslation: "Elaborar / Detallar" }
        ],
        exampleSentences: [
          { english: "I would appreciate your thoughts on this matter.", nativeTranslation: "Agradecería sus comentarios sobre este asunto.", contextNote: "Polite formal phrasing." }
        ],
        listeningScript: {
          title: "Executive Discussion",
          audioText: "Listen to two colleagues discussing project goals.",
          speakers: [
            { speaker: "Manager", text: "Welcome to today's review session.", translation: "Bienvenido a la sesión de revisión de hoy." }
          ],
          comprehensionCheck: [
            { question: "What is the primary topic?", options: ["Project review", "Office relocation"], correctIndex: 0, explanation: "Manager mentions review session." }
          ]
        },
        speakingPractice: {
          targetPhrases: [
            { phrase: "I'd like to elaborate on that point.", phonetic: "/aɪd laɪk tuː ɪˈlæb.ə.reɪt ɒn ðæt pɔɪnt/", translation: "Me gustaría profundizar...", pronunciationTip: "Connect words smoothly." }
          ],
          phonemeFocus: ["/æ/", "/eɪ/"]
        },
        aiConversationScenario: {
          scenarioTitle: `Roleplay: ${topic}`,
          roleplayRole: "Senior Specialist",
          teacherRole: "AI Director",
          initialMessage: `Welcome! Let's begin our discussion on ${topic}.`,
          suggestedResponses: ["Thank you. I am ready."],
          contextGoal: "Practice natural fluency and accurate vocabulary."
        },
        pronunciationPractice: {
          stressPatterns: [{ word: "ELABORATE", stressedSyllable: "e-LAB-o-rate", phonetic: "/ɪˈlæb.ə.reɪt/" }],
          minimalPairs: [{ wordA: "ship", wordB: "sheep", difference: "Short vs long vowel" }],
          intonationType: "Falling intonation for standard statements."
        },
        exercises: [
          { id: "ex1", type: "multiple_choice", prompt: "Choose the correct phrase:", options: ["I agree", "I am agree"], correctAnswer: "I agree", hint: "Verb form." }
        ],
        quiz: [
          { id: "q1", question: "What does elaborate mean?", options: ["To detail", "To delete"], correctIndex: 0, explanation: "Elaborate means to detail." }
        ],
        homework: {
          assignmentTitle: "Reflective Summary",
          instructions: "Write a 3-sentence summary of what you practiced."
        },
        aiEvaluationCriteria: {
          targetGrammarMastery: 85,
          targetVocabularyDiversity: 80,
          accuracyThresholdPercent: 85,
          keyFeedbackFocusPoints: ["Sentence clarity", "Syllable stress"]
        }
      });
    }

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

    const data = JSON.parse(response.text || "{}");
    res.json(data);
  } catch (error: any) {
    console.error("Full lesson generation error:", error);
    res.status(500).json({ error: "Failed to generate full lesson" });
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
