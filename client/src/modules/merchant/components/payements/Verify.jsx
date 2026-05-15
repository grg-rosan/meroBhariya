// src/modules/merchant/components/payments/Verify.jsx
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  CheckCircle, XCircle, Loader2,
  ArrowRight, RotateCcw, Package,
} from "lucide-react";
import { usePayment } from "../../hooks/usePayment.js";

export default function Verify() {
  const [searchParams]           = useSearchParams();
  const navigate                 = useNavigate();
  const { verifyPayment, error } = usePayment();

  const pidx         = searchParams.get("pidx");
  const khaltiStatus = searchParams.get("status");

  const isInvalid = !pidx;

  const [status, setStatus] = useState("verifying"); // verifying | success | failed
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (isInvalid) return;

    // Khalti already told us it failed — no need to call backend
    if (khaltiStatus && khaltiStatus !== "Completed") {
      setStatus("failed");
      return;
    }

    verifyPayment({ pidx })
      .then((data) => { setResult(data); setStatus("success"); })
      .catch(() => setStatus("failed"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Invalid link ─────────────────────────────────────────
  if (isInvalid) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 shadow-md text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <XCircle size={28} className="text-red-500" />
            </div>
          </div>
          <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
            Invalid payment link
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
            This payment link is missing required parameters.
          </p>
          <button
            onClick={() => navigate("/merchant/shipments")}
            className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Go to shipments <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* ── Verifying ───────────────────────────────────── */}
        {status === "verifying" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 shadow-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-zinc-400 dark:text-zinc-500" />
              </div>
            </div>
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
              Verifying payment
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-500">
              Please wait while we confirm your payment with Khalti…
            </p>
          </div>
        )}

        {/* ── Success ─────────────────────────────────────── */}
        {status === "success" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 shadow-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle size={28} className="text-emerald-500" />
              </div>
            </div>

            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
              Payment successful!
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
              Your shipment has been created and is now active.
            </p>

            {/* QR Code */}
            {result?.qrCode && (
              <div className="flex flex-col items-center mb-4">
                <img
                  src={result.qrCode}
                  alt="Shipment QR Code"
                  className="w-44 h-44 rounded-xl border border-zinc-100 dark:border-zinc-700"
                />
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                  Scan to track shipment
                </p>
              </div>
            )}

            {/* Tracking number */}
            {result?.trackingNumber && (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-zinc-400" />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">Tracking</span>
                </div>
                <span className="font-mono text-sm font-semibold text-rose-500">
                  #{result.trackingNumber}
                </span>
              </div>
            )}

            {/* Total paid */}
            {result?.totalFare != null && (
              <div className="bg-zinc-50 dark:bg-zinc-800 rounded-xl px-4 py-3 mb-6 flex items-center justify-between">
                <span className="text-xs text-zinc-500 dark:text-zinc-400">Amount paid</span>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  रु {Number(result.totalFare).toLocaleString()}
                </span>
              </div>
            )}

            <button
              onClick={() => navigate("/merchant/shipments")}
              className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              View shipments <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* ── Failed ──────────────────────────────────────── */}
        {status === "failed" && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-8 shadow-md text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
                <XCircle size={28} className="text-red-500" />
              </div>
            </div>
            <h2 className="text-base font-semibold text-zinc-800 dark:text-zinc-100 mb-1">
              Payment failed
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-6">
              {error ?? "Your payment could not be completed. Please try again."}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => navigate("/merchant/shipments/new")}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                Try again <RotateCcw size={13} />
              </button>
              <button
                onClick={() => navigate("/merchant/shipments")}
                className="w-full py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-sm font-medium rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
              >
                Go to shipments <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}