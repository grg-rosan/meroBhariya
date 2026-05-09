import { useEffect, useRef } from "react";
import PlanGrid from "./PlanGrid";

/**
 * UpgradeModal – full-screen modal triggered by 402 Payment Required or quota exceeded.
 * Props:
 *   open            {boolean}
 *   onClose         {function}
 *   plans           {array}
 *   activePlanId    {string}
 *   recommendedId   {string}
 *   onSelectPlan    {function}  – (plan) => void
 *   loadingPlanId   {string}
 *   reason          {"QUOTA_EXCEEDED" | "EXPIRED" | "NONE"}
 */
export default function UpgradeModal({
  open,
  onClose,
  plans = [],
  activePlanId,
  recommendedId,
  onSelectPlan,
  loadingPlanId,
  reason = "QUOTA_EXCEEDED",
}) {
  const overlayRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const headings = {
    QUOTA_EXCEEDED: {
      title: "You've reached your shipment quota",
      subtitle:
        "Upgrade your plan to continue creating shipments without interruption, or continue with overage charges.",
      icon: (
        <svg className="h-7 w-7 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13 14h-2V9h2v5zm0 4h-2v-2h2v2zM1 21h22L12 2 1 21z" />
        </svg>
      ),
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
    },
    EXPIRED: {
      title: "Your subscription has expired",
      subtitle: "Renew or choose a new plan to keep your logistics running smoothly.",
      icon: (
        <svg className="h-7 w-7 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      ),
      iconBg: "bg-red-100 dark:bg-red-900/40",
    },
    NONE: {
      title: "No active subscription",
      subtitle: "Choose a plan to start creating shipments and managing deliveries.",
      icon: (
        <svg className="h-7 w-7 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-9 3h18a2 2 0 002-2V6a2 2 0 00-2-2H3a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      iconBg: "bg-indigo-100 dark:bg-indigo-900/40",
    },
  };

  const { title, subtitle, icon, iconBg } = headings[reason] ?? headings.NONE;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 backdrop-blur-sm px-4 py-8"
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
    >
      <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="relative flex items-start gap-4 p-6 border-b border-slate-200 dark:border-slate-700">
          <div className={`mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${iconBg}`}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{subtitle}</p>
          </div>
          {/* Close */}
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Plans */}
        <div className="p-6">
          <PlanGrid
            plans={plans}
            activePlanId={activePlanId}
            recommendedId={recommendedId}
            onSelect={onSelectPlan}
            loadingPlanId={loadingPlanId}
          />
        </div>
      </div>
    </div>
  );
}