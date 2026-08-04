import { CEFRLevel, CurriculumModuleItem, FullCurriculumLesson } from "../types";

export interface LevelUnitOverview {
  unitNumber: number;
  unitTitle: string;
  theme: string;
  moduleCount: number;
}

export const CEFR_LEVEL_METADATA: Record<
  CEFRLevel,
  {
    name: string;
    title: string;
    description: string;
    totalUnits: number;
    totalLessons: number;
    units: LevelUnitOverview[];
  }
> = {
  A1: {
    name: "Beginner",
    title: "Foundations & Everyday Expressions",
    description: "Master basic greetings, personal introductions, simple daily routines, present simple tense, essential numbers, colors, and survival phrases.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "Greetings & Self-Introductions", theme: "Personal Identity", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Numbers, Colors & Time Expressions", theme: "Daily Basics", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Family & Home Environment", theme: "Relationships", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Present Simple Tense & Daily Habits", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Food, Drinks & Restaurant Ordering", theme: "Social & Dining", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Jobs, Professions & Workplaces", theme: "Career Basics", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Places in the City & Directions", theme: "Navigation", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Shopping, Clothes & Prices", theme: "Commerce", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Hobbies, Sports & Free Time", theme: "Leisure", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Weather, Seasons & Climate Basics", theme: "Environment", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Present Continuous & Actions Now", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Health, Body Parts & Basic Symptoms", theme: "Wellness", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "Simple Past Tense & Past Events", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "Transportation, Travel & Tickets", theme: "Mobility", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "A1 Mastery Review & Final Capstone", theme: "Assessment", moduleCount: 10 },
    ]
  },
  A2: {
    name: "Elementary",
    title: "Routine Tasks & Social Exchanges",
    description: "Understand sentences and frequent expressions related to areas of immediate relevance like basic personal info, local geography, and employment.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "Describing People & Personalities", theme: "Social Communication", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Past Simple vs Present Perfect Intro", theme: "Grammar Mastery", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Hotel Check-ins & Airport Travel", theme: "Global Travel", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Making Plans, Inviting & Refusing", theme: "Social Etiquette", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Comparatives & Superlatives", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Workplace Emails & Office Tasks", theme: "Business A2", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Health Appointments & Pharmacies", theme: "Healthcare", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Future Tenses: Going to vs Will", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Technology, Apps & Internet Usage", theme: "Digital Life", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Cultural Celebrations & Holidays", theme: "Culture", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Modal Verbs: Can, Must, Should", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Housing, Renting & Furniture", theme: "Real Estate", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "Storytelling & Sequence Connectors", theme: "Narrative Skills", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "Customer Service & Complaints", theme: "Commerce", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "A2 Mastery Review & Speaking Test", theme: "Assessment", moduleCount: 10 },
    ]
  },
  B1: {
    name: "Intermediate",
    title: "Travel, Work & Personal Opinions",
    description: "Understand main points of clear standard input on familiar matters regularly encountered in work, school, and leisure.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "Job Interviews & Professional Bio", theme: "Career Advancement", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Conditionals: First & Second Rules", theme: "Grammar Mastery", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Expressing Opinions & Disagreeing", theme: "Discussion", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Travel Emergencies & Flight Delays", theme: "Travel Problem Solving", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Passive Voice in Media & News", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Business Meetings & Agendas", theme: "Corporate English", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Environmental Issues & Sustainability", theme: "Global Topics", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Reported Speech & Quoting Others", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Arts, Movies & Entertainment Reviews", theme: "Culture & Media", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Financial Literacy, Banking & Money", theme: "Finance", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Relative Clauses: Who, Which, That", theme: "Grammar Core", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Tech Innovations & AI Trends", theme: "Technology", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "Negotiating Deals & Compromise", theme: "Business Negotiation", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "Academic Essay Writing Basics", theme: "Academic Writing", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "B1 Intermediate Mastery Exam", theme: "Assessment", moduleCount: 10 },
    ]
  },
  B2: {
    name: "Upper Int.",
    title: "Complex Technical & Spontaneous Speech",
    description: "Understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in specialized fields.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "Executive Presentations & Pitching", theme: "Leadership Communication", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Third Conditional & Mixed Conditionals", theme: "Advanced Grammar", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Cross-Cultural Communication", theme: "Global Workplace", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Debating Social & Ethical Dilemmas", theme: "Rhetoric", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Inversion & Emphatic Structures", theme: "Advanced Syntax", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Global Supply Chain & Logistics", theme: "Business Strategy", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Psychology, Behaviour & Motivation", theme: "Human Science", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Subjunctive & Formal Business Tone", theme: "Advanced Grammar", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Medical Advances & Public Health", theme: "Healthcare Science", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Cryptocurrency, Fintech & Markets", theme: "Economics", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Advanced Phrasal Verbs in Context", theme: "Idiomatic Mastery", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Crisis Management & PR Response", theme: "Corporate Strategy", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "Scientific Method & Data Rhetoric", theme: "Academic Research", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "IELTS/TOEFL Advanced Speaking Strategies", theme: "Exam Prep", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "B2 Upper-Int. Certification Exam", theme: "Assessment", moduleCount: 10 },
    ]
  },
  C1: {
    name: "Advanced",
    title: "Executive Rhetoric & Implicit Meaning",
    description: "Understand a wide range of demanding, longer texts, and recognize implicit meaning. Express ideas fluently and spontaneously.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "C-Suite Strategic Negotiations", theme: "Executive Leadership", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Nuanced Idioms & Metaphorical Rigor", theme: "Stylistics", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Geopolitics, Governance & Policy", theme: "Macro-Economics", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Subtle Irony, Humor & Sarcasm", theme: "Pragmatics", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Complex Discourse Markers & Flow", theme: "Cohesion Mastery", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Mergers, Acquisitions & Venture Capital", theme: "High Finance", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Philosophy of AI, Mind & Consciousness", theme: "Futurism", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Legal Contracts, Statutes & Compliance", theme: "Legal English", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Literary Analysis & Classical Rhetoric", theme: "Humanities", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Crisis Communication & Hostile Q&A", theme: "Media Handling", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Architectural & Urban Planning Discourse", theme: "Design & Science", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Neuroscience & Human Cognition", theme: "Advanced Science", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "International Diplomacy & Treaties", theme: "Global Affairs", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "Cambridge C1 Advanced (CAE) Mastery", theme: "Exam Prep", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "C1 Advanced Diploma Defense", theme: "Assessment", moduleCount: 10 },
    ]
  },
  C2: {
    name: "Mastery",
    title: "Native Command & Precision Fluency",
    description: "Understand with ease virtually everything heard or read. Summarize information from different spoken and written sources seamlessly.",
    totalUnits: 15,
    totalLessons: 150,
    units: [
      { unitNumber: 1, unitTitle: "Native Dialects, Accents & Registers", theme: "Linguistic Precision", moduleCount: 10 },
      { unitNumber: 2, unitTitle: "Oratory Eloquence & Keynote Mastery", theme: "Public Speaking", moduleCount: 10 },
      { unitNumber: 3, unitTitle: "Quantum Physics & Theoretical Science", theme: "Scientific Discourse", moduleCount: 10 },
      { unitNumber: 4, unitTitle: "Colloquial Slang & Subculture Idioms", theme: "Socio-Linguistics", moduleCount: 10 },
      { unitNumber: 5, unitTitle: "Simultaneous Interpretation Techniques", theme: "Translation Mastery", moduleCount: 10 },
      { unitNumber: 6, unitTitle: "Epistemology, Ethics & Moral Philosophy", theme: "Philosophy", moduleCount: 10 },
      { unitNumber: 7, unitTitle: "Arbitration & High-Stakes Litigation", theme: "Jurisprudence", moduleCount: 10 },
      { unitNumber: 8, unitTitle: "Subtle Literary Subtext & Poetry", theme: "Literature", moduleCount: 10 },
      { unitNumber: 9, unitTitle: "Neuro-Linguistic Programming in Oratory", theme: "Persuasion", moduleCount: 10 },
      { unitNumber: 10, unitTitle: "Macroeconomic Policy & Federal Reserve Rhetoric", theme: "Finance", moduleCount: 10 },
      { unitNumber: 11, unitTitle: "Advanced Scientific Peer Review Defense", theme: "Academia", moduleCount: 10 },
      { unitNumber: 12, unitTitle: "Crisis Keynote & Global Media Interviews", theme: "Executive PR", moduleCount: 10 },
      { unitNumber: 13, unitTitle: "Humor, Satire & Improvised Comedy Rhetoric", theme: "Pragmatic Command", moduleCount: 10 },
      { unitNumber: 14, unitTitle: "Cambridge C2 Proficiency (CPE) Masterclass", theme: "Exam Prep", moduleCount: 10 },
      { unitNumber: 15, unitTitle: "C2 Master Distinction & Final Thesis Defense", theme: "Grand Capstone", moduleCount: 10 },
    ]
  }
};

