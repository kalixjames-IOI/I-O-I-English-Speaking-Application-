import { AITeacher, CEFRLevel, LessonUnit, QuizQuestion, UserProfile } from "../types";

export const NATIVE_LANGUAGES = [
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "zh", name: "Chinese (Mandarin)", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "pt", name: "Portuguese", flag: "🇧🇷" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "th", name: "Thai", flag: "🇹🇭" }
];

export const LEARNING_GOALS = [
  { id: "daily", title: "Daily Conversation & Socializing", icon: "MessageCircle", description: "Talk naturally with friends, locals, and strangers." },
  { id: "fluency", title: "Speaking Fluency & Accent Reduction", icon: "Mic", description: "Build confidence, reduce hesitations, and speak clearly." },
  { id: "business", title: "Professional & Business English", icon: "Briefcase", description: "Excel in meetings, emails, pitches, and negotiations." },
  { id: "travel", title: "Travel & Culture Explorer", icon: "Compass", description: "Order food, navigate airports, and ask for directions." },
  { id: "interview", title: "Job Interview Mastery", icon: "Award", description: "Land global tech and corporate positions with top responses." },
  { id: "exam", title: "IELTS / TOEFL Academic Exam Prep", icon: "GraduationCap", description: "Score Band 7.5+ in speaking and essay writing." }
];

export const AI_TEACHERS: AITeacher[] = [
  {
    id: "emma",
    name: "Emma",
    title: "Conversational & Accent Coach",
    accent: "American (California)",
    flag: "🇺🇸",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80",
    voiceName: "Kore",
    specialty: "Daily Conversation & American Pronunciation",
    personality: "Warm, energetic, super encouraging, uses relatable real-world examples.",
    bio: "Former TESOL Lead Educator in San Francisco. Emma focuses on connected speech, reduction of heavy accents, and relaxed everyday chat.",
    sampleAudioText: "Hey there! I'm Emma. Ready to turn your English from hesitant to totally natural?"
  },
  {
    id: "liam",
    name: "Liam",
    title: "Executive & Business English Specialist",
    accent: "British (RP Standard)",
    flag: "🇬🇧",
    avatarUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80",
    voiceName: "Fenrir",
    specialty: "Corporate Communication & Negotiations",
    personality: "Articulate, professional, structured, polished, gives precise corporate feedback.",
    bio: "Oxford graduate and corporate consultant. Liam prepares learners for high-stakes presentations, executive pitch meetings, and diplomacy.",
    sampleAudioText: "Good day. I am Liam. Let us refine your vocabulary for executive presence and impact."
  },
  {
    id: "sophia",
    name: "Sophia",
    title: "Travel & Grammar Master",
    accent: "Australian",
    flag: "🇦🇺",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80",
    voiceName: "Zephyr",
    specialty: "Travel English, Idioms & Intuitive Grammar",
    personality: "Adventurous, friendly, playful, breaks down tricky grammar effortlessly.",
    bio: "Travel journalist and polyglot based in Sydney. Sophia makes grammar feel like a fun puzzle rather than boring memorization.",
    sampleAudioText: "G'day! I'm Sophia. Grab your passport and let's explore English idioms together!"
  },
  {
    id: "alexander",
    name: "Prof. Alexander",
    title: "Academic & Exam Examiner",
    accent: "American (East Coast)",
    flag: "🇺🇸",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    voiceName: "Charon",
    specialty: "C1/C2 Mastery, IELTS, TOEFL & Academic Writing",
    personality: "Scholarly, precise, insightful, deep vocabulary specialist.",
    bio: "Former University Professor and IELTS examiner. Dr. Alexander specializes in advanced rhetoric, complex clause syntax, and essay structure.",
    sampleAudioText: "Greetings. I am Professor Alexander. We shall elevate your discourse to C2 native proficiency."
  },
  {
    id: "maya",
    name: "Maya",
    title: "Interview & Career Coach",
    accent: "Global Neutral / Indian Professional",
    flag: "🌐",
    avatarUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&auto=format&fit=crop&q=80",
    voiceName: "Puck",
    specialty: "Tech & Corporate Job Interviews",
    personality: "Empathetic, sharp, motivating, behavioral interview expert.",
    bio: "Tech recruiter and career coach. Maya guides candidates through behavioral STAR method questions and compensation negotiation.",
    sampleAudioText: "Hi! I'm Maya. Let's make sure you ace your next big job interview with absolute confidence."
  }
];

