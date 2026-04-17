// src/merchant/pages/MerchantDocumentUpload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageShell,
  Card,
  Brand,
  Heading,
  StepBar,
  DropZone,
  Button,
  ErrorAlert,
  InfoBanner,
} from "../../../../shared/ui/porter-ui";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const DOCS = [
  {
    key: "panCertificate",
    label: "PAN / VAT Certificate",
    hint: "Issued by IRD · JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "📄",
    required: true,
  },
  {
    key: "businessRegistration",
    label: "Business Registration",
    hint: "Company / firm registration certificate",
    accept: "image/*,application/pdf",
    emoji: "🏢",
    required: true,
  },
  {
    key: "ownerCitizenship",
    label: "Owner Citizenship",
    hint: "Front side · JPG or PNG",
    accept: "image/*",
    emoji: "🪪",
    required: true,
  },
  {
    key: "storeFront",
    label: "Store / outlet photo",
    hint: "Clear photo of your storefront",
    accept: "image/*",
    emoji: "🏪",
    required: false,
  },
  {
    key: "menuOrCatalog",
    label: "Menu / product catalog",
    hint: "PDF or images of what you sell",
    accept: "image/*,application/pdf",
    emoji: "📋",
    required: false,
  },
];

const STEPS = ["Upload", "Review", "Done"];

export default function MerchantDocumentUpload() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const requiredDocs = DOCS.filter((d) => d.required);
  const allRequired = requiredDocs.every((d) => files[d.key]);
  const uploadedCount = Object.keys(files).filter((k) => files[k]).length;

  const setFile = (key, file) => setFiles((prev) => ({ ...prev, [key]: file }));

  async function handleSubmit() {
    setError(null);
    setUploading(true);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      DOCS.forEach((d) => {
        if (files[d.key]) fd.append(d.key, files[d.key]);
      });

      const res = await fetch(`${API_BASE}/merchant/documents`, {
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
        <Brand subtitle="Merchant verification" />
        <StepBar steps={STEPS} current={step} />

        {/* ── Step 0: Upload ──────────────────────────────────── */}
        {step === 0 && (
          <>
            <Heading
              title="Business documents"
              sub="We verify every merchant before they go live on Porter."
            />

            <InfoBanner>
              🔐 Documents are stored securely and never shared publicly.
              Approval takes{" "}
              <strong className="text-white">1–3 business days</strong>.
            </InfoBanner>

            <div className="flex flex-col gap-4">
              {DOCS.map((doc) => (
                <div key={doc.key}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">
                      {doc.emoji} {doc.label}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        doc.required
                          ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                          : "bg-transparent border-zinc-800 text-zinc-600"
                      }`}
                    >
                      {doc.required ? "Required" : "Optional"}
                    </span>
                  </div>
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

            <Button className="mt-6" onClick={() => allRequired && setStep(1)}>
              {allRequired
                ? "Review & submit →"
                : `${uploadedCount} / ${requiredDocs.length} required files selected`}
            </Button>

            {!allRequired && (
              <p className="text-center text-xs text-zinc-600 mt-2">
                Upload all required documents to continue.
              </p>
            )}
          </>
        )}

        {/* ── Step 1: Review ──────────────────────────────────── */}
        {step === 1 && (
          <>
            <Heading
              title="Review files"
              sub="Make sure everything is correct before submitting."
            />

            <div className="flex flex-col gap-2.5 mb-6">
              {DOCS.filter((d) => files[d.key]).map((doc) => (
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
                    onClick={() => {
                      setFile(doc.key, null);
                      setStep(0);
                    }}
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
              sub="Our team will review your submission and email you once approved."
            />

            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-4 mb-6">
              <p className="text-sm font-semibold text-white mb-2">
                What happens next?
              </p>
              {[
                "Our team reviews your documents (1–3 days)",
                "You receive an approval email",
                "Your store goes live on Porter",
              ].map((s, i) => (
                <p key={i} className="text-xs text-zinc-500 mt-1">
                  {i + 1}. {s}
                </p>
              ))}
            </div>

            <Button onClick={() => navigate("/merchant/dashboard")}>
              Go to dashboard →
            </Button>
          </>
        )}
      </Card>
    </PageShell>
  );
}
