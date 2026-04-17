import { useState } from "react";
import { authAPI } from "../services/authService";
export default function ForgotPasswordForm({ onOtpSent }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEmail) return;
    setLoading(true);
    setError(null);
    try {
      await authAPI.forgotPassword(email.trim());
      setSent(true);
      onOtpSent?.(email.trim());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Forgot password?</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            Enter your account email and we'll send a one-time code to get you back in.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-white font-medium">Check your inbox</p>
              <p className="mt-1 text-sm text-zinc-400">
                We sent a reset code to <span className="text-zinc-300">{email}</span>
              </p>
              <button
                onClick={() => { setSent(false); setEmail(""); }}
                className="mt-6 text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5">
                <label className="block text-xs font-medium text-zinc-400 mb-2 tracking-wide uppercase">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="you@example.com"
                    autoComplete="email"
                    autoFocus
                    className={`
                      w-full bg-zinc-800 border rounded-xl px-4 py-3 text-sm text-white
                      placeholder:text-zinc-600 outline-none transition-all duration-200
                      focus:ring-2 focus:ring-offset-0
                      ${error
                        ? "border-red-500/60 focus:ring-red-500/20"
                        : "border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500/20"
                      }
                    `}
                  />
                  {isValidEmail && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                  )}
                </div>
                {error && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!isValidEmail || loading}
                className={`
                  w-full py-3 rounded-xl text-sm font-medium transition-all duration-200
                  flex items-center justify-center gap-2
                  ${isValidEmail && !loading
                    ? "bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98]"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                  }
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Sending code...
                  </>
                ) : (
                  "Send reset code"
                )}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Remember your password?{" "}
          <a href="/login" className="text-zinc-400 hover:text-white transition-colors">
            Back to login
          </a>
        </p>
      </div>
    </div>
  );
}