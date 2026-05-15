// src/modules/shared/doc-upload/DocComponents.jsx

export function StatusPill({ status = "PENDING" }) {
  const map = {
    PENDING:  "bg-yellow-100 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-900 text-yellow-700 dark:text-yellow-400",
    APPROVED: "bg-green-100  dark:bg-green-950  border-green-300  dark:border-green-900  text-green-700  dark:text-green-400",
    REJECTED: "bg-red-100    dark:bg-red-950    border-red-300    dark:border-red-900    text-red-700    dark:text-red-400",
  };
  const labels = {
    PENDING:  "Pending review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };
  return (
    <span
      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[status] ?? map.PENDING}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

// Existing doc row — status view
export function DocStatusRow({ doc, labelMap }) {
  return (
    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
          {labelMap[doc.type] ?? doc.type}
        </p>
        {doc.note && (
          <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">{doc.note}</p>
        )}
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-600 dark:text-sky-400 underline mt-0.5 block"
          >
            View document ↗
          </a>
        )}
      </div>
      <StatusPill status={doc.status} />
    </div>
  );
}

// Review row — step 1
export function DocReviewRow({ doc, file, onChangeClick }) {
  return (
    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-zinc-900 dark:text-white">
          {doc.emoji} {doc.label}
        </p>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-0.5 truncate max-w-[180px]">
          {file?.name}
        </p>
      </div>
      <button
        onClick={onChangeClick}
        className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors bg-transparent border-none cursor-pointer"
      >
        Change
      </button>
    </div>
  );
}

// Done row — step 2
export function DocDoneRow({ doc }) {
  return (
    <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <span className="text-sm text-zinc-600 dark:text-zinc-400">
        {doc.emoji} {doc.label}
      </span>
      <StatusPill status="PENDING" />
    </div>
  );
}