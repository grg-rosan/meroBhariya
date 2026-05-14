// src/modules/merchant/components/shipment/components/StatusStepper.jsx

const STATUS_STEPS = [
  "PENDING",
  "ASSIGNED",
  "PICKED_UP",
  "IN_HUB",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

/**
 * Progress stepper for active (non-cancelled) shipments.
 * @param {{ status: string }} props
 */
export default function StatusStepper({ status }) {
  const statusIdx = STATUS_STEPS.indexOf(status);

  return (
    <div className="mt-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        {STATUS_STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center flex-1">
            <div
              className={
                "w-3 h-3 rounded-full " +
                (i <= statusIdx
                  ? "bg-rose-500"
                  : "bg-gray-200 dark:bg-zinc-700")
              }
            />
            <p className="text-[9px] text-gray-400 dark:text-zinc-500 mt-1 text-center">
              {step.replace(/_/g, " ")}
            </p>
          </div>
        ))}
      </div>
      <div className="h-1 bg-gray-200 dark:bg-zinc-700 rounded-full mt-1">
        <div
          className="h-full bg-rose-500 rounded-full transition-all"
          style={{ width: `${((statusIdx + 1) / STATUS_STEPS.length) * 100}%` }}
        />
      </div>
    </div>
  );
}