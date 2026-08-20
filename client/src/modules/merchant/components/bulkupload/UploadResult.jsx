// src/modules/merchant/components/bulk/UploadResult.jsx
import { CheckCircle, XCircle } from "lucide-react";

// ── Progress bar ──────────────────────────────────────────────

function ProgressBar({ progress }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 mb-4">
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-2">
        <span>Uploading…</span>
        <span>{progress}%</span>
      </div>
      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-rose-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

// ── Success summary ───────────────────────────────────────────

function ResultSummary({ result }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-green-700/50 rounded-xl p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle size={15} className="text-green-400" />
        <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Upload complete</span>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="text-xl font-semibold text-white">{result.total}</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Total rows</div>
        </div>
        <div>
          <div className="text-xl font-semibold text-green-400">{result.processed}</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Processed</div>
        </div>
        <div>
          <div className="text-xl font-semibold text-rose-400">{result.errors}</div>
          <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Errors</div>
        </div>
      </div>
    </div>
  );
}

// ── Error banner ──────────────────────────────────────────────

function ErrorBanner({ error }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-red-700/50 rounded-xl p-4 mb-4 flex items-center gap-2">
      <XCircle size={15} className="text-red-400 shrink-0" />
      <span className="text-sm text-red-300">{error}</span>
    </div>
  );
}

// ── Composed export ───────────────────────────────────────────

/**
 * @param {{
 *   loading: boolean,
 *   progress: number | null,
 *   result: { total, processed, errors } | null,
 *   error: string | null,
 * }} props
 */
export default function UploadResult({ loading, progress, result, error }) {
  return (
    <>
      {loading && progress != null && <ProgressBar progress={progress} />}
      {result && <ResultSummary result={result} />}
      {error && <ErrorBanner error={error} />}
    </>
  );
}