export const PLACEMENT_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    category: "Grammar & Structure",
    level: "A1",
    question: "Choose the correct sentence to introduce yourself:",
    options: [
      "I am study English every day.",
      "My name is Alex and I am from Japan.",
      "Me name Alex and live in Tokyo.",
      "I has name Alex and come from Japan."
    ],
    correctIndex: 1,
    explanation: "'My name is...' and 'I am from...' are standard present simple structures for self-introductions."
  },
  {
    id: "q2",
    category: "Tenses",
    level: "A2",
    question: "Complete the sentence: 'While I _____ to work yesterday, it started raining.'",
    options: ["was walking", "walked", "am walking", "have walked"],
    correctIndex: 0,
    explanation: "Past Continuous ('was walking') is used for an action in progress interrupted by a Past Simple event ('started')."
  },
  {
    id: "q3",
    category: "Vocabulary & Context",
    level: "B1",
    question: "Which word best completes: 'She decided to _____ the job offer because the salary was too low.'",
    options: ["turn down", "turn on", "turn over", "turn up"],
    correctIndex: 0,
    explanation: "The phrasal verb 'turn down' means to reject or decline an offer."
  },
  {
    id: "q4",
    category: "Conditionals",
    level: "B2",
    question: "Select the grammatically correct 3rd conditional sentence:",
    options: [
      "If I studied harder, I would pass the test.",
      "If I had known about the meeting, I would have attended.",
      "If I know about the meeting, I will go.",
      "If I have known about the meeting, I would attend."
    ],
    correctIndex: 1,
    explanation: "Third Conditional structure is: If + Past Perfect ('had known'), would have + past participle ('would have attended')."
  },
  {
    id: "q5",
    category: "Advanced Rhetoric",
    level: "C1",
    question: "Choose the synonym for 'meticulous':",
    options: ["Careless and hasty", "Extremely precise and thorough", "Uncertain and vague", "Aggressive"],
    correctIndex: 1,
    explanation: "'Meticulous' means showing great attention to detail; careful and precise."
  }
];

