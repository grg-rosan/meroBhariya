export default function FareField({ label, step = "1", value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1.5">
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-violet-500"
      />
    </div>
  );
}