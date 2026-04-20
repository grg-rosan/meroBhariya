// src/rider/components/deliver/SubmitButton.jsx
import { CheckCircle, Loader2 } from 'lucide-react';

export function SubmitButton({ submitting, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
    >
      {submitting ? (
        <><Loader2 size={14} className="animate-spin" />Verifying location…</>
      ) : (
        <><CheckCircle size={14} />Mark as delivered</>
      )}
    </button>
  );
}