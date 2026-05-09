import { useState } from "react";
import { useSubscription } from "../../hooks/useSubscription.js";
import QuotaBar from "./QuotaBar";
import PlanGrid from "./PlanGrid";
import UpgradeModal from "./UpgradeModal";
import SubscriptionGate from "./SubscriptionGate";

/**
 * SubscriptionGrid – main subscription UI.
 * Imported and rendered directly by MerchantPayment.jsx.
 */
export default function SubscriptionGrid() {
  const {
    subscription,
    plans,
    loading,
    plansLoading,
    error,
    isExpired,
    hasNoSubscription,
    isOverQuota,
    recommendedPlan,
    refetch,
    subscribeToPlan,
  } = useSubscription();

  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [loadingPlanId, setLoadingPlanId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSelectPlan = async (plan) => {
    setLoadingPlanId(plan.id);
    try {
      await subscribeToPlan(plan.id);
      showToast(`Subscribed to ${plan.name} successfully!`);
      setUpgradeOpen(false);
    } catch (e) {
      showToast(e.message ?? "Failed to subscribe. Please try again.", "error");
    } finally {
      setLoadingPlanId(null);
    }
  };

  const upgradeReason = isExpired
    ? "EXPIRED"
    : hasNoSubscription
    ? "NONE"
    : "QUOTA_EXCEEDED";

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <svg className="h-7 w-7 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={refetch}
          className="rounded-lg bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`
            fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium
            ${toast.type === "error" ? "bg-red-600 text-white" : "bg-emerald-600 text-white"}
          `}
        >
          {toast.type === "error" ? (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm1 13h-2v2h2v-2zm0-8h-2v6h2V7z" />
            </svg>
          ) : (
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* ── Status banner: expired / no sub / over quota ── */}
      {(isExpired || hasNoSubscription || isOverQuota) && (
        <div
          className={`
            flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
            rounded-2xl border p-5
            ${isExpired || hasNoSubscription
              ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40"
              : "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40"}
          `}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`mt-0.5 h-5 w-5 shrink-0 ${isExpired || hasNoSubscription ? "text-red-500" : "text-amber-500"}`}
              viewBox="0 0 24 24" fill="currentColor"
            >
              <path d="M13 14h-2V9h2v5zm0 4h-2v-2h2v2zM1 21h22L12 2 1 21z" />
            </svg>
            <div>
              <p className={`font-semibold text-sm ${isExpired || hasNoSubscription ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400"}`}>
                {isExpired
                  ? "Your subscription has expired"
                  : hasNoSubscription
                  ? "No active subscription"
                  : "Shipment quota exceeded"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isOverQuota
                  ? `You've used ${subscription?.shipmentsUsed} of ${subscription?.shipmentQuota} shipments. Overage charges apply.`
                  : "Upgrade to continue creating shipments."}
              </p>
            </div>
          </div>
          <button
            onClick={() => setUpgradeOpen(true)}
            className={`
              shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap
              ${isExpired || hasNoSubscription
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-amber-500 hover:bg-amber-600 text-white"}
            `}
          >
            {isExpired || hasNoSubscription ? "View Plans" : "Upgrade Plan"}
          </button>
        </div>
      )}

      {/* ── Current plan + quota ── */}
      {subscription && !hasNoSubscription && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Plan info tile */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Current Plan
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                {subscription.plan?.name ?? "—"}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide
                  ${subscription.status === "ACTIVE"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"}`}
              >
                {subscription.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Rs. {subscription.plan?.price?.toLocaleString()} / month
            </p>
            {subscription.plan?.overageRate && (
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Overage: Rs. {subscription.plan.overageRate} / extra shipment
              </p>
            )}
            <button
              onClick={() => setUpgradeOpen(true)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Change Plan
            </button>
          </div>

          {/* Quota bar tile */}
          <div className="sm:col-span-1 lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm flex items-center">
            <div className="w-full">
              <QuotaBar
                shipmentsUsed={subscription.shipmentsUsed ?? 0}
                shipmentQuota={
                  subscription.shipmentQuota ??
                  subscription.plan?.shipmentQuota ??
                  0
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* ── All plans ── */}
      <SubscriptionGate
        status={subscription?.status}
        onUpgrade={() => setUpgradeOpen(true)}
      >
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <PlanGrid
            plans={plans}
            loading={plansLoading}
            activePlanId={subscription?.plan?.id}
            recommendedId={recommendedPlan?.id}
            onSelect={handleSelectPlan}
            loadingPlanId={loadingPlanId}
          />
        </div>
      </SubscriptionGate>

      {/* ── Upgrade modal ── */}
      <UpgradeModal
        open={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
        plans={plans}
        activePlanId={subscription?.plan?.id}
        recommendedId={recommendedPlan?.id}
        onSelectPlan={handleSelectPlan}
        loadingPlanId={loadingPlanId}
        reason={upgradeReason}
      />
    </div>
  );
}