import { useState } from "react";

export default function FareField({ label, step = "1", value, onChange }) {
  const [local, setLocal] = useState(value?.toString() ?? "0");

  return (
    <div>
      <label className="text-xs text-gray-400 dark:text-zinc-500 block mb-1.5">
        {label}
      </label>
      <input
        type="number"
        step={step}
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange(e.target.value);
        }}
        onBlur={() => {
          if (local === "" || local === "-") {
            setLocal("0");
            onChange(0);
          }
        }}
        className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-blue-950 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-violet-500"
      />
    </div>
  );
}