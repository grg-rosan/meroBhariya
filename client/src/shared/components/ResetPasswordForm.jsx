import { useState } from "react";

const requirements = [
  { id: "length",  label: "At least 8 characters",   test: (p) => p.length >= 8 },
  { id: "upper",   label: "One uppercase letter",     test: (p) => /[A-Z]/.test(p) },
  { id: "number",  label: "One number",               test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "One special character",    test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(pw) {
  return requirements.filter((r) => r.test(pw)).length;
}

const strengthConfig = [
  null,
  { label: "Weak",   color: "#ef4444", cls: "bg-red-500" },
  { label: "Fair",   color: "#f59e0b", cls: "bg-amber-500" },
  { label: "Good",   color: "#3b82f6", cls: "bg-blue-500" },
  { label: "Strong", color: "#10b981", cls: "bg-emerald-500" },
];

export default function ResetPasswordForm({ onSubmit }) {
  const [password, setPassword]     = useState("");
  const [confirm, setConfirm]       = useState("");
  const [showPw, setShowPw]         = useState(false);
  const [showCf, setShowCf]         = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [success, setSuccess]       = useState(false);

  const strength    = getStrength(password);
  const isStrong    = strength === 4;
  const mismatch    = confirm.length > 0 && password !== confirm;
  const canSubmit   = isStrong && password === confirm && !loading;
 const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await onSubmit(password);    // ← parent handles email/code/navigation
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const EyeIcon = ({ open }) =>
    open ? (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    ) : (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Reset your password</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Choose a strong new password for your account.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          {success ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-white font-medium">Password updated!</p>
              <p className="mt-1 text-sm text-zinc-400">Redirecting to login...</p>
            </div>
          ) : (
            <>
              {/* New password */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-zinc-400 mb-2 tracking-wide uppercase">
                  New password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Enter new password"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <>
                    <div className="flex gap-1.5 mt-2">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                            i < strength ? strengthConfig[strength].cls : "bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{ color: strengthConfig[strength]?.color ?? "#71717a" }}>
                      {strengthConfig[strength]?.label}
                    </p>
                  </>
                )}

                {/* Requirements */}
                <div className="mt-3 space-y-1.5">  
                  {requirements.map((r) => (
                    <div
                      key={r.id}
                      className={`flex items-center gap-2 text-xs transition-colors duration-200 ${
                        r.test(password) ? "text-emerald-400" : "text-zinc-600"
                      }`}
                    >
                      <div className="w-1 h-1 rounded-full bg-current flex-shrink-0" />
                      {r.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Confirm password */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-zinc-400 mb-2 tracking-wide uppercase">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showCf ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full bg-zinc-800 border rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-200 focus:ring-2 focus:ring-offset-0 ${
                      mismatch
                        ? "border-red-500/60 focus:ring-red-500/20"
                        : confirm && !mismatch
                          ? "border-emerald-500/40 focus:ring-emerald-500/20"
                          : "border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500/20"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    <EyeIcon open={showCf} />
                  </button>
                </div>
                {mismatch && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    Passwords do not match
                  </p>
                )}
              </div>

              {error && (
                <p className="mb-4 text-xs text-red-400 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {error}
                </p>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full py-3 rounded-xl text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                  canSubmit
                    ? "bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Updating...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Remembered it?{" "}
          <a href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}