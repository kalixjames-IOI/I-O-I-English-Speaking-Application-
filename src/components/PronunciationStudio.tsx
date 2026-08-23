import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "../lib/api";
import { audioBlobToBase64, describeAudioCaptureError, startAudioRecorder, type AudioRecorderHandle } from "../lib/audioRecorder";
import { UserProfile, SpeechAssessmentResult } from "../types";
import { describeSpeechRecognitionError, getSpeechRecognitionConstructor, normalizeTranscript } from "../lib/speechRecognition";
import { Mic, MicOff, Volume2, Sparkles, RefreshCw, Award, AlertCircle } from "lucide-react";

interface PronunciationStudioProps { user: UserProfile; }

export const PronunciationStudio: React.FC<PronunciationStudioProps> = ({ user }) => {
  const sampleSentences = [
    "The rain in Spain stays mainly in the plain.",
    "Artificial intelligence is transforming language education globally.",
    "Could I please reserve a window seat for my flight to London?",
    "Not only did we innovate, but we also mitigated potential risks.",
    "She sells seashells by the seashore with exceptional clarity."
  ];
  const [targetSentence, setTargetSentence] = useState(sampleSentences[0]);
  const [customInput, setCustomInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [isAssessing, setIsAssessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [assessmentResult, setAssessmentResult] = useState<SpeechAssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioRecorderRef = useRef<AudioRecorderHandle | null>(null);
  const transcriptRef = useRef("");

  useEffect(() => () => {
    recognitionRef.current?.abort?.();
    recognitionRef.current = null;
    audioRecorderRef.current?.cancel();
    audioRecorderRef.current = null;
  }, []);

  const runSpeechAssessment = async (text: string) => {
    const transcript = normalizeTranscript(text);
    if (!transcript) {
      setError("No transcript was captured. Speak clearly after starting the microphone and try again.");
      return;
    }
    setIsAssessing(true);
    setError(null);
    try {
      const response = await apiFetch("/api/gemini/assess-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, targetPhrase: targetSentence, cefrLevel: user.currentLevel })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Speech assessment is unavailable.");
      setAssessmentResult(data as SpeechAssessmentResult);
    } catch (err) {
      console.error("Speech assessment error:", err);
      setAssessmentResult(null);
      setError(err instanceof Error ? err.message : "Speech assessment is unavailable. Please try again.");
    } finally {
      setIsAssessing(false);
    }
  };

  const transcribeAudio = async (blob: Blob) => {
    setIsTranscribing(true);
    setError(null);
    try {
      const audioBase64 = await audioBlobToBase64(blob);
      const supportedMimeTypes = ["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/ogg", "audio/ogg;codecs=opus"];
      const mimeType = supportedMimeTypes.includes(blob.type) ? blob.type : "audio/webm";
      const response = await apiFetch("/api/gemini/transcribe-speech", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ audioBase64, mimeType }) });
      const data = await response.json().catch(() => ({}));
      const transcript = typeof data.transcript === "string" ? normalizeTranscript(data.transcript) : "";
      if (!response.ok || !transcript) throw new Error(data.error || "No transcript was captured. Speak clearly and try again.");
      setSpokenTranscript(transcript);
      await runSpeechAssessment(transcript);
    } catch (captureError) {
      setError(describeAudioCaptureError(captureError));
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecordedAudio = async () => {
    setError(null);
    setAssessmentResult(null);
    setSpokenTranscript("");
    try {
      audioRecorderRef.current = await startAudioRecorder();
      setIsRecording(true);
    } catch (captureError) {
      setError(describeAudioCaptureError(captureError));
    }
  };

  const stopRecordedAudio = async () => {
    const recorder = audioRecorderRef.current;
    audioRecorderRef.current = null;
    setIsRecording(false);
    if (!recorder) return;
    try {
      await transcribeAudio(await recorder.stop());
    } catch (captureError) {
      setError(describeAudioCaptureError(captureError));
    }
  };

  const handleStartRecording = () => {
    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      void startRecordedAudio();
      return;
    }
    setError(null);
    setAssessmentResult(null);
    setSpokenTranscript("");
    transcriptRef.current = "";
    const recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) transcript += `${event.results[i][0].transcript} `;
      const normalized = normalizeTranscript(transcript);
      transcriptRef.current = normalized;
      setSpokenTranscript(normalized);
      if (event.results[event.results.length - 1]?.isFinal && normalized) void runSpeechAssessment(normalized);
    };
    recognition.onerror = (event: any) => {
      const speechError = describeSpeechRecognitionError(event);
      setIsRecording(false);
      setError(speechError.message);
    };
    recognition.onend = () => {
      setIsRecording(false);
      if (!transcriptRef.current && !isAssessing) setError("No transcript was captured. Speak clearly after starting the microphone and try again.");
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setError("The microphone could not start. Check browser permission settings and try again.");
    }
  };

  const handleStopRecording = () => {
    if (!recognitionRef.current && audioRecorderRef.current) { void stopRecordedAudio(); return; }
    recognitionRef.current?.stop?.();
    setIsRecording(false);
  };

  const speakText = (text: string) => {
    if (!("speechSynthesis" in window)) { setError("Audio playback is not supported in this browser."); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  return <div className="w-full space-y-6 p-4 sm:p-6">
    <div className="relative space-y-2 overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 p-5">
      <div className="flex items-center space-x-2"><Sparkles className="h-5 w-5 text-indigo-400" /><h2 className="text-base font-bold text-white">AI Speech & Phoneme Lab</h2></div>
      <p className="max-w-xl text-xs leading-relaxed text-slate-300">Record a real spoken phrase. The server evaluates only the transcript captured by your browser microphone.</p>
    </div>
    <div className="space-y-3"><h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select or Type Target Practice Sentence</h3>
      <div className="space-y-2">{sampleSentences.map((sentence) => <div key={sentence} className={`flex items-center justify-between rounded-2xl border p-3 text-xs ${targetSentence === sentence ? "border-indigo-500 bg-slate-900 text-white" : "border-slate-800 bg-slate-900/60 text-slate-300"}`}><button onClick={() => { setTargetSentence(sentence); setAssessmentResult(null); setSpokenTranscript(""); setError(null); }} className="min-w-0 flex-1 truncate text-left">{sentence}</button><button onClick={() => speakText(sentence)} className="ml-2 shrink-0 text-slate-400 hover:text-indigo-300" aria-label={`Play ${sentence}`}><Volume2 className="h-3.5 w-3.5" /></button></div>)}</div>
      <div className="flex items-center space-x-2 pt-2"><input type="text" value={customInput} onChange={(event) => setCustomInput(event.target.value)} placeholder="Or type any custom sentence here..." className="flex-1 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" /><button onClick={() => { const value = normalizeTranscript(customInput); if (!value) return; setTargetSentence(value); setCustomInput(""); setAssessmentResult(null); setError(null); }} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white">Use Phrase</button></div>
    </div>
    <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center"><span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Active Practice Target</span><h3 className="mx-auto max-w-md text-sm font-bold text-white">{targetSentence}</h3><button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full shadow-2xl ${isRecording ? "animate-pulse bg-rose-600 text-white ring-8 ring-rose-600/30" : "bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white"}`} aria-label={isRecording ? "Stop microphone" : "Start microphone"}>{isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}</button><span className="text-xs text-slate-400">{isRecording ? "Listening... Speak now!" : "Tap microphone & speak phrase"}</span>{spokenTranscript && <p className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-left text-xs text-cyan-100"><strong>Captured transcript:</strong> {spokenTranscript}</p>}</div>
    {error && <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-relaxed text-amber-100" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {(isAssessing || isTranscribing) && <div className="space-y-2 rounded-3xl border border-slate-800 bg-slate-900 p-6 text-center text-indigo-400"><RefreshCw className="mx-auto h-6 w-6 animate-spin" /><p className="text-xs font-semibold">{isTranscribing ? "Converting your recording to a transcript..." : "AI is analyzing your captured transcript..."}</p></div>}
    {assessmentResult && !isAssessing && <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between border-b border-slate-800 pb-3"><span className="flex items-center space-x-1.5 text-xs font-bold text-white"><Award className="h-4 w-4 text-amber-400" /><span>AI Speech Evaluation Report</span></span><span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">CEFR {assessmentResult.overallCEFR}</span></div><div className="grid grid-cols-3 gap-2 text-center">{[["Accuracy", assessmentResult.accuracyScore], ["Fluency", assessmentResult.fluencyScore], ["Pronunciation", assessmentResult.pronunciationScore]].map(([label, score]) => <div key={String(label)} className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3"><span className="text-[10px] font-semibold uppercase text-slate-400">{label}</span><div className="text-base font-extrabold text-emerald-400">{score}%</div></div>)}</div><div className="space-y-1.5"><span className="text-[11px] font-semibold text-slate-400">Word-level feedback:</span><div className="flex flex-wrap gap-1.5">{assessmentResult.wordFeedback.map((feedback, index) => <span key={`${feedback.word}-${index}`} className="rounded-xl border border-slate-700 bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-slate-200">{feedback.word} ({feedback.accuracy}%)</span>)}</div></div><div className="rounded-2xl border border-slate-700/80 bg-slate-800/60 p-3 text-xs leading-relaxed text-slate-200"><strong>Feedback:</strong> {assessmentResult.feedbackText}</div></div>}
  </div>;
};
