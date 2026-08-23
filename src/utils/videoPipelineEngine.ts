import { AIVideoLessonPackage, CEFRLevel, SubtitleCue, StoryboardScene, AITeacher } from "../types";
import { apiFetch } from "../lib/api";
import { AI_TEACHERS } from "../data/initialData";

interface GenerateVideoParams {
  lessonTitle: string;
  cefrLevel: CEFRLevel;
  category?: string;
  teacherName?: string;
  existingLessonData?: any;
}

/**
 * Single Lesson Video Conversion Engine
 * Converts any existing or future custom lesson into a complete AI Video Lesson Package.
 */
export async function generateVideoLessonPackage(params: GenerateVideoParams): Promise<AIVideoLessonPackage> {
  const { lessonTitle, cefrLevel, category = "General", teacherName = "Emma (US Accent)", existingLessonData } = params;

  try {
    const response = await apiFetch("/api/gemini/generate-video-lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonTitle,
        cefrLevel,
        category,
        teacherName,
        existingLessonData
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.storyboard && data.storyboard.length > 0) {
        // Ensure assigned teacher is fully hydrated
        const matchedTeacher = AI_TEACHERS.find((t) => t.name.toLowerCase().includes(teacherName.toLowerCase())) || AI_TEACHERS[0];
        data.assignedTeacher = data.assignedTeacher || matchedTeacher;
        return data as AIVideoLessonPackage;
      }
    }
  } catch (err) {
    console.warn("API video generation failed, using intelligent client-side pipeline fallback:", err);
  }

  // Client-side deterministic pipeline fallback
  return createFallbackVideoPackage(lessonTitle, cefrLevel, category, teacherName, existingLessonData);
}

/**
 * Batch Video Pipeline Converter
 * Automates converting an entire array or level module of lessons into video packages.
 */
export async function batchConvertLessonsToVideo(
  lessons: Array<{ id?: string; title: string; cefrLevel: CEFRLevel; category?: string; [key: string]: any }>,
  onProgress?: (completed: number, total: number, currentTitle: string) => void
): Promise<AIVideoLessonPackage[]> {
  const results: AIVideoLessonPackage[] = [];

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    if (onProgress) {
      onProgress(i, lessons.length, lesson.title);
    }

    const pkg = await generateVideoLessonPackage({
      lessonTitle: lesson.title,
      cefrLevel: lesson.cefrLevel,
      category: lesson.category || "General",
      existingLessonData: lesson
    });

    results.push(pkg);
    // Slight pause for smooth async feel
    await new Promise((res) => setTimeout(res, 200));
  }

  if (onProgress) {
    onProgress(lessons.length, lessons.length, "Batch Pipeline Completed!");
  }

  return results;
}

/**
 * Fallback Generator for Instant Client-Side Conversions
 */
