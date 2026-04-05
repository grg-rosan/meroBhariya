// src/rider/pages/RiderDocumentUpload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageShell, Card, Brand, Heading, StepBar,
  DropZone, Button, ErrorAlert, InfoBanner,
} from "../../shared/ui/porter-ui";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const DOCS = [
  {
    key:    "citizenshipFront",
    label:  "Citizenship — Front",
    hint:   "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji:  "🪪",
    required: true,
  },
  {
    key:    "citizenshipBack",
    label:  "Citizenship — Back",
    hint:   "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji:  "🪪",
    required: true,
  },
  {
    key:    "licensePhoto",
    label:  "Driving License",
    hint:   "JPG or PNG · max 5 MB",
    accept: "image/*",
    emoji:  "🪪",
    required: true,
  },
  {
    key:    "vehicleRegistration",
    label:  "Vehicle Registration (Bluebook)",
    hint:   "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji:  "📋",
    required: true,
  },
  {
    key:    "profilePhoto",
    label:  "Profile photo",
    hint:   "Clear face photo · JPG or PNG",
    accept: "image/*",
    emoji:  "🤳",
    required: true,
  },
];

const STEPS = ["Upload", "Review", "Done"];

function StatusPill({ status = "PENDING" }) {
  const map = {
    PENDING:  "bg-yellow-950 border-yellow-900 text-yellow-400",
    APPROVED: "bg-green-950 border-green-900 text-green-400",
    REJECTED: "bg-red-950 border-red-900 text-red-400",
  };
  const labels = { PENDING: "Pending review", APPROVED: "Approved", REJECTED: "Rejected" };
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function RiderDocumentUpload() {
  const navigate = useNavigate();

  const [step,      setStep]      = useState(0);
  const [files,     setFiles]     = useState({});
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);

  const uploadedCount = Object.keys(files).filter(k => files[k]).length;
  const allReady      = DOCS.every(d => files[d.key]);

  const setFile = (key, file) => setFiles(prev => ({ ...prev, [key]: file }));

  async function handleSubmit() {
    setError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      DOCS.forEach(d => { if (files[d.key]) fd.append(d.key, files[d.key]); });

      const res = await fetch(`${API_BASE}/rider/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <PageShell>
      <Card>
        <Brand subtitle="Document verification" />
        <StepBar steps={STEPS} current={step} />

        {/* ── Step 0: Upload ──────────────────────────────────── */}
        {step === 0 && (
          <>
            <Heading
              title="Upload documents"
              sub="We need to verify your identity before you can start riding."
            />

            <InfoBanner>
              📋 All documents are stored securely and only used for verification.
              Review typically takes{" "}
              <strong className="text-white">1–2 business days</strong>.
            </InfoBanner>

            <div className="flex flex-col gap-4">
              {DOCS.map(doc => (
                <div key={doc.key}>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest mb-2">
                    {doc.emoji} {doc.label}
                  </p>
                  <DropZone
                    label={`Choose ${doc.label}`}
                    accept={doc.accept}
                    hint={doc.hint}
                    file={files[doc.key] || null}
                    onChange={f => setFile(doc.key, f)}
                  />
                </div>
              ))}
            </div>

            <ErrorAlert message={error} />

            <Button
              className="mt-6"
              onClick={() => allReady && setStep(1)}
            >
              {allReady
                ? "Review & submit →"
                : `${uploadedCount} / ${DOCS.length} files selected`}
            </Button>

            {!allReady && (
              <p className="text-center text-xs text-zinc-600 mt-2">
                Upload all documents to continue.
              </p>
            )}
          </>
        )}

        {/* ── Step 1: Review ──────────────────────────────────── */}
        {step === 1 && (
          <>
            <Heading title="Review uploads" sub="Confirm everything looks correct before submitting." />

            <div className="flex flex-col gap-2.5 mb-6">
              {DOCS.map(doc => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-white">
                      {doc.emoji} {doc.label}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[180px]">
                      {files[doc.key]?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => { setFile(doc.key, null); setStep(0); }}
                    className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors bg-transparent border-none cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              ))}
            </div>

            <ErrorAlert message={error} />

            <Button loading={uploading} onClick={handleSubmit}>
              Submit for verification →
            </Button>
            <button
              onClick={() => setStep(0)}
              className="w-full mt-3 bg-transparent border-none text-zinc-600 hover:text-zinc-400 text-sm cursor-pointer py-1.5 transition-colors"
            >
              ← Go back
            </button>
          </>
        )}

        {/* ── Step 2: Done ────────────────────────────────────── */}
        {step === 2 && (
          <>
            <div className="text-4xl mb-4">🎉</div>
            <Heading
              title="Documents submitted!"
              sub="Our team will review your submission. You'll be notified once verified."
            />

            <div className="flex flex-col gap-2 mb-6">
              {DOCS.map(doc => (
                <div
                  key={doc.key}
                  className="flex items-center justify-between bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3"
                >
                  <span className="text-sm text-zinc-400">
                    {doc.emoji} {doc.label}
                  </span>
                  <StatusPill status="PENDING" />
                </div>
              ))}
            </div>

            <Button onClick={() => navigate("/rider/dashboard")}>
              Go to dashboard →
            </Button>
          </>
        )}
      </Card>
    </PageShell>
  );
}