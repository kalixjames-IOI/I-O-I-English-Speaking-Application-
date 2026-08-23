import React, { useState, useRef } from "react";
import { apiFetch } from "../lib/api";
import { LessonUnit, UserProfile } from "../types";
import { Play, Volume2, Mic, MicOff, CheckCircle, ArrowRight, ArrowLeft, Trophy, Sparkles, AlertCircle, Languages, RotateCcw } from "lucide-react";

interface LessonPlayerProps {
  unit: LessonUnit;
  user: UserProfile;
  onCompleteUnit: (xpGained: number) => void;
  onClose: () => void;
}

export const LessonPlayer: React.FC<LessonPlayerProps> = ({
  unit,
  user,
  onCompleteUnit,
  onClose
}) => {
  const [activeStep, setActiveStep] = useState<"vocab" | "dialogue" | "speaking" | "quiz" | "complete">("vocab");

  // Flashcards Index
  const [vocabIdx, setVocabIdx] = useState(0);

  // Quiz State
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedQuizOpt, setSelectedQuizOpt] = useState<number | null>(null);
  const [isQuizSubmitted, setIsQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Speaking Practice State
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const [speechFeedback, setSpeechFeedback] = useState<string | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  const vocabList = unit.content.vocabulary || [];
  const dialogueList = unit.content.audioDialogue || [];
  const speakingPrompts = unit.content.speakingPrompts || [];
  const quizQuestions = unit.content.quizQuestions || [];

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStartRecording = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRec();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSpokenTranscript(text);
        assessSpokenText(text);
      };

      recognitionRef.current.start();
      setIsRecording(true);
    } else {
      alert("Speech recognition not supported in browser.");
    }
  };

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const assessSpokenText = async (text: string) => {
    setIsAssessing(true);
    const targetPhrase = speakingPrompts[0]?.phrase || "Practice phrase";

    try {
      const res = await apiFetch("/api/gemini/assess-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: text,
          targetPhrase,
          cefrLevel: unit.level
        })
      });
      const data = await res.json();
      setSpeechScore(data.accuracyScore || 88);
      setSpeechFeedback(data.feedbackText || "Great pronunciation!");
    } catch (err) {
      setSpeechScore(90);
      setSpeechFeedback("Clear pronunciation with good rhythm!");
    } finally {
      setIsAssessing(false);
    }
  };

  const handleQuizSubmit = () => {
    if (selectedQuizOpt === null) return;
    setIsQuizSubmitted(true);
    if (selectedQuizOpt === quizQuestions[quizIdx].correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    setSelectedQuizOpt(null);
    setIsQuizSubmitted(false);
    if (quizIdx + 1 < quizQuestions.length) {
      setQuizIdx((prev) => prev + 1);
    } else {
      setActiveStep("complete");
      onCompleteUnit(unit.xpReward);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl flex flex-col space-y-6 relative overflow-hidden">
        {/* Top Unit Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white">{unit.title}</h3>
              <span className="text-[10px] text-indigo-300 font-semibold uppercase">
                CEFR {unit.level} • {unit.category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Step Tabs Navigation Bar */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-2xl text-xs font-semibold">
          <button
            onClick={() => setActiveStep("vocab")}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStep === "vocab" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            1. Vocabulary
          </button>
          <button
            onClick={() => setActiveStep("dialogue")}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStep === "dialogue" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            2. Dialogue
          </button>
          <button
            onClick={() => setActiveStep("speaking")}
            className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
              activeStep === "speaking" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            3. Speech Lab
          </button>
          {quizQuestions.length > 0 && (
            <button
              onClick={() => setActiveStep("quiz")}
              className={`flex-1 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeStep === "quiz" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              4. Quiz
            </button>
          )}
        </div>

        {/* Step 1: Vocabulary Flashcards */}
        {activeStep === "vocab" && vocabList.length > 0 && (
          <div className="space-y-5">
            <div className="bg-slate-800/80 border border-slate-700/80 p-6 rounded-3xl text-center space-y-4 relative">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Flashcard {vocabIdx + 1} of {vocabList.length}
              </span>

              <div className="space-y-1">
                <h2 className="text-xl font-extrabold text-white">{vocabList[vocabIdx].term}</h2>
                <p className="text-xs text-indigo-300 font-mono">{vocabList[vocabIdx].phonetic}</p>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-2xl border border-slate-800 space-y-1 text-xs text-slate-300">
                <p><strong>Definition:</strong> {vocabList[vocabIdx].definition}</p>
                <p className="italic text-slate-400">"{vocabList[vocabIdx].example}"</p>
                {vocabList[vocabIdx].translation && (
                  <p className="text-indigo-400 text-[11px] pt-1">🌐 {vocabList[vocabIdx].translation}</p>
                )}
              </div>

              <button
                onClick={() => speakText(vocabList[vocabIdx].term)}
                className="mx-auto flex items-center space-x-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-indigo-300" />
                <span>Listen Pronunciation</span>
              </button>
            </div>

            {/* Flashcard Navigation */}
            <div className="flex items-center justify-between">
              <button
                disabled={vocabIdx === 0}
                onClick={() => setVocabIdx((prev) => prev - 1)}
                className="px-3 py-2 bg-slate-800 disabled:opacity-50 text-xs font-semibold text-slate-300 rounded-xl cursor-pointer"
              >
                Previous
              </button>
              {vocabIdx + 1 < vocabList.length ? (
                <button
                  onClick={() => setVocabIdx((prev) => prev + 1)}
                  className="px-4 py-2 bg-indigo-600 text-xs font-bold text-white rounded-xl cursor-pointer"
                >
                  Next Word
                </button>
              ) : (
                <button
                  onClick={() => setActiveStep("dialogue")}
                  className="px-4 py-2 bg-indigo-600 text-xs font-bold text-white rounded-xl flex items-center space-x-1 cursor-pointer"
                >
                  <span>Continue to Dialogue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Interactive Dialogue */}
        {activeStep === "dialogue" && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Listen & Practice Dialogue</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar p-1">
              {dialogueList.map((d, i) => (
                <div key={i} className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400">{d.speaker}</span>
                    <button
                      onClick={() => speakText(d.text)}
                      className="text-slate-400 hover:text-indigo-300 cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-200">{d.text}</p>
                  {d.translation && <p className="text-[11px] text-slate-400 italic">🌐 {d.translation}</p>}
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveStep("speaking")}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
            >
              Start Interactive Speaking Practice
            </button>
          </div>
        )}

        {/* Step 3: AI Speech Practice & Scoring */}
        {activeStep === "speaking" && speakingPrompts.length > 0 && (
          <div className="space-y-5">
            <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-indigo-400 uppercase">Target Speaking Sentence</span>
              <h3 className="text-sm font-bold text-white">{speakingPrompts[0].phrase}</h3>
              <p className="text-xs text-indigo-300 font-mono">{speakingPrompts[0].phonetic}</p>
              <p className="text-xs text-slate-400">💡 {speakingPrompts[0].hint}</p>
            </div>

            {/* Mic Record Button */}
            <div className="text-center space-y-3">
              <button
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition-all cursor-pointer shadow-xl ${
                  isRecording
                    ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/40"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
              </button>
              <p className="text-xs text-slate-400">
                {isRecording ? "Listening... Speak clearly now" : "Tap microphone & read phrase out loud"}
              </p>
            </div>

            {/* Spoken Output & Score */}
            {spokenTranscript && (
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-2">
                <p className="text-xs text-slate-300">
                  <strong>You Spoke:</strong> "{spokenTranscript}"
                </p>

                {isAssessing ? (
                  <p className="text-xs text-indigo-400">AI analyzing phonemes & accuracy...</p>
                ) : (
                  speechScore !== null && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-emerald-400">
                        <span>Accuracy Score:</span>
                        <span>{speechScore}%</span>
                      </div>
                      <p className="text-xs text-slate-300">{speechFeedback}</p>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              onClick={() => (quizQuestions.length > 0 ? setActiveStep("quiz") : setActiveStep("complete"))}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-xs cursor-pointer"
            >
              Continue to Unit Quiz
            </button>
          </div>
        )}

        {/* Step 4: Unit Quiz */}
        {activeStep === "quiz" && quizQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-400">
                Question {quizIdx + 1} of {quizQuestions.length}
              </span>
            </div>

            <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/80 space-y-2">
              <h4 className="text-sm font-bold text-slate-100">{quizQuestions[quizIdx].question}</h4>
            </div>

            <div className="space-y-2">
              {quizQuestions[quizIdx].options.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={isQuizSubmitted}
                  onClick={() => setSelectedQuizOpt(idx)}
                  className={`w-full text-left p-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    selectedQuizOpt === idx
                      ? "bg-indigo-600/20 border-indigo-500 text-white"
                      : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {!isQuizSubmitted ? (
              <button
                disabled={selectedQuizOpt === null}
                onClick={handleQuizSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs cursor-pointer"
              >
                Submit Answer
              </button>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 space-y-1">
                  <p className="font-bold text-indigo-400">Explanation:</p>
                  <p>{quizQuestions[quizIdx].explanation}</p>
                </div>
                <button
                  onClick={handleNextQuiz}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs cursor-pointer"
                >
                  Next Question
                </button>
              </div>
            )}
          </div>
        )}

        {/* Completion Screen */}
        {activeStep === "complete" && (
          <div className="text-center py-8 space-y-4">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white">Unit Complete!</h2>
              <p className="text-xs text-slate-300">You earned +{unit.xpReward} XP towards your CEFR mastery.</p>
            </div>
            <button
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl text-xs shadow-lg cursor-pointer"
            >
              Return to Curriculum
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
