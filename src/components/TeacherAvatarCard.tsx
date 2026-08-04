import React, { useState } from "react";
import { AITeacher } from "../types";
import { Volume2, VolumeX, MessageSquare, Mic, Sparkles, Check } from "lucide-react";

interface TeacherAvatarCardProps {
  teacher: AITeacher;
  isSelected: boolean;
  onSelect: (teacher: AITeacher) => void;
  onStartChat: (teacher: AITeacher) => void;
}

export const TeacherAvatarCard: React.FC<TeacherAvatarCardProps> = ({
  teacher,
  isSelected,
  onSelect,
  onStartChat
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlaySampleAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();

      if (isPlayingAudio) {
        setIsPlayingAudio(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(teacher.sampleAudioText);
      utterance.rate = 0.95;
      utterance.pitch = teacher.voiceName === "Kore" || teacher.voiceName === "Zephyr" ? 1.05 : 0.95;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Audio synthesis supported in Web browser!");
    }
  };

  return (
    <div
      onClick={() => onSelect(teacher)}
      className={`group relative rounded-3xl border p-4 sm:p-5 transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected
          ? "bg-slate-900 border-indigo-500 shadow-xl shadow-indigo-950/50 ring-2 ring-indigo-500/50"
          : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
      }`}
    >
      {/* Selection Check Indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 bg-indigo-600 text-white p-1 rounded-full shadow-md z-10">
          <Check className="w-3.5 h-3.5" />
        </div>
      )}

      <div className="flex items-start space-x-4">
        {/* Avatar Image with Status Ring & Accent Flag */}
        <div className="relative shrink-0">
          <img
            src={teacher.avatarUrl}
            alt={teacher.name}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 group-hover:border-indigo-500 transition-all shadow-md"
          />
          <span className="absolute -bottom-1 -right-1 text-base bg-slate-900 rounded-full p-0.5 border border-slate-800 shadow">
            {teacher.flag}
          </span>
          <span className="absolute top-1 left-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </div>

        {/* Info Area */}
        <div className="flex-1 space-y-1.5 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-bold text-white tracking-tight truncate">{teacher.name}</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-indigo-300 font-semibold truncate">
              {teacher.accent}
            </span>
          </div>

          <p className="text-xs font-semibold text-indigo-400 truncate">{teacher.title}</p>
          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{teacher.bio}</p>

          {/* Specialty Badge */}
          <div className="pt-1 flex flex-wrap gap-1">
            <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 text-[10px] font-medium">
              ✨ {teacher.specialty}
            </span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between space-x-2">
        {/* Voice Sample Play Button */}
        <button
          onClick={handlePlaySampleAudio}
          className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition-all cursor-pointer ${
            isPlayingAudio
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
          }`}
          title="Listen to teacher voice preview"
        >
          {isPlayingAudio ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-indigo-400" />}
          <span>{isPlayingAudio ? "Stop Voice" : "Voice Sample"}</span>
        </button>

        {/* Start Chat Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartChat(teacher);
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Practice Voice</span>
        </button>
      </div>
    </div>
  );
};
