// src/modules/merchant/components/bulk/ColumnReference.jsx

const REQUIRED_COLUMNS = [
  "receiver_name",
  "receiver_phone",
  "delivery_address",
  "weight_kg",
  "cod_amount",
  "is_fragile",
];

export default function ColumnReference() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-6">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Required columns</p>
      <div className="flex flex-wrap gap-2">
        {REQUIRED_COLUMNS.map((col) => (
          <code
            key={col}
            className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-0.5 rounded"
          >
            {col}
          </code>
        ))}
      </div>
    </div>
  );
}