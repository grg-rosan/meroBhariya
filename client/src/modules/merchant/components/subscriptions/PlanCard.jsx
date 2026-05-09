/**
 * PlanCard – single subscription plan tile.
 * Props:
 *   plan            {object}   – { id, name, price, shipmentQuota, overageRate, features[], badge? }
 *   isActive        {boolean}
 *   isRecommended   {boolean}
 *   onSelect        {function}
 *   loading         {boolean}
 */
export default function PlanCard({
  plan,
  isActive = false,
  isRecommended = false,
  onSelect,
  loading = false,
}) {
  const { name, price, shipmentQuota, overageRate, features = [], badge } = plan;

  // Prisma Decimal serializes to string in JSON — always coerce to number
  const priceNum    = price    != null ? Number(price)    : null;
  const overageNum  = overageRate != null ? Number(overageRate) : null;
  const quotaNum    = shipmentQuota != null ? Number(shipmentQuota) : null;

  return (
    <div
      className={`
        relative flex flex-col rounded-2xl border p-6 shadow-sm transition-all duration-300
        ${isRecommended
          ? "border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 dark:ring-indigo-400/30"
          : "border-slate-200 dark:border-slate-700"}
        ${isActive ? "bg-indigo-50 dark:bg-indigo-950/40" : "bg-white dark:bg-slate-800"}
        hover:shadow-md hover:-translate-y-0.5
      `}
    >
      {/* Badge */}
      {(badge || isRecommended) && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white shadow">
            {badge || "Recommended"}
          </span>
        </div>
      )}

      {/* Active badge */}
      {isActive && (
        <div className="absolute top-4 right-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mt-2">{name}</h3>

      {/* Price */}
      <div className="mt-3 flex items-end gap-1">
        <span className="text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
          Rs. {priceNum != null ? priceNum.toLocaleString() : "—"}
        </span>
        <span className="mb-1 text-sm text-slate-500 dark:text-slate-400">/month</span>
      </div>

      {/* Key stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 tabular-nums">
            {quotaNum != null ? quotaNum.toLocaleString() : "∞"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">shipments/mo</p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 p-3 text-center">
          <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {overageNum != null ? `Rs. ${overageNum}` : "—"}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">per extra</p>
        </div>
      </div>

      {/* Features */}
      {features.length > 0 && (
        <ul className="mt-5 space-y-2 flex-1">
          {features.map((f, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
              <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* CTA */}
      <button
        onClick={() => onSelect?.(plan)}
        disabled={isActive || loading}
        className={`
          mt-6 w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2
          ${isActive
            ? "bg-slate-100 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            : isRecommended
            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
            : "bg-slate-900 dark:bg-slate-100 hover:bg-slate-700 dark:hover:bg-slate-300 text-white dark:text-slate-900"}
        `}
      >
        {loading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Processing…
          </>
        ) : isActive ? "Current Plan" : "Choose Plan"}
      </button>
    </div>
  );
}