// src/modules/merchant/components/shipment/components/PackageSection.jsx

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

/**
 * @param {{
 *   weight: string,
 *   orderValue: string,
 *   isFragile: boolean,
 *   errors: Record<string, string>,
 *   onChange: (key: string, value: any) => void,
 * }} props
 */
export default function PackageSection({ weight, orderValue, isFragile, errors, onChange }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel required>Weight (kg)</FieldLabel>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={weight}
            onChange={(e) => onChange("weight", e.target.value)}
            className={inputCls(errors.weight)}
            placeholder="1.5"
          />
          <FieldError msg={errors.weight} />
        </div>

        <div>
          <FieldLabel required>Order value (रु)</FieldLabel>
          <input
            type="number"
            min="0"
            value={orderValue}
            onChange={(e) => onChange("orderValue", e.target.value)}
            className={inputCls(errors.orderValue)}
            placeholder="2400"
          />
          <FieldError msg={errors.orderValue} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input
          type="checkbox"
          id="fragile"
          checked={isFragile}
          onChange={(e) => onChange("isFragile", e.target.checked)}
          className="accent-rose-500 w-4 h-4 cursor-pointer"
        />
        <label
          htmlFor="fragile"
          className="text-sm text-gray-600 dark:text-zinc-400 cursor-pointer select-none"
        >
          Fragile package
        </label>
      </div>
    </div>
  );
}