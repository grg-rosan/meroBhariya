import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export default function DocReviewPanel({ doc, onReview, loading }) {
  const [note, setNote] = useState("");

  return (
    <div className="mb-3 p-3 bg-gray-100 dark:bg-blue-950 rounded-lg border border-gray-300 dark:border-zinc-700">
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noreferrer"
        className="text-xs text-sky-400 underline mb-2 block"
      >
        View document ↗
      </a>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)…"
        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 placeholder-gray-400 dark:placeholder-zinc-600 focus:outline-none focus:border-violet-500 mb-2"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onReview(doc.id, "APPROVED", "")}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-40"
        >
          <CheckCircle size={11} /> Approve
        </button>
        <button
          onClick={() => { onReview(doc.id, "REJECTED", note); setNote(""); }}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 border border-red-700/50 text-red-400 hover:bg-red-500/10 text-xs rounded-lg font-medium"
        >
          <XCircle size={11} /> Reject
        </button>
      </div>
    </div>
  );
}