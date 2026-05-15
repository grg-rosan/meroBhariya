import { useState } from "react";
import { FileText } from "lucide-react";
import DocPill from "./DocPill";
import DocReviewPanel from "./DockReviewPanel";

export default function UserCard({ user, type, onReviewDoc, loading }) {
  const [expandedDoc, setExpandedDoc] = useState(null);

  const initials = user.user.fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const allApproved = user.documents.every((d) => d.status === "APPROVED");
  const pendingCount = user.documents.filter(
    (d) => d.status === "PENDING",
  ).length;
  const expandedDocObj = user.documents.find((d) => d.id === expandedDoc);

  const handleToggle = (docId) =>
    setExpandedDoc((prev) => (prev === docId ? null : docId));

  const handleReview = (docId, status, note) => {
    onReviewDoc(docId, status, note, type);
    setExpandedDoc(null);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden mb-3 last:mb-0">
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 text-sm font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              {user.user.fullName}
            </p>
            <span className="text-xs bg-zinc-100 dark:bg-blue-950 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded">
              {type === "MERCHANT" ? user.businessName : user.vehicleType?.name}
            </span>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-3">
            {user.user.email}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.documents.map((d) => (
              <DocPill
                key={d.id}
                doc={d}
                isExpanded={expandedDoc === d.id}
                onToggle={() => handleToggle(d.id)}
              />
            ))}
          </div>

          {expandedDocObj && (
            <DocReviewPanel
              doc={expandedDocObj}
              onReview={handleReview}
              loading={loading}
            />
          )}
        </div>

        <a
          href={user.documents[0]?.fileUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:bg-blue-950 text-xs rounded-lg transition-all"
        >
          <FileText size={12} /> Docs
        </a>
      </div>

      {!allApproved && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {pendingCount} document(s) still pending review
          </p>
        </div>
      )}
    </div>
  );
}