/**
 * Generates the full list of 900 Curriculum Modules for the entire master matrix
 */
export const generateMasterCurriculumModules = (): CurriculumModuleItem[] => {
  const levels: CEFRLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const modules: CurriculumModuleItem[] = [];
  let globalIndex = 1;

  levels.forEach((lvl) => {
    const levelMeta = CEFR_LEVEL_METADATA[lvl];
    levelMeta.units.forEach((unit) => {
      for (let m = 1; m <= unit.moduleCount; m++) {
        let category: "Grammar" | "Vocabulary" | "Listening" | "Speaking" | "Roleplay" | "Business" | "Academic" = "Speaking";
        if (m % 5 === 1) category = "Grammar";
        else if (m % 5 === 2) category = "Vocabulary";
        else if (m % 5 === 3) category = "Listening";
        else if (m % 5 === 4) category = "Roleplay";
        else if (lvl === "B2" || lvl === "C1") category = "Business";

        modules.push({
          id: `mod_${lvl}_u${unit.unitNumber}_m${m}`,
          level: lvl,
          unitNumber: unit.unitNumber,
          moduleNumber: m,
          globalLessonIndex: globalIndex,
          title: `${unit.unitTitle} - Module ${m}`,
          topic: `${unit.theme}: Focus Part ${m}`,
          category,
          estimatedMinutes: 12 + (m % 3) * 4,
          xpReward: 50 + (m * 10),
          isUnlocked: globalIndex <= 15 || lvl === "A1"
        });
        globalIndex++;
      }
    });
  });

  return modules;
};

