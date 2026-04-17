import { useState, useRef, useEffect, useCallback } from "react";
import { authAPI } from "../services/authService";
const OTP_LENGTH = 6;

export default function VerifyOtpForm({ phone, email, onVerified, onResend }) {
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(30);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const focusIndex = (i) => inputRefs.current[i]?.focus();

  const handleChange = (i, val) => {
    // Only allow single digit
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    setError(null);
    if (digit && i < OTP_LENGTH - 1) focusIndex(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
      } else if (i > 0) {
        focusIndex(i - 1);
      }
    }
    if (e.key === "ArrowLeft" && i > 0) focusIndex(i - 1);
    if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) focusIndex(i + 1);
  };

  // Handle paste — spread digits across boxes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    pasted.split("").forEach((d, idx) => { next[idx] = d; });
    setDigits(next);
    setError(null);
    focusIndex(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH;

  const handleVerify = useCallback(async () => {
    if (!isComplete || loading) return;
    setLoading(true);
    setError(null);
    try {
      const target = phone || email;
      const result = await authAPI.verifyOtp(target, otp);
      if (result.verified) {
        setVerified(true);
        setTimeout(() => onVerified?.(result), 800);
      } else {
        throw new Error("Invalid code. Please try again.");
      }
    } catch (err) {
      setError(err.message);
      // Shake and clear on error
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => focusIndex(0), 50);
    } finally {
      setLoading(false);
    }
  }, [otp, isComplete, loading, phone, email, onVerified]);

  // Auto-submit when all digits filled
  useEffect(() => {
    if (isComplete && !loading && !error) handleVerify();
  }, [isComplete]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setDigits(Array(OTP_LENGTH).fill(""));
    focusIndex(0);
    try {
      if (phone) await authAPI.sendOtp(phone);
      else if (email) await authAPI.forgotPassword(email);
      onResend?.();
      setResendCooldown(30);
    } catch (err) {
      setError(err.message);
    }
  };

  const target = phone || email || "your contact";

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-10">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-6">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Enter your code</h1>
          <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
            We sent a {OTP_LENGTH}-digit code to{" "}
            <span className="text-zinc-300 font-medium">{target}</span>.
            {" "}It expires in 10 minutes.
          </p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">

          {verified ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <p className="text-white font-medium">Verified!</p>
              <p className="mt-1 text-sm text-zinc-400">Redirecting you now...</p>
            </div>
          ) : (
            <>
              {/* OTP boxes */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-zinc-400 mb-4 tracking-wide uppercase">
                  Verification code
                </label>
                <div className="flex gap-2 sm:gap-3 justify-between" onPaste={handlePaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (inputRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={d}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      onFocus={(e) => e.target.select()}
                      className={`
                        w-full aspect-square max-w-[52px] sm:max-w-[56px] text-center text-lg font-semibold
                        bg-zinc-800 border rounded-xl text-white outline-none
                        transition-all duration-150 caret-transparent
                        focus:ring-2 focus:ring-offset-0 focus:scale-105
                        ${error
                          ? "border-red-500/60 focus:ring-red-500/20 text-red-400"
                          : d
                            ? "border-zinc-500 focus:border-zinc-400 focus:ring-zinc-400/20"
                            : "border-zinc-700 focus:border-zinc-500 focus:ring-zinc-500/20"
                        }
                      `}
                    />
                  ))}
                </div>

                {error && (
                  <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    {error}
                  </p>
                )}
              </div>

              {/* Verify button */}
              <button
                onClick={handleVerify}
                disabled={!isComplete || loading}
                className={`
                  w-full py-3 rounded-xl text-sm font-medium transition-all duration-200
                  flex items-center justify-center gap-2
                  ${isComplete && !loading
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
                    Verifying...
                  </>
                ) : (
                  "Verify code"
                )}
              </button>

              {/* Resend */}
              <div className="mt-5 text-center">
                <p className="text-xs text-zinc-500">
                  Didn't receive it?{" "}
                  {resendCooldown > 0 ? (
                    <span className="text-zinc-600">
                      Resend in <span className="tabular-nums text-zinc-500">{resendCooldown}s</span>
                    </span>
                  ) : (
                    <button
                      onClick={handleResend}
                      className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </div>
            </>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-600">
          Wrong contact?{" "}
          <a href="/forgot-password" className="text-zinc-400 hover:text-white transition-colors">
            Try a different one
          </a>
        </p>
      </div>
    </div>
  );
}