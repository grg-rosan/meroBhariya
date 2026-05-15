// src/modules/shared/doc-upload/DocSteps.jsx
import { CheckCircle2 } from "lucide-react";
import {
  Heading,
  DropZone,
  Button,
  ErrorAlert,
  InfoBanner,
} from "../../shared/ui/porter-ui.jsx";
import { DocStatusRow, DocReviewRow, DocDoneRow } from "./DocComponent.jsx";

// ─── Status view ──────────────────────────────────────────────────────────────

export function StatusView({
  docs,
  labelMap,
  allApproved,
  hasRejected,
  role,
  onReupload,
  onBack,
}) {
  return (
    <>
      {allApproved && (
        <div className="flex justify-center mb-3">
          <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center">
            <CheckCircle2 size={22} className="text-emerald-600 dark:text-emerald-500" />
          </div>
        </div>
      )}
      <Heading
        title={allApproved ? "Documents verified" : "Documents submitted"}
        sub={
          allApproved
            ? role === "MERCHANT"
              ? "All documents approved. Your store is ready to accept orders."
              : "All documents approved. You can now go on duty."
            : hasRejected
              ? "Some documents were rejected. Please re-upload them."
              : "Your documents are under review. We'll notify you once verified."
        }
      />
      <div className="flex flex-col gap-2 mb-6">
        {docs.map((doc) => (
          <DocStatusRow key={doc.id} doc={doc} labelMap={labelMap} />
        ))}
      </div>
      {hasRejected && (
        <Button onClick={onReupload}>Re-upload rejected documents →</Button>
      )}
      <button
        onClick={onBack}
        className="w-full mt-3 bg-transparent border-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm cursor-pointer py-2 transition-colors"
      >
        ← Back to dashboard
      </button>
    </>
  );
}

// ─── Step 0 — Upload ──────────────────────────────────────────────────────────

export function UploadStep({
  docs,
  files,
  setFile,
  error,
  reupload,
  rejectedTypes,
  role,
  onNext,
  onCancelReupload,
}) {
  const visibleDocs = reupload
    ? docs.filter((d) => rejectedTypes.includes(d.key))
    : docs;
  const uploadedCount = visibleDocs.filter((d) => files[d.key]).length;
  const allReady = visibleDocs.every((d) => files[d.key]);

  return (
    <>
      <Heading
        title={reupload ? "Re-upload documents" : "Upload documents"}
        sub={
          reupload
            ? "Only rejected documents are shown. Re-upload them to resubmit for review."
            : role === "MERCHANT"
              ? "We need to verify your business before you can start receiving orders."
              : "We need to verify your identity before you can start riding."
        }
      />
      {!reupload && (
        <InfoBanner>
          📋 All documents are stored securely and only used for verification.
          Review typically takes{" "}
          <strong className="text-zinc-900 dark:text-white">1–2 business days</strong>.
        </InfoBanner>
      )}
      <div className="flex flex-col gap-4">
        {visibleDocs.map((doc) => (
          <div key={doc.key}>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-500 uppercase tracking-widest mb-2">
              {doc.emoji} {doc.label}
            </p>
            <DropZone
              label={`Choose ${doc.label}`}
              accept={doc.accept}
              hint={doc.hint}
              file={files[doc.key] || null}
              onChange={(f) => setFile(doc.key, f)}
            />
          </div>
        ))}
      </div>
      <ErrorAlert message={error} />
      <Button className="mt-6" onClick={() => allReady && onNext()}>
        {allReady
          ? "Review & submit →"
          : `${uploadedCount} / ${visibleDocs.length} files selected`}
      </Button>
      {!allReady && (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-600 mt-2">
          Upload all documents to continue.
        </p>
      )}
      {reupload && (
        <button
          onClick={onCancelReupload}
          className="w-full mt-3 bg-transparent border-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm cursor-pointer py-1.5 transition-colors"
        >
          ← Cancel re-upload
        </button>
      )}
    </>
  );
}

// ─── Step 1 — Review ─────────────────────────────────────────────────────────

export function ReviewStep({
  docs,
  files,
  reupload,
  rejectedTypes,
  error,
  uploading,
  onSubmit,
  onBack,
  onChangeDoc,
}) {
  const visibleDocs = reupload
    ? docs.filter((d) => rejectedTypes.includes(d.key))
    : docs;

  return (
    <>
      <Heading
        title="Review uploads"
        sub="Confirm everything looks correct before submitting."
      />
      <div className="flex flex-col gap-2.5 mb-6">
        {visibleDocs.map((doc) => (
          <DocReviewRow
            key={doc.key}
            doc={doc}
            file={files[doc.key]}
            onChangeClick={() => onChangeDoc(doc.key)}
          />
        ))}
      </div>
      <ErrorAlert message={error} />
      <Button loading={uploading} onClick={onSubmit}>
        Submit for verification →
      </Button>
      <button
        onClick={onBack}
        className="w-full mt-3 bg-transparent border-none text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 text-sm cursor-pointer py-1.5 transition-colors"
      >
        ← Go back
      </button>
    </>
  );
}

// ─── Step 2 — Done ───────────────────────────────────────────────────────────

export function DoneStep({ docs, role, onDashboard }) {
  return (
    <>
      <div className="text-4xl mb-4">🎉</div>
      <Heading
        title="Documents submitted!"
        sub={
          role === "MERCHANT"
            ? "Our team will review your submission. You'll be notified once your merchant account is verified."
            : "Our team will review your submission. You'll be notified once verified."
        }
      />
      <div className="flex flex-col gap-2 mb-6">
        {docs.map((doc) => (
          <DocDoneRow key={doc.key} doc={doc} />
        ))}
      </div>
      <Button onClick={onDashboard}>Go to dashboard →</Button>
    </>
  );
}