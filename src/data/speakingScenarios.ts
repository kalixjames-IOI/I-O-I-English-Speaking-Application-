import { CEFRLevel, SpeakingScenarioItem } from "../types";

export const SAMPLE_SPEAKING_SCENARIOS: SpeakingScenarioItem[] = [
  // 1. Business
  {
    id: "scen_biz_1",
    title: "Quarterly Performance Review with Manager",
    category: "Business",
    cefrLevel: "B2",
    userRole: "Senior Marketing Lead",
    aiTeacherRole: "Department Director",
    situationDescription: "Discuss your accomplishments, key ROI metrics, areas for leadership growth, and negotiate budget allocation for the next quarter.",
    targetVocabulary: ["Deliverables", "KPIs", "Bandwidth", "Scalability", "Optimization"],
    starterPhrase: "Good morning! Thank you for scheduling time for our quarterly review. I'd love to highlight our recent campaign results.",
    difficultyRating: 4
  },
  {
    id: "scen_biz_2",
    title: "Salary & Compensation Equity Negotiation",
    category: "Negotiations",
    cefrLevel: "C1",
    userRole: "Software Engineering Candidate",
    aiTeacherRole: "VP of Human Resources",
    situationDescription: "Politely negotiate stock option vesting, remote flexibility, and a 15% base salary adjustment based on market research.",
    targetVocabulary: ["Benchmark", "Vesting schedule", "Compensation package", "Value proposition", "Equity"],
    starterPhrase: "Thank you for extending this offer! I am thrilled about the role. Based on my industry benchmark data, I'd like to discuss the base package.",
    difficultyRating: 5
  },

  // 2. Travel & Customs
  {
    id: "scen_travel_1",
    title: "Heathrow Airport Customs & Baggage Check",
    category: "Flight & Customs",
    cefrLevel: "A2",
    userRole: "International Traveler",
    aiTeacherRole: "UK Border Control Officer",
    situationDescription: "Answer border questions regarding your stay duration, hotel reservation address, return ticket, and reason for visiting London.",
    targetVocabulary: ["Passport", "Boarding pass", "Declaration", "Itinerary", "Sightseeing"],
    starterPhrase: "Good day officer. Here is my passport and landed customs declaration form.",
    difficultyRating: 2
  },
  {
    id: "scen_travel_2",
    title: "Boutique Hotel Room Upgrade & Special Requests",
    category: "Travel",
    cefrLevel: "B1",
    userRole: "Hotel Guest",
    aiTeacherRole: "Front Desk Concierge",
    situationDescription: "Politely inquire if a quiet upper-floor room with a skyline view is available and request late check-out.",
    targetVocabulary: ["Reservation", "Complimentary", "Amenities", "High floor", "Late check-out"],
    starterPhrase: "Hello! I have a reservation under my name. Could you tell me if there are any high-floor quiet rooms available tonight?",
    difficultyRating: 3
  },

  // 3. Tech & AI
  {
    id: "scen_tech_1",
    title: "AI Product Feature Tech Demo to Investors",
    category: "Tech & Engineering",
    cefrLevel: "B2",
    userRole: "Startup Co-Founder",
    aiTeacherRole: "Lead Angel Investor",
    situationDescription: "Present your new AI app's latency performance, user retention metrics, and explain how Gemini models power real-time speech.",
    targetVocabulary: ["Machine learning", "Low latency", "User interface", "Retention rate", "Scalable backend"],
    starterPhrase: "Welcome everyone! Today I am excited to demonstrate how our proprietary AI engine reduces speech latency to sub-300 milliseconds.",
    difficultyRating: 4
  },

  // 4. Healthcare & Medical
  {
    id: "scen_health_1",
    title: "Doctor's Appointment & Describing Symptoms",
    category: "Healthcare",
    cefrLevel: "B1",
    userRole: "Patient",
    aiTeacherRole: "General Practitioner",
    situationDescription: "Describe persistent headache symptoms, duration, pain scale (1-10), and ask for prescription recommendations.",
    targetVocabulary: ["Symptom", "Persist", "Prescription", "Throbbing pain", "Medication"],
    starterPhrase: "Hello Doctor. I've been experiencing a persistent throbbing headache for the past three days.",
    difficultyRating: 3
  },

  // 5. Emergency
  {
    id: "scen_emerg_1",
    title: "Reporting Lost Passport to Local Police Station",
    category: "Emergency",
    cefrLevel: "A2",
    userRole: "Distressed Tourist",
    aiTeacherRole: "Police Desk Sergeant",
    situationDescription: "Explain where you last saw your backpack, provide description, and obtain an official police incident report for your embassy.",
    targetVocabulary: ["Stolen", "Description", "Police report", "Embassy", "Identification"],
    starterPhrase: "Excuse me, officer. I need to file an urgent police report. My backpack containing my passport was misplaced near the train station.",
    difficultyRating: 2
  }
];

export const getScenariosByCategoryAndLevel = (
  categoryFilter?: string,
  levelFilter?: CEFRLevel
): SpeakingScenarioItem[] => {
  let list = [...SAMPLE_SPEAKING_SCENARIOS];

  if (categoryFilter && categoryFilter !== "All Categories") {
    list = list.filter((s) => s.category === categoryFilter);
  }

  if (levelFilter) {
    list = list.filter((s) => s.cefrLevel === levelFilter);
  }

  return list;
};
