import PlanCard from "./PlanCard";

/**
 * PlanGrid – responsive 4-column pricing table.
 * Props:
 *   plans           {array}    – array of plan objects
 *   activePlanId    {string}   – merchant's current plan id
 *   recommendedId   {string}   – plan to highlight
 *   onSelect        {function} – (plan) => void
 *   loadingPlanId   {string}   – plan id currently being processed
 *   loading         {boolean}  – show skeleton while plans are fetching
 */
export default function PlanGrid({
  plans = [],
  activePlanId,
  recommendedId,
  onSelect,
  loadingPlanId,
  loading = false,
}) {
  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full space-y-4">
        <div className="text-center space-y-2 animate-pulse">
          <div className="mx-auto h-7 w-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="mx-auto h-4 w-72 rounded bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 pt-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-4"
            >
              <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-9 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-700" />
                <div className="h-16 rounded-xl bg-slate-100 dark:bg-slate-700" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-3 w-4/5 rounded bg-slate-100 dark:bg-slate-700" />
                <div className="h-3 w-3/5 rounded bg-slate-100 dark:bg-slate-700" />
              </div>
              <div className="h-10 w-full rounded-xl bg-slate-200 dark:bg-slate-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty ─────────────────────────────────────────────────────────────────
  if (!plans.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 space-y-2">
        <svg className="h-10 w-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
        <p className="text-sm font-medium">No plans available</p>
      </div>
    );
  }

  // ── Plans ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
          Choose Your Plan
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All plans include real-time tracking, rider assignment, and merchant dashboard access.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4 pt-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={plan.id === activePlanId}
            isRecommended={plan.id === recommendedId}
            onSelect={onSelect}
            loading={loadingPlanId === plan.id}
          />
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2">
        All prices are in Nepali Rupees (NPR) and billed monthly. Overage charges apply per extra shipment beyond quota.
      </p>
    </div>
  );
}