export const MASTER_CURRICULUM_MODULES = generateMasterCurriculumModules();

/**
 * Generates a full, 13-part structured lesson on the fly with comprehensive educational details
 */
export const buildFullStructuredLesson = (
  level: CEFRLevel,
  unitNumber: number,
  moduleNumber: number
): FullCurriculumLesson => {
  const levelMeta = CEFR_LEVEL_METADATA[level] || CEFR_LEVEL_METADATA["B1"];
  const unitMeta = levelMeta.units.find((u) => u.unitNumber === unitNumber) || levelMeta.units[0];

  return {
    id: `full_lesson_${level}_u${unitNumber}_m${moduleNumber}`,
    level,
    unitNumber,
    moduleNumber,
    title: `${unitMeta.unitTitle} (Module ${moduleNumber})`,
    subtitle: `Level ${level} • ${unitMeta.theme} Focus`,
    category: "Roleplay",
    estimatedMinutes: 15,
    xpReward: 100,
    learningObjective: `By completing this lesson, you will master key sentence patterns, vocabulary, and natural conversational cadence for ${unitMeta.unitTitle} at CEFR level ${level}.`,
    grammarExplanation: {
      summary: `In ${unitMeta.unitTitle}, native English speakers utilize specific tense markers and clause structures to express precision and politeness.`,
      rules: [
        {
          ruleTitle: "Indirect Questions for Courtesy",
          explanation: "Use phrases like 'Could you please tell me...' or 'I was wondering if...' to soften requests.",
          example: "Could you tell me what time the conference begins?"
        },
        {
          ruleTitle: "Conditional Softening",
          explanation: "Use 'would like' or 'would appreciate' instead of 'want' during formal interactions.",
          example: "I would appreciate your feedback on this proposal."
        }
      ],
      commonMistakes: [
        {
          incorrect: "Can you tell me where is the gate?",
          correct: "Can you tell me where the gate is?",
          reason: "Indirect questions use standard word order (Subject + Verb), not inverted question order."
        }
      ]
    },
    vocabularyList: [
      {
        term: "Elaborate",
        phonetic: "/ɪˈlæbəreɪt/",
        partOfSpeech: "verb",
        definition: "To develop or present an idea or theory in detail.",
        example: "Could you please elaborate on your third point?",
        nativeTranslation: "Elaborar / Detallar"
      },
      {
        term: "Mitigate",
        phonetic: "/ˈmɪtɪɡeɪt/",
        partOfSpeech: "verb",
        definition: "To make something less severe, serious, or painful.",
        example: "We implemented new protocols to mitigate potential risks.",
        nativeTranslation: "Mitigar / Reducir"
      },
      {
        term: "Paramount",
        phonetic: "/ˈpærəmaʊnt/",
        partOfSpeech: "adjective",
        definition: "More important than anything else; supreme.",
        example: "Ensuring customer satisfaction is of paramount importance.",
        nativeTranslation: "Fundamental / De máxima importancia"
      }
    ],
    exampleSentences: [
      {
        english: "Not only did we launch on schedule, but we also exceeded our quarterly metrics.",
        nativeTranslation: "No solo lanzamos según lo previsto, sino que también superamos las métricas.",
        contextNote: "Inversion used for emphasis in executive presentations."
      },
      {
        english: "I'd be more than happy to facilitate a warm introduction.",
        nativeTranslation: "Estaría más que encantado de facilitar una presentación formal.",
        contextNote: "Standard professional business greeting connector."
      }
    ],
    listeningScript: {
      title: `${unitMeta.unitTitle} - Executive Dialogue`,
      audioText: "Listen to two native speakers navigating a high-stakes discussion.",
      speakers: [
        { speaker: "Sarah (US)", text: "Good morning! Thanks for making time to discuss our strategy for the upcoming quarter.", translation: "¡Buenos días! Gracias por hacer tiempo..." },
        { speaker: "David (UK)", text: "My pleasure, Sarah. I reviewed your outline, and I believe we have alignment on key objectives.", translation: "Un placer, Sarah. Revisé tu esquema..." }
      ],
      comprehensionCheck: [
        {
          question: "What is the primary topic of the conversation between Sarah and David?",
          options: ["Quarterly strategy alignment", "Budget cuts", "Hiring new staff", "Office relocation"],
          correctIndex: 0,
          explanation: "Sarah explicitly states they are meeting to discuss strategy for the upcoming quarter."
        }
      ]
    },
    speakingPractice: {
      targetPhrases: [
        {
          phrase: "I'd like to elaborate on that particular point.",
          phonetic: "/aɪd laɪk tuː ɪˈlæbəreɪt ɒn ðæt pəˈtɪkjələr pɔɪnt/",
          translation: "Me gustaría profundizar en ese punto en particular.",
          pronunciationTip: "Link 'elaborate-on' smoothly without stopping between words."
        },
        {
          phrase: "Ensuring clarity is of paramount importance to our team.",
          phonetic: "/ɪnˈʃʊərɪŋ ˈklærəti ɪz əv ˈpærəmaʊnt ɪmˈpɔːtəns tuː aʊər tiːm/",
          translation: "Garantizar la claridad es de máxima importancia para nuestro equipo.",
          pronunciationTip: "Stress the first syllable of 'PAR-a-mount'."
        }
      ],
      phonemeFocus: ["/æ/", "/ɪ/", "/eɪ/"]
    },
    aiConversationScenario: {
      scenarioTitle: `Live Practice: ${unitMeta.unitTitle}`,
      roleplayRole: "Senior Executive / Specialist",
      teacherRole: "AI Lead Facilitator",
      initialMessage: `Welcome to our ${unitMeta.unitTitle} session! How would you like to open our discussion today?`,
      suggestedResponses: [
        "I'd like to start by reviewing our primary objectives.",
        "Could you please elaborate on the current project status?",
        "Thank you for having me. I'm ready to share my feedback."
      ],
      contextGoal: "Practice natural openings, indirect questions, and clear articulate pronunciation."
    },
    pronunciationPractice: {
      stressPatterns: [
        { word: "ELABORATE", stressedSyllable: "e-LAB-o-rate", phonetic: "/ɪˈlæb.ə.reɪt/" },
        { word: "PARAMOUNT", stressedSyllable: "PAR-a-mount", phonetic: "/ˈpær.ə.maʊnt/" }
      ],
      minimalPairs: [
        { wordA: "ship", wordB: "sheep", difference: "Short /ɪ/ vs long /iː/" },
        { wordA: "pen", wordB: "pan", difference: "Short /e/ vs open /æ/" }
      ],
      intonationType: "Rising intonation for polite questions, falling intonation for statements."
    },
    exercises: [
      {
        id: "ex_1",
        type: "multiple_choice",
        prompt: "Choose the correct indirect question format:",
        options: [
          "Could you tell me where is the office?",
          "Could you tell me where the office is?",
          "Where is the office you can tell me?"
        ],
        correctAnswer: "Could you tell me where the office is?",
        hint: "In indirect questions, the subject comes before the verb."
      },
      {
        id: "ex_2",
        type: "fill_blank",
        prompt: "Ensuring security is of ________ importance. (Word meaning supreme/highest)",
        correctAnswer: "paramount",
        hint: "Starts with 'P'."
      }
    ],
    quiz: [
      {
        id: "q_1",
        question: "What does 'mitigate' mean in a professional context?",
        options: ["To increase risk", "To lessen or make milder", "To cancel a meeting", "To negotiate salary"],
        correctIndex: 1,
        explanation: "Mitigate means to make something less severe or reduce its negative impact."
      }
    ],
    homework: {
      assignmentTitle: "Executive Summary & Audio Recording Task",
      instructions: "Write a 3-paragraph response discussing a challenge you faced at work, then record a 1-minute voice note reading it aloud.",
      writingPrompt: "Describe a situation where clear communication mitigated a potential problem.",
      speakingTaskPrompt: "Record yourself pronouncing the 3 target vocabulary items with clear syllable stress."
    },
    aiEvaluationCriteria: {
      targetGrammarMastery: 85,
      targetVocabularyDiversity: 80,
      accuracyThresholdPercent: 85,
      keyFeedbackFocusPoints: [
        "Subject-verb agreement in complex clauses",
        "Clear stress on multi-syllable verbs",
        "Natural falling intonation at the end of declarative sentences"
      ]
    }
  };
};
