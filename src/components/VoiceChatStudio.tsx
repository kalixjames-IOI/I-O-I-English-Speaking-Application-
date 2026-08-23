import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import { audioBlobToBase64, describeAudioCaptureError, startAudioRecorder, type AudioRecorderHandle } from "../lib/audioRecorder";
import { AITeacher, ChatMessage, UserProfile } from "../types";
import { useAuth } from "../lib/AuthContext";
import { describeSpeechRecognitionError, getSpeechRecognitionConstructor, normalizeTranscript } from "../lib/speechRecognition";
import { Mic, MicOff, Send, Volume2, Sparkles, RefreshCw, MessageCircle, AlertCircle, Languages, Check, ArrowLeft } from "lucide-react";

interface VoiceChatStudioProps {
  teacher: AITeacher;
  user: UserProfile;
  onBack?: () => void;
}

export const VoiceChatStudio: React.FC<VoiceChatStudioProps> = ({ teacher, user, onBack }) => {
  const { user: authUser } = useAuth();
  const isAuthenticated = Boolean(authUser);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "teacher",
      text: `Hello ${user.name}! I'm ${teacher.name}. Let's practice speaking today. What's on your mind?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      betterPhrasing: "What are you up to today?",
      pronunciationFocus: ["practice", "speaking"]
    }
  ]);

  const [inputSpeechText, setInputSpeechText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeakingTeacher, setIsSpeakingTeacher] = useState(false);
  const [showNativeTranslation, setShowNativeTranslation] = useState(false);
  const [translationMap, setTranslationMap] = useState<Record<string, string>>({});
  const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorderHandle | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) return;
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += `${event.results[i][0].transcript} `;
      setInputSpeechText(normalizeTranscript(transcript));
    };
    recognition.onerror = (event: any) => { setIsRecording(false); setSpeechError(describeSpeechRecognitionError(event).message); };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    return () => {
      recognition.abort?.();
      recognitionRef.current = null;
      audioRecorderRef.current?.cancel();
      audioRecorderRef.current = null;
    };
  }, []);

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setSpeechError(null);
    try {
      const audioBase64 = await audioBlobToBase64(blob);
      const supportedMimeTypes = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/ogg;codecs=opus"];
      const mimeType = supportedMimeTypes.includes(blob.type) ? blob.type : "audio/webm";
      const response = await apiFetch("/api/gemini/transcribe-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64, mimeType })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.transcript !== "string" || !normalizeTranscript(data.transcript)) throw new Error(data.error || "No transcript was captured. Speak clearly and try again.");
      setInputSpeechText(normalizeTranscript(data.transcript));
    } catch (error) {
      setSpeechError(describeAudioCaptureError(error));
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecordedAudio = async () => {
    setSpeechError(null);
    setInputSpeechText("");
    try {
      audioRecorderRef.current = await startAudioRecorder();
      setIsRecording(true);
    } catch (error) {
      setSpeechError(describeAudioCaptureError(error));
    }
  };

  const stopRecordedAudio = async () => {
    const recorder = audioRecorderRef.current;
    audioRecorderRef.current = null;
    setIsRecording(false);
    if (!recorder) return;
    try {
      await transcribeAudio(await recorder.stop());
    } catch (error) {
      setSpeechError(describeAudioCaptureError(error));
    }
  };

  const toggleRecording = () => {
    if (!isAuthenticated) {
      setSpeechError("Please sign in first to use AI voice practice.");
      return;
    }
    if (!recognitionRef.current) {
      if (isRecording) void stopRecordedAudio();
      else void startRecordedAudio();
      return;
    }
    setSpeechError(null);
    if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); return; }
    setInputSpeechText("");
    try { recognitionRef.current.start(); setIsRecording(true); } catch { setSpeechError("The microphone could not start. Check browser permission settings and try again."); }
  };

  const speakTeacherText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = teacher.voiceName === "Kore" || teacher.voiceName === "Zephyr" ? 1.05 : 0.95;

      utterance.onstart = () => setIsSpeakingTeacher(true);
      utterance.onend = () => setIsSpeakingTeacher(false);
      utterance.onerror = () => setIsSpeakingTeacher(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputSpeechText;
    if (!isAuthenticated) {
      setSpeechError("Please sign in first to chat with the AI teacher.");
      return;
    }
    if (!text.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputSpeechText("");
    setIsThinking(true);

    try {
      const response = await apiFetch("/api/gemini/chat-teacher", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: teacher.id,
          teacherName: teacher.name,
          persona: teacher.personality,
          userMessage: text,
          history: messages,
          cefrLevel: user.currentLevel,
          goal: user.targetGoal
        })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.reply !== "string" || !data.reply.trim()) throw new Error(data.error || "The AI teacher is unavailable. Please try again.");

      const teacherMsg: ChatMessage = {
        id: `t-${Date.now()}`,
        sender: "teacher",
        text: data.reply.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        grammarCorrection: data.grammarCorrection,
        betterPhrasing: data.betterPhrasing,
        pronunciationFocus: data.pronunciationFocus
      };

      setMessages((prev) => [...prev, teacherMsg]);
      speakTeacherText(teacherMsg.text);
    } catch (err) {
      console.error("Chat error:", err);
      setSpeechError(err instanceof Error ? err.message : "The AI teacher is unavailable. Please try again.");
    } finally {
      setIsThinking(false);
    }
  };

  const handleTranslateMessage = async (msgId: string, text: string) => {
    if (translationMap[msgId]) {
      // Toggle off
      const copy = { ...translationMap };
      delete copy[msgId];
      setTranslationMap(copy);
      return;
    }

    try {
      const res = await apiFetch("/api/gemini/translate-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, nativeLanguage: user.nativeLanguage })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || typeof data.translatedText !== "string" || !data.translatedText.trim()) throw new Error(data.error || "Translation is unavailable right now.");
      setTranslationErrors((prev) => { const next = { ...prev }; delete next[msgId]; return next; });
      setTranslationMap((prev) => ({ ...prev, [msgId]: data.translatedText.trim() }));
    } catch (err) {
      setTranslationMap((prev) => { const next = { ...prev }; delete next[msgId]; return next; });
      setTranslationErrors((prev) => ({ ...prev, [msgId]: err instanceof Error ? err.message : "Translation is unavailable right now." }));
    }
  };

  return (
    <div className="w-full flex flex-col h-full bg-slate-950 text-slate-100 relative">
      {/* Teacher Top Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-3.5 flex items-center justify-between sticky top-0 z-20 shadow-md">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="relative">
            <img
              src={teacher.avatarUrl}
              alt={teacher.name}
              className="w-11 h-11 rounded-2xl object-cover border border-slate-700"
            />
            {isSpeakingTeacher && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-slate-900 animate-ping"></span>
            )}
          </div>

          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-bold text-sm text-white">{teacher.name}</h3>
              <span className="text-xs">{teacher.flag}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isSpeakingTeacher ? "🗣️ Speaking..." : isTranscribing ? "Transcribing your recording..." : isThinking ? "🤔 Formulating response..." : "24/7 AI Voice Active"}
            </p>
          </div>
        </div>

        {/* Translation Toggle Pill */}
        <button
          onClick={() => setShowNativeTranslation(!showNativeTranslation)}
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center space-x-1 border transition-all cursor-pointer ${
            showNativeTranslation
              ? "bg-indigo-600/30 text-indigo-300 border-indigo-500"
              : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
          }`}
          title="Toggle native language helper mode"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{user.nativeLanguage} Helper</span>
        </button>
      </div>

      {/* Voice Waveform Live Indicator */}
      {(isSpeakingTeacher || isRecording || isTranscribing) && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="w-1 h-3 bg-indigo-400 animate-bounce"></span>
              <span className="w-1 h-5 bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-2 bg-amber-400 animate-bounce [animation-delay:0.4s]"></span>
              <span className="w-1 h-4 bg-emerald-400 animate-bounce [animation-delay:0.1s]"></span>
            </div>
            <span className="font-semibold text-[11px]">
              {isRecording ? "Listening to your voice..." : isTranscribing ? "Transcribing your recording..." : `${teacher.name} speaking...`}
            </span>
          </div>
          <span className="text-[10px] bg-indigo-900/80 px-2 py-0.5 rounded text-indigo-300">Live Voice Engine</span>
        </div>
      )}

      {!isAuthenticated && <div className="flex items-start gap-2 border-b border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs text-indigo-100" role="status"><AlertCircle className="h-4 w-4 shrink-0" />Sign in above to send messages, use the microphone, and receive AI replies.</div>}
      {speechError && <div className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-100" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{speechError}</div>}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 custom-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-1 ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 px-1">
              <span>{msg.sender === "user" ? "You" : teacher.name}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md space-y-2 relative group ${
                msg.sender === "user"
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-br-none"
                  : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none"
              }`}
            >
              <p>{msg.text}</p>

              {/* Native Language Translation Callout */}
              {translationMap[msg.id] && <div className="mt-1 rounded-lg border border-slate-800 bg-slate-950/70 p-2 text-[11px] italic text-slate-300">Native-language assistance: {translationMap[msg.id]}</div>}
              {translationErrors[msg.id] && <div className="mt-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-100" role="status">Translation unavailable: {translationErrors[msg.id]}</div>}

              {/* Teacher Feedback Callouts */}
              {msg.sender === "teacher" && (
                <div className="space-y-1.5 pt-1">
                  {/* Grammar Fix Callout */}
                  {msg.grammarCorrection && (
                    <div className="bg-amber-950/50 border border-amber-800/60 p-2 rounded-xl text-[11px] text-amber-200 space-y-0.5">
                      <div className="flex items-center space-x-1 font-semibold text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Grammar Tip:</span>
                      </div>
                      <p>{msg.grammarCorrection}</p>
                    </div>
                  )}

                  {/* Native Phrasing Suggestion */}
                  {msg.betterPhrasing && (
                    <div className="bg-emerald-950/50 border border-emerald-800/60 p-2 rounded-xl text-[11px] text-emerald-200 space-y-0.5">
                      <div className="flex items-center space-x-1 font-semibold text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        <span>How to say it like a native:</span>
                      </div>
                      <p className="italic">"{msg.betterPhrasing}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Audio replay & translation actions */}
              <div className="pt-1 flex items-center justify-end space-x-2 text-[10px] text-slate-400 border-t border-slate-800/50">
                <button
                  onClick={() => speakTeacherText(msg.text)}
                  className="hover:text-indigo-300 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Listen</span>
                </button>
                <button
                  onClick={() => handleTranslateMessage(msg.id, msg.text)}
                  className="hover:text-indigo-300 transition-colors cursor-pointer flex items-center space-x-1"
                >
                  <Languages className="w-3 h-3" />
                  <span>Translate</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center space-x-2 text-xs text-indigo-400 bg-slate-900 border border-slate-800 p-3 rounded-2xl w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>{teacher.name} is thinking & analyzing speech...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Bottom Voice & Text Input Bar */}
      <div className="bg-slate-900 border-t border-slate-800 p-3 sticky bottom-0 z-20 space-y-2">
        <div className="flex items-center space-x-2">
          {/* Microphone Toggle Button */}
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-2xl transition-all cursor-pointer shadow-lg shrink-0 ${
              isRecording
                ? "bg-rose-600 text-white animate-pulse ring-4 ring-rose-600/30"
                : "bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white"
            }`}
            title={isRecording ? "Stop Recording" : "Speak with Microphone"}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputSpeechText}
            onChange={(e) => setInputSpeechText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder={isRecording ? "Listening..." : `Say something to ${teacher.name}...`}
            className="flex-1 bg-slate-800 border border-slate-700/80 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
          />

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputSpeechText.trim() || isThinking}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white disabled:text-slate-600 rounded-2xl transition-all cursor-pointer shadow-md disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