function createFallbackVideoPackage(
  title: string,
  level: CEFRLevel,
  category: string,
  teacherName: string,
  sourceData?: any
): AIVideoLessonPackage {
  const teacher: AITeacher = AI_TEACHERS.find((t) => t.name.toLowerCase().includes(teacherName.toLowerCase())) || AI_TEACHERS[0];

  const vocabTerm = sourceData?.vocabularyList?.[0]?.term || sourceData?.content?.vocabulary?.[0]?.term || "Precision";
  const vocabPhonetic = sourceData?.vocabularyList?.[0]?.phonetic || "/prɪˈsɪʒən/";
  const vocabDef = sourceData?.vocabularyList?.[0]?.definition || "The quality, condition, or fact of being exact and accurate.";
  const vocabEx = sourceData?.vocabularyList?.[0]?.example || "Clear communication requires precision in word choice.";

  const grammarSummaryRule = sourceData?.grammarExplanation?.summary ||
    `Mastering ${title} involves applying natural stress patterns, active connectors, and context-appropriate verb structures.`;

  const storyboardScenes: StoryboardScene[] = [
    {
      sceneNumber: 1,
      title: "1. Introduction & Learning Objectives",
      sectionCategory: "1. Introduction",
      durationSeconds: 25,
      cameraFraming: "Medium Close-Up",
      avatarPose: "Warm Welcoming Open Arms",
      facialExpressionCue: "[Warm Smile & Engaging Eye Contact]",
      backgroundDescription: "3D High-Tech IOI Virtual Studio Canvas with ambient glowing indigo particle backdrop",
      animationInstructions: "Kinetic title text slide-in with glowing particles, avatar greeting animation",
      onScreenText: [title, `CEFR Level ${level}`, "Objective: Master natural conversational phrasing"],
      motionTransition: "Smooth Dissolve",
      spokenScript: `Welcome back to IOI Education Network! I'm ${teacher.name}. Today, we're taking your English to the next level with our lesson on '${title}'. Let's jump right in!`,
      slideContent: {
        heading: title,
        subheading: `CEFR Level ${level} • ${category} Masterclass`,
        bulletPoints: [
          `Target CEFR ${level} Fluency Objective`,
          "Interactive AI Avatar & Voice Studio Integration",
          "6-Section Interactive Video & Homework Practice"
        ]
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: `3D isometric education node representing ${title} with glowing holographic UI`,
        assetType: "3D Illustration",
        recommendedIcons: ["BookOpen", "Sparkles", "Award"],
        colorPalette: ["#4F46E5", "#06B6D4", "#0F172A"]
      }
    },
    {
      sceneNumber: 2,
      title: "2. Teaching Explanation & Grammar Core",
      sectionCategory: "2. Teaching Explanation",
      durationSeconds: 40,
      cameraFraming: "Split Screen",
      avatarPose: "Pointing to Holographic Board",
      facialExpressionCue: "[Focused, Clear & Expressive]",
      backgroundDescription: "Translucent glass HUD presenting animated syntax structures and highlight boxes",
      animationInstructions: "Syntax highlight pulse, animated stress curve diagram on speech wave",
      onScreenText: ["Grammar Architecture", "Stress Content Words", "Reduce Function Words"],
      motionTransition: "Slide Left",
      spokenScript: `Let's dissect the core grammar rule. ${grammarSummaryRule} Notice how native speakers naturally reduce function words while emphasizing key content terms.`,
      slideContent: {
        heading: "Grammar Core Structure",
        grammarHighlightBox: {
          title: "Native Speaker Rule",
          ruleText: grammarSummaryRule,
          example: `In real conversations about ${title}, native speakers use polite conditional phrasing.`
        },
        bulletPoints: [
          "Stress content words (Nouns, Main Verbs, Adjectives)",
          "Maintain smooth vocal link between consonants and vowels",
          "Apply natural pitch changes to signal sentence completion"
        ]
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: "Clean infographic chart illustrating vocal pitch curves and syllable stress blocks",
        assetType: "Motion Infographic",
        recommendedIcons: ["Layers", "Zap", "CheckCircle"],
        colorPalette: ["#10B981", "#6366F1", "#1E293B"]
      }
    },
    {
      sceneNumber: 3,
      title: "3. Real-World Examples & Common Mistakes",
      sectionCategory: "3. Examples",
      durationSeconds: 40,
      cameraFraming: "Lower Third Focus",
      avatarPose: "Hand on Chest, Demonstrating Articulation",
      facialExpressionCue: "[Encouraging & Methodical]",
      backgroundDescription: "Floating 3D phonetic card showing syllable division and audio frequency graph",
      animationInstructions: "Split comparison screen showing common error vs correct native phrasing",
      onScreenText: ["Example Sentences", "Common Mistake vs Native Correction", `Target Word: ${vocabTerm}`],
      motionTransition: "Pop In Graphic",
      spokenScript: `Now let's examine key vocabulary and real-world conversation examples. Look at this common mistake learners make and how to fix it seamlessly.`,
      slideContent: {
        heading: "Examples & Common Error Fixes",
        vocabularyCard: {
          term: vocabTerm,
          phonetic: vocabPhonetic,
          definition: vocabDef,
          example: vocabEx
        },
        commonMistakes: [
          {
            mistake: `I am agree with you about ${title}.`,
            correction: `I agree with you completely about ${title}.`,
            reason: "'Agree' is a verb in English, so do not add 'am'."
          }
        ],
        codeOrSentenceExample: `Native Phrasing: "${vocabEx}"`
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: "Minimalist glowing typography graphic card with audio spectrum waves",
        assetType: "Vector Graphic",
        recommendedIcons: ["Volume2", "Mic", "Star"],
        colorPalette: ["#F59E0B", "#8B5CF6", "#0284C7"]
      }
    },
    {
      sceneNumber: 4,
      title: "4. Interactive Speaking Practice & Checkpoint Quiz",
      sectionCategory: "4. Practice",
      durationSeconds: 35,
      cameraFraming: "Presentation Full",
      avatarPose: "Patient Standing Pose with Quiz Card",
      facialExpressionCue: "[Inquisitive & Supportive]",
      backgroundDescription: "Interactive translucent quiz portal with countdown timer and answer feedback indicators",
      animationInstructions: "Interactive audio pulse waveform for repeat-after-me exercise + quiz card pop in",
      onScreenText: ["Repeat After Me Practice", "Interactive Quiz Checkpoint", "Select Answer on Screen"],
      motionTransition: "Zoom Focus",
      spokenScript: `Time for interactive practice! First, repeat after me: "${vocabEx}". Now, test your comprehension with this checkpoint quiz!`,
      slideContent: {
        heading: "Interactive Practice & Checkpoint Quiz",
        subheading: "Repeat out loud, then answer the question on screen:"
      },
      interactivePractice: {
        repeatAfterTeacherSentence: vocabEx,
        phoneticFocus: vocabPhonetic,
        aiConversationPrompt: `Let's practice a real-life scenario on ${title}. Say hello to begin.`
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: "Modern UI decision card with interactive radio selections and glow highlights",
        assetType: "Icon Grid",
        recommendedIcons: ["HelpCircle", "Brain", "Award"],
        colorPalette: ["#EC4899", "#3B82F6", "#0F172A"]
      },
      quizCheckpoint: {
        id: "vquiz_1",
        question: `What is the primary focus when mastering '${title}' at CEFR ${level}?`,
        options: [
          "Speaking as quickly as possible without pausing",
          `Using natural sentence rhythm, correct stress, and target vocabulary (${vocabTerm})`,
          "Memorizing written grammar rules without speaking out loud",
          "Translating every English word directly into your native language"
        ],
        correctIndex: 1,
        explanation: `Option B is correct! CEFR ${level} mastery requires natural speech rhythm, stress, and active usage of key vocabulary like '${vocabTerm}'.`
      }
    },
    {
      sceneNumber: 5,
      title: "5. Lesson Review & Key Points Summary",
      sectionCategory: "5. Review",
      durationSeconds: 25,
      cameraFraming: "Wide Studio",
      avatarPose: "Summary Gesture with Checkmarks",
      facialExpressionCue: "[Reassuring & Proud]",
      backgroundDescription: "3D floating glass bullet list with animated glowing checkmarks",
      animationInstructions: "Staggered reveal of lesson key takeaways and XP badge award animation",
      onScreenText: ["Lesson Key Review", "Mastered Core Structures", "+120 XP Earned"],
      motionTransition: "Smooth Dissolve",
      spokenScript: `Let's quickly review our key points. You've mastered the main structure, practiced target pronunciation, and completed the checkpoint.`,
      slideContent: {
        heading: "Lesson Summary & Review",
        subheading: "Key Takeaways Summary",
        bulletPoints: [
          `Mastered core phrasing for ${title}`,
          `Practiced target vocabulary: ${vocabTerm}`,
          "Understood intonation and stress reduction rules"
        ]
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: "3D summary board with checkmarks and floating sparkles",
        assetType: "3D Illustration",
        recommendedIcons: ["CheckCircle2", "Award", "Sparkles"],
        colorPalette: ["#10B981", "#4F46E5", "#0F172A"]
      }
    },
    {
      sceneNumber: 6,
      title: "6. Homework Assignment & Voice Practice",
      sectionCategory: "6. Homework",
      durationSeconds: 25,
      cameraFraming: "Wide Studio",
      avatarPose: "Applause & Thumbs Up",
      facialExpressionCue: "[Proud & Inspiring]",
      backgroundDescription: "IOI Education Network main auditorium background with floating XP badge and trophy",
      animationInstructions: "Homework card flip in with active microphone recorder button pulse",
      onScreenText: ["Speaking Homework Task", "Writing Homework Task", "Practice in Voice Studio"],
      motionTransition: "Fade through Black",
      spokenScript: `Here is your homework task for today! Complete a 30-second audio response and write 2 sentences using '${vocabTerm}'. Continue in Voice Studio!`,
      slideContent: {
        heading: "Homework & Next Steps 🎯",
        subheading: "Complete your tasks to seal your CEFR progress:"
      },
      homeworkAssignment: {
        speakingTask: `Record a 30-second voice message explaining your perspective on ${title}.`,
        writingTask: `Write 2 sentences using the vocabulary term '${vocabTerm}' in context.`,
        practiceActivity: `Start a live AI conversation in Voice Studio simulating ${title}.`
      },
      visualAssetSuggestions: {
        primaryGraphicPrompt: "Floating 3D gold trophy with glowing XP particles and celebratory rays",
        assetType: "3D Illustration",
        recommendedIcons: ["Trophy", "Award", "Flame"],
        colorPalette: ["#F59E0B", "#10B981", "#4F46E5"]
      }
    }
  ];

  const subtitles: SubtitleCue[] = [
    {
      id: "s1",
      startTime: "00:00:00.500",
      endTime: "00:00:08.000",
      startSeconds: 0.5,
      endSeconds: 8.0,
      speaker: teacher.name,
      text: `Welcome back to IOI Education Network! Today, we're exploring '${title}'.`,
      nativeTranslation: `¡Bienvenido de nuevo a IOI Education Network! Hoy exploraremos '${title}'.`
    },
    {
      id: "s2",
      startTime: "00:00:30.000",
      endTime: "00:00:38.000",
      startSeconds: 30.0,
      endSeconds: 38.0,
      speaker: teacher.name,
      text: `Let's dissect the core grammar rule and focus on sentence rhythm.`,
      nativeTranslation: "Analicemos la regla gramatical principal y el ritmo de la oración."
    },
    {
      id: "s3",
      startTime: "00:01:15.000",
      endTime: "00:01:23.000",
      startSeconds: 75.0,
      endSeconds: 83.0,
      speaker: teacher.name,
      text: `Now let's examine our key vocabulary term: '${vocabTerm}'. Repeat after me!`,
      nativeTranslation: `Ahora examinemos nuestro vocabulario clave: '${vocabTerm}'. ¡Repite conmigo!`
    },
    {
      id: "s4",
      startTime: "00:02:00.000",
      endTime: "00:02:08.000",
      startSeconds: 120.0,
      endSeconds: 128.0,
      speaker: teacher.name,
      text: "Time for your interactive video quiz! Pick the correct answer on screen.",
      nativeTranslation: "¡Tiempo para tu prueba en video! Elige la respuesta correcta en pantalla."
    },
    {
      id: "s5",
      startTime: "00:02:30.000",
      endTime: "00:02:38.000",
      startSeconds: 150.0,
      endSeconds: 158.0,
      speaker: teacher.name,
      text: "Congratulations on completing this AI video lesson! Keep practicing in Voice Studio.",
      nativeTranslation: "¡Felicitaciones por completar esta lección en video con IA! Sigue practicando en Voice Studio."
    }
  ];

  return {
    lessonId: `vid_pkg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    title,
    cefrLevel: level,
    totalDurationSeconds: 180,
    assignedTeacher: teacher,
    summary: {
      keyTakeaways: [
        `Master natural sentence structure for ${title}`,
        `Apply CEFR ${level} vocabulary with precise pronunciation`,
        "Build muscle memory through interactive video quiz checkpoints"
      ],
      grammarSummary: grammarSummaryRule,
      vocabularySummary: [vocabTerm, "Fluency", "Articulation", "Syntax"],
      estimatedXp: 120
    },
    avatarTeachingScript: {
      introduction: `[Warm Smile] Welcome to IOI Education Network! I'm ${teacher.name}, and today we're mastering ${title}.`,
      mainInstruction: `[Pointing to Screen] ${grammarSummaryRule}`,
      guidedPractice: `[Demonstrating Phonetics] Practice repeating target word: ${vocabTerm}.`,
      conclusion: `[Thumbs Up] Sensational work! You've successfully completed this AI video lesson.`,
      fullNarrativeText: `Welcome to IOI Education Network! I'm ${teacher.name}, and today we're mastering ${title}. ${grammarSummaryRule} Practice repeating target word: ${vocabTerm}. Sensational work! You've successfully completed this AI video lesson.`
    },
    voiceNarrationConfig: {
      voiceName: teacher.voiceName || "Kore",
      accent: teacher.accent || "American (US)",
      recommendedRate: 0.95,
      pitch: "Natural Medium",
      sampleAudioText: `Hello! Welcome to your AI video lesson on ${title}.`
    },
    storyboard: storyboardScenes,
    subtitleScript: subtitles,
    quizPresentation: {
      quizTitle: `${title} - Interactive Video Checkpoint`,
      passScorePercent: 80,
      questions: [
        {
          id: "vq1",
          sceneTriggerIndex: 3,
          question: `What is the primary focus when mastering '${title}' at CEFR ${level}?`,
          options: [
            "Speaking as quickly as possible without pausing",
            `Using natural sentence rhythm, correct stress, and target vocabulary (${vocabTerm})`,
            "Memorizing written grammar rules without speaking out loud",
            "Translating every English word directly into your native language"
          ],
          correctIndex: 1,
          explanation: `Option B is correct! CEFR ${level} mastery requires natural speech rhythm, stress, and active usage of key vocabulary like '${vocabTerm}'.`
        }
      ]
    },
    createdAt: new Date().toISOString()
  };
}

