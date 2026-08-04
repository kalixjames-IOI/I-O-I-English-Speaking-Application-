import React, { useState } from "react";
import { UserProfile, CEFRLevel } from "../types";
import { Sparkles, RefreshCw, Volume2, MessageSquare, BookOpen, Layers } from "lucide-react";

interface AiContentStudioProps {
  user: UserProfile;
}

export const AiContentStudio: React.FC<AiContentStudioProps> = ({ user }) => {
  const [topicPrompt, setTopicPrompt] = useState("");
  const [selectedCEFR, setSelectedCEFR] = useState<CEFRLevel>(user.currentLevel || "B1");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);

  const sampleTopics = [
    "Ordering at a Michelin-Star Restaurant in London",
    "Tech Startup Pitch Meeting & Investor Q&A",
    "Aviation & Airport Customs Navigation",
    "Medical Doctor Appointment & Describing Symptoms",
    "Job Offer Salary & Equity Negotiation"
  ];

  const handleGenerate = async (customTopic?: string) => {
    const topic = customTopic || topicPrompt;
    if (!topic.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/gemini/generate-custom-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          cefrLevel: selectedCEFR,
          userGoal: user.targetGoal
        })
      });

      const data = await response.json();
      setGeneratedLesson(data);
    } catch (err) {
      console.error("Content generation error:", err);
      setGeneratedLesson({
        title: `Mastering ${topic}`,
        cefrLevel: selectedCEFR,
        description: `Custom interactive lesson unit for ${topic}.`,
        dialogue: [
          { speaker: "Native Speaker", text: `Welcome! Let's discuss ${topic}. What are your thoughts?`, translation: "¡Bienvenido! Discutamos este tema..." },
          { speaker: "Learner", text: "I'd love to share my experience.", translation: "Me encantaría compartir mi experiencia." }
        ],
        vocabularyList: [
          { term: "Negotiation", phonetic: "/nɪˌɡəʊʃiˈeɪʃən/", definition: "Discussion aimed at reaching an agreement." }
        ],
        speakingPrompts: [`How do you handle ${topic} in your native language?`]
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full space-y-6 p-4 sm:p-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 border border-slate-800 p-5 rounded-3xl space-y-2">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-bold text-white">AI On-Demand Content Studio</h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
          Type any custom scenario, industry topic, or roleplay situational prompt to generate instant custom lessons with dialogues and vocabulary lists.
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">What scenario or topic would you like to practice?</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={topicPrompt}
              onChange={(e) => setTopicPrompt(e.target.value)}
              placeholder="e.g. Renting an apartment in New York City..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={() => handleGenerate()}
              disabled={!topicPrompt.trim() || isGenerating}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-lg transition-all cursor-pointer shrink-0"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Generate"}
            </button>
          </div>
        </div>

        {/* Quick Sample Prompts */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Popular AI Roleplay Prompts:</span>
          <div className="flex flex-wrap gap-1.5">
            {sampleTopics.map((t, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicPrompt(t);
                  handleGenerate(t);
                }}
                className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-indigo-300 transition-all cursor-pointer"
              >
                + {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generating Spinner */}
      {isGenerating && (
        <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">Gemini AI Generating Custom Lesson...</h4>
            <p className="text-xs text-slate-400">Crafting realistic dialogues, phonemes, and vocabulary lists</p>
          </div>
        </div>
      )}

      {/* Generated Lesson Content */}
      {generatedLesson && !isGenerating && (
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white">{generatedLesson.title}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
              CEFR {generatedLesson.cefrLevel}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{generatedLesson.description}</p>

          {/* Dialogue Section */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-indigo-400">Practical Roleplay Dialogue:</span>
            <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
              {generatedLesson.dialogue?.map((d: any, idx: number) => (
                <div key={idx} className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-400">{d.speaker}</span>
                    <button onClick={() => speakText(d.text)} className="text-slate-400 hover:text-indigo-300">
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-200">{d.text}</p>
                  {d.translation && <p className="text-[11px] text-slate-400 italic">🌐 {d.translation}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Key Vocabulary List */}
          {generatedLesson.vocabularyList?.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-400">Essential Vocabulary List:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {generatedLesson.vocabularyList.map((v: any, idx: number) => (
                  <div key={idx} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700 text-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{v.term}</span>
                      <span className="text-[10px] text-indigo-300 font-mono">{v.phonetic}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{v.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
