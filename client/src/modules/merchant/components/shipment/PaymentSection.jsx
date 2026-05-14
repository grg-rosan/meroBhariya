// src/modules/merchant/components/shipment/components/PaymentSection.jsx
import { CreditCard, Banknote } from "lucide-react";

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border focus:outline-none transition-colors
   bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100
   placeholder-gray-400 dark:placeholder-zinc-500
   ${hasError
    ? "border-red-400 dark:border-red-500"
    : "border-gray-300 dark:border-zinc-600 focus:border-gray-500 dark:focus:border-zinc-400"
  }`;

const FieldLabel = ({ children, required }) => (
  <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
    {children}{required && <span className="text-rose-400 ml-0.5">*</span>}
  </label>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-400 mt-1">{msg}</p> : null;

const PAYMENT_OPTIONS = [
  { value: "PREPAID", label: "Prepaid", icon: CreditCard },
  { value: "COD",     label: "COD",     icon: Banknote },
];

/**
 * @param {{
 *   paymentType: "PREPAID" | "COD",
 *   codAmount: string,
 *   errors: Record<string, string>,
 *   onChange: (key: string, value: any) => void,
 * }} props
 */
export default function PaymentSection({ paymentType, codAmount, errors, onChange }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        {PAYMENT_OPTIONS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onChange("paymentType", value)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all
              ${paymentType === value
                ? "border-rose-500 bg-rose-500/8 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                : "border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:border-gray-300 dark:hover:border-zinc-600"
              }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {paymentType === "COD" && (
        <div>
          <FieldLabel required>COD amount (रु)</FieldLabel>
          <input
            type="number"
            min="0"
            value={codAmount}
            onChange={(e) => onChange("codAmount", e.target.value)}
            className={inputCls(errors.codAmount)}
            placeholder="Amount to collect from receiver"
          />
          <FieldError msg={errors.codAmount} />
          {!errors.codAmount && (
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">Must be ≤ order value</p>
          )}
        </div>
      )}
    </div>
  );
}