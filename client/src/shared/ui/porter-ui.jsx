// src/shared/ui/porter-ui.jsx
// Reusable primitives used across Login, Register, and Doc upload pages

/** Full-page shell */
export function PageShell({ children, wide = false }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-start justify-center px-4 py-12 relative overflow-x-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className={`relative z-10 w-full mt-6 ${wide ? "max-w-2xl" : "max-w-md"}`}>
        {children}
      </div>
    </div>
  );
}

/** Card */
export function Card({ children, className = "" }) {
  return (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

/** Porter brand mark */
export function Brand({ subtitle }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-orange-500 text-2xl">⬡</span>
        <span className="font-bold text-white text-xl tracking-tight">Porter</span>
      </div>
      {subtitle && (
        <p className="text-xs text-zinc-500 tracking-widest uppercase">{subtitle}</p>
      )}
    </div>
  );
}

/** Page heading */
export function Heading({ title, sub }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-bold text-white tracking-tight leading-tight mb-1">{title}</h1>
      {sub && <p className="text-sm text-zinc-500">{sub}</p>}
    </div>
  );
}

/** Form field wrapper */
export function Field({ label, error, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

/** Input */
export function Input({ className = "", ...props }) {
  return (
    <input
      className={`bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-orange-500 transition-colors w-full ${className}`}
      {...props}
    />
  );
}

/** Select */
export function Select({ children, className = "", ...props }) {
  return (
    <select
      className={`bg-zinc-950 border border-zinc-800 rounded-lg px-3.5 py-2.5 text-sm text-white outline-none focus:border-orange-500 transition-colors w-full cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

/** Primary button */
export function Button({ loading, children, className = "", ...props }) {
  return (
    <button
      className={`w-full bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg py-3 transition-colors ${className}`}
      disabled={loading}
      {...props}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}

/** Ghost button */
export function GhostButton({ children, className = "", ...props }) {
  return (
    <button
      className={`w-full bg-transparent border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-zinc-200 text-sm font-medium rounded-lg py-2.5 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Error alert */
export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-950 border border-red-900 text-red-400 rounded-lg px-4 py-2.5 text-sm mb-5">
      {message}
    </div>
  );
}

/** Success alert */
export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div className="bg-green-950 border border-green-900 text-green-400 rounded-lg px-4 py-2.5 text-sm mb-5">
      {message}
    </div>
  );
}

/** Step progress bar */
export function StepBar({ steps, current }) {
  return (
    <div className="flex gap-2 mb-8">
      {steps.map((label, i) => {
        const done   = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex-1">
            <div className={`h-0.5 rounded-full transition-all duration-300 ${
              done ? "bg-orange-500/50" : active ? "bg-orange-500" : "bg-zinc-800"
            }`} />
            <span className={`block mt-1.5 text-[10px] uppercase tracking-widest font-semibold truncate transition-colors ${
              active ? "text-orange-500" : done ? "text-zinc-500" : "text-zinc-600"
            }`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

/** Divider */
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-zinc-800" />
      {label && <span className="text-xs text-zinc-600">{label}</span>}
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

/** File drop zone */
export function DropZone({ label, accept, file, onChange, hint }) {
  const id = `drop-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label
      htmlFor={id}
      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl px-4 py-6 cursor-pointer transition-all text-center ${
        file
          ? "border-orange-500 bg-orange-500/5"
          : "border-zinc-800 bg-zinc-950 hover:border-zinc-600"
      }`}
    >
      <span className="text-2xl">{file ? "✓" : "⬆"}</span>
      <span className={`text-sm font-medium ${file ? "text-orange-400" : "text-zinc-400"}`}>
        {file ? file.name : label}
      </span>
      {hint && !file && (
        <span className="text-xs text-zinc-600">{hint}</span>
      )}
      <input
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => onChange(e.target.files[0] || null)}
      />
    </label>
  );
}

/** Info banner */
export function InfoBanner({ children }) {
  return (
    <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl px-4 py-3 text-sm text-zinc-400 leading-relaxed mb-6">
      {children}
    </div>
  );
}