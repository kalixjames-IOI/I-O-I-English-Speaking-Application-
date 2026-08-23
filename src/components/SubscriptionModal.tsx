import React from "react";
import { PlanType } from "../types";
import { Check, Crown, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "../lib/api";

interface SubscriptionModalProps {
  currentPlan: PlanType;
  isAuthenticated: boolean;
  onSignIn: () => void;
  onClose: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  currentPlan,
  isAuthenticated,
  onSignIn,
  onClose
}) => {
  const [loadingPlan, setLoadingPlan] = React.useState<PlanType | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const startCheckout = async (plan: PlanType) => {
    if (plan === "free") return;
    if (!isAuthenticated) {
      onSignIn();
      return;
    }
    setLoadingPlan(plan);
    setError(null);
    try {
      const response = await apiFetch("/api/billing/checkout", { method: "POST", body: JSON.stringify({ plan }) });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.checkoutUrl) throw new Error(data?.error || "Checkout is not available yet.");
      window.location.assign(data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout is not available yet.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: "free" as PlanType,
      name: "FREE PLAN",
      price: "$0",
      period: "forever free",
      badge: "Basic Learning",
      description: "Essential English practice for beginners starting their journey.",
      features: [
        "15 minutes daily learning time",
        "Basic AI Avatar chat practice",
        "A1 & A2 CEFR Curriculum access",
        "Community pronunciation feedback",
        "Standard streak tracking"
      ],
      color: "border-slate-800 bg-slate-900",
      buttonColor: "bg-slate-800 text-slate-300"
    },
    {
      id: "premium" as PlanType,
      name: "PREMIUM PLAN",
      price: "$19",
      period: "per month",
      badge: "Most Popular",
      description: "Unlimited 24/7 AI teacher practice and custom personalized learning roadmaps.",
      features: [
        "Unlimited AI Voice Conversation with 5 Teachers",
        "Full CEFR Curriculum (A1, A2, B1, B2, C1, C2)",
        "Personalized AI Roadmap & Progress Insights",
        "Real-Time Phoneme & Pronunciation Analyzer",
        "Instant Native Language Translation Helper",
        "AI Essay & Writing Examiner"
      ],
      color: "border-indigo-500 bg-slate-900 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-950/50",
      buttonColor: "bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-bold"
    },
    {
      id: "professional" as PlanType,
      name: "PROFESSIONAL PLAN",
      price: "$49",
      period: "per month",
      badge: "Career & Exam Mastery",
      description: "Executive business English, IELTS/TOEFL exam prep, and official certification.",
      features: [
        "Everything in Premium Plan",
        "Official IOI Professional Certificate of Proficiency",
        "Executive & Technical Roleplay Scenarios",
        "On-Demand AI Scenario Generator Studio",
        "Priority Gemini AI Live voice latency",
        "1-on-1 Career & Behavioral Interview Coaching"
      ],
      color: "border-amber-500/80 bg-slate-900 ring-2 ring-amber-500/40 shadow-xl shadow-amber-950/40",
      buttonColor: "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">IOI Education Subscription SaaS Plans</h2>
              <p className="text-xs text-slate-400">Unlock your personal 24/7 AI English teacher ecosystem</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm cursor-pointer">
            ✕
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {plans.map((p) => {
            const isCurrent = currentPlan === p.id;

            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 border flex flex-col justify-between space-y-4 relative transition-all cursor-pointer ${p.color}`}
              >
                {/* Badge */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{p.name}</span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {p.badge}
                  </span>
                </div>

                {/* Price */}
                <div className="space-y-0.5">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-extrabold text-white">{p.price}</span>
                    <span className="text-[11px] text-slate-400">{p.period}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
                </div>

                {/* Features List */}
                <ul className="space-y-1.5 text-[11px] text-slate-300">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Upgrade Action Button */}
                <button
                  disabled={isCurrent || loadingPlan !== null || p.id === "free"}
                  onClick={() => void startCheckout(p.id)}
                  className={`w-full py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${p.buttonColor}`}
                >
                  {loadingPlan === p.id ? <span className="inline-flex items-center gap-2"><Loader2 className="h-3.5 w-3.5 animate-spin" />Opening checkout…</span> : isCurrent ? "Active Plan" : p.id === "free" ? "Included" : "Upgrade securely"}
                </button>
              </div>
            );
          })}
        </div>

        {error && <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200" role="alert">{error}</div>}

        {/* Money back / Guarantee callout */}
        <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Cancel or modify subscription anytime in Settings. Prices in USD.</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-semibold">Secure checkout via Stripe</span>
        </div>
      </div>
    </div>
  );
};
