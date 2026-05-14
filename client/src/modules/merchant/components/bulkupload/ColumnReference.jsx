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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 mb-6">
      <p className="text-xs font-medium text-gray-500 dark:text-zinc-400 mb-2">Required columns</p>
      <div className="flex flex-wrap gap-2">
        {REQUIRED_COLUMNS.map((col) => (
          <code
            key={col}
            className="text-xs bg-gray-100 dark:bg-blue-950 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded"
          >
            {col}
          </code>
        ))}
      </div>
    </div>
  );
}