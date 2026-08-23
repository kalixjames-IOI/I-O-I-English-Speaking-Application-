import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { db, isSupabaseConfigured } from "../lib/supabase";
import { UserProfile, CEFRLevel } from "../types";
import { Sparkles, RefreshCw, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";

interface AiContentStudioProps { user: UserProfile; }
type UnitOption = { id: string; title: string; levelName: string };

export const AiContentStudio: React.FC<AiContentStudioProps> = ({ user }) => {
  const [topicPrompt, setTopicPrompt] = useState("");
  const [selectedCEFR, setSelectedCEFR] = useState<CEFRLevel>(user.currentLevel || "B1");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    void db.getLevels("11111111-1111-1111-1111-111111111111").then(async ({ data: levels, error: levelError }) => {
      if (levelError || !levels) return;
      const loaded = (await Promise.all(levels.map(async (level) => {
        const result = await db.getUnits(level.id);
        return (result.data || []).map((unit) => ({ id: unit.id, title: unit.title, levelName: level.name }));
      }))).flat();
      if (active) { setUnits(loaded); if (loaded[0]) setSelectedUnitId(loaded[0].id); }
    });
    return () => { active = false; };
  }, []);

  const sampleTopics = ["Ordering at a Michelin-Star Restaurant in London", "Tech Startup Pitch Meeting & Investor Q&A", "Aviation & Airport Customs Navigation", "Medical Doctor Appointment & Describing Symptoms", "Job Offer Salary & Equity Negotiation"];

  const handleGenerate = async (customTopic?: string) => {
    const topic = (customTopic || topicPrompt).trim();
    if (!topic || isGenerating) return;
    setIsGenerating(true); setError(null); setStatus(null); setGeneratedLesson(null);
    try {
      const response = await apiFetch("/api/gemini/generate-custom-lesson", { method: "POST", body: JSON.stringify({ topic, cefrLevel: selectedCEFR, userGoal: user.targetGoal }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "AI content generation is unavailable.");
      setGeneratedLesson(data);
      if (!selectedUnitId) { setStatus("Generated preview ready. Select an existing course unit to save it safely."); return; }
      const saveResponse = await apiFetch("/api/gemini/save-custom-lesson", { method: "POST", body: JSON.stringify({ ...data, unitId: selectedUnitId }) });
      const saveData = await saveResponse.json().catch(() => ({}));
      if (!saveResponse.ok) throw new Error(saveData.error || "The lesson preview was generated but could not be saved.");
      setStatus(`Saved to ${units.find((unit) => unit.id === selectedUnitId)?.title || "the selected unit"}.`);
    } catch (generationError) {
      console.error("Content generation error:", generationError);
      setError(generationError instanceof Error ? generationError.message : "AI content generation is unavailable. Please try again.");
    } finally { setIsGenerating(false); }
  };

  const speakText = (text: string) => { if (!("speechSynthesis" in window)) { setError("Audio playback is not supported in this browser."); return; } window.speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.rate = 0.95; window.speechSynthesis.speak(utterance); };

  return <div className="w-full space-y-6 p-4 sm:p-6">
    <div className="space-y-2 rounded-3xl border border-slate-800 bg-gradient-to-r from-indigo-900 via-slate-900 to-cyan-900 p-5"><div className="flex items-center space-x-2"><Sparkles className="h-5 w-5 text-indigo-400" /><h2 className="text-base font-bold text-white">AI On-Demand Content Studio</h2></div><p className="max-w-xl text-xs leading-relaxed text-slate-300">Generate a structured English roleplay for your level and goal, then save it to an existing relational course unit.</p></div>
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"><label className="text-xs font-bold uppercase tracking-wider text-slate-400">Topic or scenario</label><div className="flex space-x-2"><input type="text" value={topicPrompt} onChange={(event) => setTopicPrompt(event.target.value)} placeholder="e.g. Renting an apartment in New York City" className="flex-1 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500" /><select value={selectedCEFR} onChange={(event) => setSelectedCEFR(event.target.value as CEFRLevel)} className="rounded-2xl border border-slate-800 bg-slate-900 px-3 text-xs text-white"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div><label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Save to an existing course unit</label><select value={selectedUnitId} onChange={(event) => setSelectedUnitId(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white"><option value="">Select a unit before saving</option>{units.map((unit) => <option key={unit.id} value={unit.id}>{unit.levelName} · {unit.title}</option>)}</select><button onClick={() => void handleGenerate()} disabled={!topicPrompt.trim() || !selectedUnitId || isGenerating} className="flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white disabled:bg-slate-800 disabled:text-slate-500">{isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}Generate and save</button><div className="flex flex-wrap gap-1.5">{sampleTopics.map((topic) => <button key={topic} onClick={() => { setTopicPrompt(topic); void handleGenerate(topic); }} disabled={!selectedUnitId || isGenerating} className="rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1 text-[11px] text-indigo-300 disabled:opacity-40">+ {topic}</button>)}</div></div>
    {error && <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100" role="alert"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
    {status && <div className="flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-100" role="status"><CheckCircle2 className="h-4 w-4 shrink-0" />{status}</div>}
    {generatedLesson && !isGenerating && <div className="space-y-4 rounded-3xl border border-slate-800 bg-slate-900 p-5"><div className="flex items-center justify-between border-b border-slate-800 pb-3"><h3 className="text-sm font-bold text-white">{generatedLesson.title}</h3><span className="rounded-full border border-indigo-500/30 bg-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-indigo-300">CEFR {generatedLesson.cefrLevel}</span></div><p className="text-xs leading-relaxed text-slate-300">{generatedLesson.description}</p><div className="space-y-2"><span className="text-xs font-bold text-indigo-400">Practical Roleplay Dialogue</span>{generatedLesson.dialogue.map((line: any, index: number) => <div key={`${line.speaker}-${index}`} className="rounded-2xl border border-slate-700/80 bg-slate-800/80 p-3 text-xs"><div className="flex items-center justify-between"><span className="font-bold text-cyan-400">{line.speaker}</span><button onClick={() => speakText(line.text)} className="text-slate-400 hover:text-indigo-300" aria-label="Play dialogue"><Volume2 className="h-3.5 w-3.5" /></button></div><p className="mt-1 text-slate-200">{line.text}</p><p className="mt-1 text-[11px] italic text-slate-400">Language assistance: {line.translation}</p></div>)}</div><div className="grid gap-2 sm:grid-cols-2">{generatedLesson.vocabularyList.map((item: any) => <div key={item.term} className="rounded-xl border border-slate-700 bg-slate-800/60 p-2.5 text-xs"><div className="flex items-center justify-between"><strong className="text-white">{item.term}</strong><span className="font-mono text-[10px] text-indigo-300">{item.phonetic}</span></div><p className="text-[11px] text-slate-400">{item.definition}</p></div>)}</div></div>}
  </div>;
};
