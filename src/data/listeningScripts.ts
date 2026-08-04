import { CEFRLevel, ListeningScriptItem } from "../types";

export const SAMPLE_LISTENING_SCRIPTS: ListeningScriptItem[] = [
  {
    id: "list_script_1",
    title: "BBC Style Report: The Rise of AI Language Coaches",
    category: "News Broadcast",
    cefrLevel: "B2",
    audioDurationSeconds: 120,
    speakers: [
      { name: "Julian Vance", accent: "British UK", avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
      { name: "Dr. Elena Rostova", accent: "European Int.", avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150" }
    ],
    transcript: [
      {
        speaker: "Julian Vance",
        text: "Good evening. Tonight we examine how artificial intelligence is democratizing bilingual education across six continents.",
        timestamp: "00:00",
        translation: "Buenas noches. Esta noche examinamos cómo la inteligencia artificial está democratizando la educación bilingüe..."
      },
      {
        speaker: "Dr. Elena Rostova",
        text: "Indeed, Julian. Traditional language barriers are dissolving as personalized AI avatars provide instant speech phoneme analysis and 24/7 conversational immersion.",
        timestamp: "00:18",
        translation: "De hecho, Julian. Las barreras lingüísticas tradicionales se están disolviendo..."
      }
    ],
    comprehensionQuiz: [
      {
        question: "According to Dr. Rostova, what is the primary benefit of personalized AI avatars?",
        options: [
          "They replace human passports",
          "They provide instant speech phoneme analysis and 24/7 conversational practice",
          "They reduce hotel prices",
          "They translate textbooks only"
        ],
        correctIndex: 1,
        explanation: "Dr. Rostova states that AI avatars offer instant phoneme feedback and 24/7 immersion."
      }
    ]
  },
  {
    id: "list_script_2",
    title: "Global Tech Podcast: Future of Remote Work & Communication",
    category: "Podcast Dialogue",
    cefrLevel: "B1",
    audioDurationSeconds: 90,
    speakers: [
      { name: "Alex Chen", accent: "American US", avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { name: "Maya Lin", accent: "Singaporean US", avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150" }
    ],
    transcript: [
      {
        speaker: "Alex Chen",
        text: "Maya, how do global distributed teams maintain strong cohesion without face-to-face meetings?",
        timestamp: "00:00",
        translation: "Maya, ¿cómo mantienen una fuerte cohesión los equipos distribuidos globalmente...?"
      },
      {
        speaker: "Maya Lin",
        text: "Clear asynchronous documentation, daily standup voice notes, and structured feedback loops are paramount.",
        timestamp: "00:12",
        translation: "La documentación asíncrona clara, las notas de voz diarias y las retroalimentaciones estructuradas son fundamentales."
      }
    ],
    comprehensionQuiz: [
      {
        question: "What does Maya highlight as paramount for remote teams?",
        options: [
          "In-person weekend retreats",
          "Asynchronous documentation and daily voice standups",
          "Longer working hours",
          "Using email only"
        ],
        correctIndex: 1,
        explanation: "Maya emphasizes clear asynchronous documentation and voice standups."
      }
    ]
  }
];

export const getListeningScriptsByLevel = (levelFilter?: CEFRLevel): ListeningScriptItem[] => {
  if (!levelFilter) return SAMPLE_LISTENING_SCRIPTS;
  return SAMPLE_LISTENING_SCRIPTS.filter((s) => s.cefrLevel === levelFilter);
};
