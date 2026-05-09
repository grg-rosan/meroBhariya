/**
 * SubscriptionGate – wraps content that requires an active subscription.
 * If the merchant's subscription is expired or missing, the content is blurred
 * and an upgrade prompt is overlaid.
 *
 * Props:
 *   status          {"ACTIVE" | "EXPIRED" | "NONE" | undefined}
 *   onUpgrade       {function}  – called when the upgrade button is clicked
 *   children        {ReactNode}
 *   graceful        {boolean}   – if true, show a soft warning instead of full block
 */
export default function SubscriptionGate({
  status,
  onUpgrade,
  children,
  graceful = false,
}) {
  const isBlocked = !status || status === "EXPIRED" || status === "NONE";

  if (!isBlocked) return <>{children}</>;

  return (
    <div className="relative w-full">
      {/* Blurred content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(5px)", userSelect: "none" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div
          className={`
            mx-4 w-full max-w-sm rounded-2xl border p-8 text-center shadow-xl backdrop-blur-sm
            ${
              graceful
                ? "bg-amber-50/90 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800"
                : "bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700"
            }
          `}
        >
          {/* Icon */}
          <div
            className={`
              mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full
              ${graceful ? "bg-amber-100 dark:bg-amber-900/40" : "bg-indigo-100 dark:bg-indigo-900/40"}
            `}
          >
            <svg
              className={`h-7 w-7 ${graceful ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {status === "EXPIRED" ? "Subscription Expired" : "No Active Plan"}
          </h3>

          {/* Body */}
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {status === "EXPIRED"
              ? "Your subscription has expired. Renew to continue creating and managing shipments."
              : "You need an active subscription plan to access this feature."}
          </p>

          {/* CTA */}
          <button
            onClick={onUpgrade}
            className="mt-6 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors duration-200"
          >
            {status === "EXPIRED" ? "Renew Subscription" : "View Plans"}
          </button>
        </div>
      </div>
    </div>
  );
}