/**
 * Export Subtitle Script as Standard .SRT File format
 */
export function exportSubtitlesSRT(subtitles: SubtitleCue[]): string {
  return subtitles
    .map((cue, index) => {
      const startSrt = cue.startTime.replace(".", ",");
      const endSrt = cue.endTime.replace(".", ",");
      return `${index + 1}\n${startSrt} --> ${endSrt}\n${cue.speaker}: ${cue.text}\n`;
    })
    .join("\n");
}

/**
 * Export Video Package JSON Manifest
 */
export function exportVideoManifestJSON(pkg: AIVideoLessonPackage): string {
  return JSON.stringify(pkg, null, 2);
}

/**
 * Export Video Slide Deck Printable Document
 */
export function exportSlideDeckMarkdown(pkg: AIVideoLessonPackage): string {
  let md = `# IOI EDUCATION NETWORK - AI VIDEO LESSON DECK\n`;
  md += `**Title:** ${pkg.title}\n`;
  md += `**CEFR Level:** ${pkg.cefrLevel} | **AI Teacher:** ${pkg.assignedTeacher.name}\n`;
  md += `**Duration:** ${pkg.totalDurationSeconds}s | **Created:** ${pkg.createdAt}\n\n`;

  md += `--- \n\n## 📝 AI Avatar Script & Voice Narration\n`;
  md += `**Voice Model:** ${pkg.voiceNarrationConfig.voiceName} (${pkg.voiceNarrationConfig.accent})\n`;
  md += `\`\`\`\n${pkg.avatarTeachingScript.fullNarrativeText}\n\`\`\`\n\n`;

  md += `--- \n\n## 🎬 Scene-by-Scene Storyboard & Slide Deck\n\n`;

  pkg.storyboard.forEach((scene) => {
    md += `### Scene ${scene.sceneNumber}: ${scene.title} (${scene.durationSeconds}s)\n`;
    md += `- **Camera Framing:** ${scene.cameraFraming}\n`;
    md += `- **Avatar Pose & Cue:** ${scene.avatarPose} ${scene.facialExpressionCue}\n`;
    md += `- **Visual Background:** ${scene.backgroundDescription}\n`;
    md += `- **Spoken Script:** "${scene.spokenScript}"\n`;
    md += `- **Slide Heading:** ${scene.slideContent.heading}\n`;
    if (scene.slideContent.bulletPoints) {
      scene.slideContent.bulletPoints.forEach((bp) => {
        md += `  * ${bp}\n`;
      });
    }
    if (scene.slideContent.grammarHighlightBox) {
      md += `  > **Grammar Highlight:** ${scene.slideContent.grammarHighlightBox.ruleText}\n`;
      md += `  > *Example:* ${scene.slideContent.grammarHighlightBox.example}\n`;
    }
    if (scene.slideContent.vocabularyCard) {
      md += `  > **Vocab Card:** ${scene.slideContent.vocabularyCard.term} (${scene.slideContent.vocabularyCard.phonetic}) - ${scene.slideContent.vocabularyCard.definition}\n`;
    }
    md += `- **Visual Asset Suggestion:** ${scene.visualAssetSuggestions.primaryGraphicPrompt} [Style: ${scene.visualAssetSuggestions.assetType}]\n\n`;
  });

  md += `--- \n\n## 🧠 Interactive Video Quiz Checkpoint\n`;
  pkg.quizPresentation.questions.forEach((q, idx) => {
    md += `**Q${idx + 1}: ${q.question}**\n`;
    q.options.forEach((opt, optIdx) => {
      md += `  ${optIdx === q.correctIndex ? "✅" : "❌"} ${opt}\n`;
    });
    md += `*Explanation:* ${q.explanation}\n\n`;
  });

  return md;
}
