// src/modules/shared/doc-upload/DocComponents.jsx

export function StatusPill({ status = "PENDING" }) {
  const map = {
    PENDING: "bg-yellow-950 border-yellow-900 text-yellow-400",
    APPROVED: "bg-green-950 border-green-900 text-green-400",
    REJECTED: "bg-red-950 border-red-900 text-red-400",
  };
  const labels = {
    PENDING: "Pending review",
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
    <div className="flex items-center justify-between bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm text-gray-700 dark:text-zinc-300 font-medium">
          {labelMap[doc.type] ?? doc.type}
        </p>
        {doc.note && <p className="text-xs text-red-400 mt-0.5">{doc.note}</p>}
        {doc.fileUrl && (
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-sky-400 underline mt-0.5 block"
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
    <div className="flex items-center justify-between bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">
          {doc.emoji} {doc.label}
        </p>
        <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate max-w-[180px]">
          {file?.name}
        </p>
      </div>
      <button
        onClick={onChangeClick}
        className="text-xs text-gray-300  hover:text-gray-700 dark:text-zinc-300 transition-colors bg-transparent border-none cursor-pointer"
      >
        Change
      </button>
    </div>
  );
}

// Done row — step 2
export function DocDoneRow({ doc }) {
  return (
    <div className="flex items-center justify-between bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3">
      <span className="text-sm text-gray-500 dark:text-zinc-400">
        {doc.emoji} {doc.label}
      </span>
      <StatusPill status="PENDING" />
    </div>
  );
}
