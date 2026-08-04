import React from "react";
import { UserProfile } from "../types";
import { Award, ShieldCheck, Download, Share2, Sparkles, CheckCircle } from "lucide-react";

interface CertificateModalProps {
  user: UserProfile;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ user, onClose }) => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Modal Top bar */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-white">I O I Education Network Official Certificate</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Certificate Card Printable Area */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 border-4 border-amber-500/60 p-6 rounded-3xl text-center space-y-4 shadow-2xl relative">
          <div className="flex items-center justify-between text-xs text-amber-400 font-extrabold uppercase tracking-widest">
            <span>IOI Education Network</span>
            <span>ID: IOI-{Math.floor(100000 + Math.random() * 900000)}</span>
          </div>

          <div className="py-2 space-y-1">
            <Award className="w-12 h-12 text-amber-400 mx-auto" />
            <h1 className="text-xl font-extrabold text-amber-300 tracking-tight">
              Certificate of English Proficiency
            </h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider">
              Issued under the Global CEFR Assessment Framework
            </p>
          </div>

          <div className="space-y-1 py-2 border-y border-amber-500/20">
            <p className="text-xs text-slate-300">This is to certify that</p>
            <h2 className="text-xl font-extrabold text-white tracking-wide">{user.name}</h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md mx-auto">
              has successfully achieved English Fluency Mastery at level
            </p>
            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-sm font-extrabold tracking-wider my-1">
              CEFR LEVEL {user.currentLevel} • {user.fluencyScore}% FLUENCY
            </div>
          </div>

          {/* Date & Signature Row */}
          <div className="flex items-end justify-between pt-3 text-[10px] text-slate-400">
            <div className="text-left space-y-0.5">
              <p className="font-semibold text-slate-300">Date Issued:</p>
              <p>{currentDate}</p>
            </div>

            <div className="flex flex-col items-center space-y-1">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 text-[10px]">
                IOI
              </div>
              <span className="text-[9px] text-amber-400 font-semibold">Verified AI Seal</span>
            </div>

            <div className="text-right space-y-0.5">
              <p className="font-semibold text-slate-300">Dr. Alexander</p>
              <p className="italic">Head Examiner, IOI Network</p>
            </div>
          </div>
        </div>

        {/* Share & Download Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => alert("Certificate downloaded to device as PDF!")}
            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold py-3 rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Certificate PDF</span>
          </button>
          <button
            onClick={() => alert("Certificate link copied to clipboard!")}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-2 border border-slate-700 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-indigo-400" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};
