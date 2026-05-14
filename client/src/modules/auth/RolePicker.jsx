import { Link } from "react-router-dom";
import { Heading, Divider } from "../../shared/ui/porter-ui";

const ROLES = [
  { value: "rider",    emoji: "🛵", label: "Rider",    desc: "Deliver orders & earn per trip" },
  { value: "merchant", emoji: "🏪", label: "Merchant", desc: "List your store & accept orders" },
];

// Used in RegisterPage (onSelect) and LoginPage (as register links)
export default function RolePicker({ onSelect }) {
  return (
    <>
      <Heading title="Create account" sub="Choose how you'll use Porter." />

      <div className="flex flex-col gap-3">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => onSelect(r.value)}
            className="bg-zinc-950 border border-gray-200 dark:border-zinc-800 hover:border-orange-500 rounded-xl p-4 text-left transition-colors group"
          >
            <p className="text-sm font-semibold text-white group-hover:text-orange-400 transition-colors">
              {r.emoji} {r.label}
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{r.desc}</p>
          </button>
        ))}
      </div>

      <Divider label="already have an account?" />
      <Link to="/login" className="no-underline">
        <button className="w-full bg-transparent border border-gray-200 dark:border-zinc-800 hover:border-gray-400 text-gray-400 hover:text-gray-700 dark:text-zinc-300 text-sm rounded-xl py-2.5 transition-colors">
          Sign in instead
        </button>
      </Link>
    </>
  );
}