export const SAMPLE_CURRICULUM_UNITS: LessonUnit[] = [
  // A1 Units
  {
    id: "a1-u1",
    level: "A1",
    unitNumber: 1,
    title: "Essential Greetings & First Impressions",
    subtitle: "Master everyday greetings, self-introductions, and friendly pleasantries.",
    category: "Speaking",
    estimatedMinutes: 10,
    xpReward: 50,
    content: {
      explanation: "In English, greetings depend on formal vs informal contexts. Practice saying these with natural rhythm.",
      vocabulary: [
        { term: "Pleased to meet you", phonetic: "/pliːzd tuː miːt juː/", definition: "Formal greeting when meeting someone new", example: "Pleased to meet you, Mr. Smith.", translation: "Gusto en conocerle" },
        { term: "How's it going?", phonetic: "/haʊz ɪt ˈɡəʊɪŋ/", definition: "Casual informal greeting meaning 'How are you?'", example: "Hey Sarah, how's it going?", translation: "¿Cómo te va?" },
        { term: "Have a great day", phonetic: "/hæv ə ɡreɪt deɪ/", definition: "Polite farewell phrase", example: "Thanks for the help! Have a great day!", translation: "Que tengas un buen día" }
      ],
      speakingPrompts: [
        { id: "p1", phrase: "Hello! My name is Alex, nice to meet you.", phonetic: "/həˈləʊ maɪ neɪm ɪz ˈælɪks naɪs tuː miːt juː/", translation: "¡Hola! Mi nombre es Alex, encantado de conocerte.", hint: "Stress 'Alex' and 'meet'." },
        { id: "p2", phrase: "I'm learning English with IOI Education.", phonetic: "/aɪm ˈlɜːnɪŋ ˈɪŋɡlɪʃ wɪð aɪ-əʊ-aɪ eʤʊˈkeɪʃən/", translation: "Estoy aprendiendo inglés con IOI Education.", hint: "Blend 'learning' and 'English'." }
      ],
      quizQuestions: [
        {
          id: "a1q1",
          question: "Which greeting is most appropriate for a formal job interview?",
          options: ["What's up bro?", "Pleased to meet you, sir.", "Catch you later!", "Hey buddy!"],
          correctIndex: 1,
          explanation: "'Pleased to meet you, sir' is polite and formal."
        }
      ]
    }
  },
  {
    id: "a1-u2",
    level: "A1",
    unitNumber: 2,
    title: "Ordering Coffee & Food in English",
    subtitle: "Navigate cafés and restaurants with polite request structures.",
    category: "Roleplay",
    estimatedMinutes: 12,
    xpReward: 60,
    content: {
      explanation: "Use 'Could I please have...' or 'I'd like...' to sound courteous.",
      vocabulary: [
        { term: "I'd like...", phonetic: "/aɪd laɪk/", definition: "Polite way to say 'I want'", example: "I'd like an oat milk latte, please.", translation: "Me gustaría..." },
        { term: "To go / Takeaway", phonetic: "/tuː ɡəʊ/", definition: "Food or drink taken outside the café", example: "Can I get a cappuccino to go?", translation: "Para llevar" }
      ],
      audioDialogue: [
        { speaker: "Barista", text: "Hi there! What can I get started for you today?", translation: "¡Hola! ¿Qué puedo ofrecerle hoy?" },
        { speaker: "Learner", text: "Hi! Could I please get a medium iced coffee to go?", translation: "¡Hola! ¿Podría pedir un café helado mediano para llevar?" },
        { speaker: "Barista", text: "Sure thing! That will be $4.50.", translation: "¡Claro! Serán $4.50." }
      ],
      speakingPrompts: [
        { id: "p3", phrase: "Could I please get an iced latte to go?", phonetic: "/kʊd aɪ pliːz ɡet æn aɪst ˈlɑːteɪ tuː ɡəʊ/", translation: "¿Podría darme un latte helado para llevar?", hint: "Soft 'd' sound in 'could I'." }
      ]
    }
  },

  // B1 Units
  {
    id: "b1-u1",
    level: "B1",
    unitNumber: 1,
    title: "Expressing Opinions & Debating Ideas",
    subtitle: "Learn diplomatic ways to agree, disagree, and give reasoning.",
    category: "Speaking",
    estimatedMinutes: 15,
    xpReward: 80,
    content: {
      explanation: "When sharing opinions in professional settings, use hedging techniques like 'From my perspective' or 'I tend to think'.",
      vocabulary: [
        { term: "From my perspective", phonetic: "/frɒm maɪ pəˈspektɪv/", definition: "Phrase to introduce a personal opinion gracefully", example: "From my perspective, remote work increases productivity.", translation: "Desde mi perspectiva" },
        { term: "I see your point, but...", phonetic: "/aɪ siː jɔː pɔɪnt bʌt/", definition: "Diplomatic disagreement starter", example: "I see your point, but we need to consider the budget.", translation: "Entiendo tu punto, pero..." }
      ],
      speakingPrompts: [
        { id: "p4", phrase: "From my perspective, artificial intelligence will revolutionize education.", phonetic: "/frɒm maɪ pəˈspektɪv ˌɑːtɪˈfɪʃəl ɪnˈtelɪʤəns wɪl ˌrevəˈluːʃənaɪz ˌedjʊˈkeɪʃən/", translation: "Desde mi perspectiva, la inteligencia artificial revolucionará la educación.", hint: "Emphasize 'revolutionize'." }
      ]
    }
  },
  {
    id: "b1-u2",
    level: "B1",
    unitNumber: 2,
    title: "Navigating Airport & Border Control",
    subtitle: "Answer customs questions confidently with key vocabulary.",
    category: "Roleplay",
    estimatedMinutes: 15,
    xpReward: 85,
    content: {
      explanation: "Border agents ask about purpose of visit, length of stay, and accommodation.",
      vocabulary: [
        { term: "Purpose of visit", phonetic: "/ˈpɜːpəs ɒv ˈvɪzɪt/", definition: "Reason for traveling to a country", example: "The purpose of my visit is business and tourism.", translation: "Motivo de la visita" },
        { term: "Duration of stay", phonetic: "/djʊəˈreɪʃən ɒv steɪ/", definition: "How long you will stay", example: "My duration of stay is ten days.", translation: "Duración de la estancia" }
      ],
      speakingPrompts: [
        { id: "p5", phrase: "I'm traveling for business and will be staying for two weeks.", phonetic: "/aɪm ˈtrævlɪŋ fɔː ˈbɪznɪs ænd wɪl biː ˈsteɪɪŋ fɔː tuː wiːks/", translation: "Viajo por negocios y me quedaré dos semanas.", hint: "Keep rhythm smooth." }
      ]
    }
  },

  // C1/C2 Units
  {
    id: "c1-u1",
    level: "C1",
    unitNumber: 1,
    title: "Executive Presentations & Nuanced Rhetoric",
    subtitle: "Deliver high-impact corporate pitches and command attention.",
    category: "Grammar",
    estimatedMinutes: 20,
    xpReward: 120,
    content: {
      explanation: "Invert sentences for dramatic emphasis: 'Not only did we surpass our targets, but we also expanded internationally.'",
      vocabulary: [
        { term: "Paradigm shift", phonetic: "/ˈpærədaɪm ʃɪft/", definition: "A fundamental change in approach or underlying assumptions", example: "Generative AI represents a paradigm shift in tech.", translation: "Cambio de paradigma" },
        { term: "Mitigate risk", phonetic: "/ˈmɪtɪɡeɪt rɪsk/", definition: "To make a risk less severe or less impactful", example: "We implemented strict protocols to mitigate risk.", translation: "Mitigar riesgos" }
      ],
      speakingPrompts: [
        { id: "p6", phrase: "Not only did we spearhead innovation, but we also mitigated potential market risks.", phonetic: "/nɒt ˈəʊnlɪ dɪd wiː ˈspɪəhed ˌɪnəˈveɪʃən bʌt wiː ˈɔːlsəʊ ˈmɪtɪɡeɪtɪd pəˈtenʃəl ˈmɑːkɪt rɪsks/", translation: "No solo lideramos la innovación, sino que también mitigamos riesgos potenciales del mercado.", hint: "Dramatic pitch drop on 'innovation'." }
      ]
    }
  }
];

export const INITIAL_USER: UserProfile = {
  id: "user-1001",
  name: "Alex Vance",
  email: "alex.vance@example.com",
  nativeLanguage: "Spanish",
  currentLevel: "B1",
  targetGoal: "Speaking Fluency & Professional English",
  dailyMinutesGoal: 15,
  learningStyle: "Interactive Voice",
  streakDays: 7,
  totalXp: 1240,
  fluencyScore: 78,
  plan: "free",
  completedLessonIds: ["a1-u1"],
  savedVocabulary: [
    {
      word: "Resilience",
      phonetic: "/rɪˈzɪlɪəns/",
      definition: "The capacity to recover quickly from difficulties; toughness.",
      example: "Her resilience during the crisis inspired the entire team.",
      nativeTranslation: "Resiliencia / Capacidad de adaptación",
      dateAdded: "2026-08-01"
    },
    {
      word: "Fluency",
      phonetic: "/ˈfluːənsi/",
      definition: "The ability to speak or write a language easily and accurately.",
      example: "Daily speaking practice with IOI AI teachers improves fluency rapidly.",
      nativeTranslation: "Fluidez",
      dateAdded: "2026-08-02"
    }
  ]
};
