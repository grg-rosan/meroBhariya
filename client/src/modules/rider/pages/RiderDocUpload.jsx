// src/modules/rider/pages/RiderDocUpload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAPI, API } from "../../../shared/hooks/useApi.js";
import {
  PageShell,
  Card,
  Brand,
  StepBar,
} from "../../../shared/ui/porter-ui.jsx";
import {
  Rider_DOCS as DOCS,
  Rider_DOC_LABELS as DOC_LABELS,
  ALLOWED_TYPES,
  STEPS,
} from "../../../shared/constants/doc.constants.js";
import {
  StatusView,
  UploadStep,
  ReviewStep,
  DoneStep,
} from "../../../components/docs/DocSteps.jsx";

async function submitDocs(files) {
  const token = localStorage.getItem("token");
  const fd = new FormData();
  // key = RiderDocType enum value — multer.fields() on backend reads this
  Object.entries(files).forEach(([type, file]) => {
    if (file) fd.append(type, file);
  });

  const res = await fetch(`${API}/api/rider/documents`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
}

export default function RiderDocumentUpload() {
  const navigate = useNavigate();
  const { data: existingDocs, loading } = useAPI("/api/rider/documents");

  const [step, setStep] = useState(0);
  const [files, setFiles] = useState({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [reupload, setReupload] = useState(false);

  const setFile = (key, file) => setFiles((p) => ({ ...p, [key]: file }));

  // Backend returns { success, data: RiderDocument[] }
  const docs = existingDocs?.data ?? [];
  const hasDocs = docs.length > 0;
  const allApproved = hasDocs && docs.every((d) => d.status === "APPROVED");
  const hasRejected = hasDocs && docs.some((d) => d.status === "REJECTED");
  const rejectedTypes = docs
    .filter((d) => d.status === "REJECTED")
    .map((d) => d.type);

  async function handleSubmit() {
    for (const [, file] of Object.entries(files)) {
      if (file && !ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: only JPG, PNG, WebP or PDF allowed.`);
        return;
      }
    }
    setError(null);
    setUploading(true);
    try {
      await submitDocs(files);
      setStep(2);
      setTimeout(() => navigate("/rider/dashboard"), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleReupload() {
    setFiles({});
    setStep(0);
    setReupload(true);
  }
  function handleCancelReupload() {
    setFiles({});
    setReupload(false);
  }
  function handleChangeDoc(key) {
    setFile(key, null);
    setStep(0);
  }

  if (loading)
    return (
      <div className="p-6 text-gray-500 dark:text-zinc-400">Loading...</div>
    );

  if (hasDocs && !reupload) {
    return (
      <PageShell>
        <Card>
          <Brand subtitle="Document verification" />
          <StatusView
            docs={docs}
            labelMap={DOC_LABELS}
            allApproved={allApproved}
            hasRejected={hasRejected}
            role="RIDER"
            onReupload={handleReupload}
            onBack={() => navigate("/rider/dashboard")}
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card>
        <Brand subtitle="Document verification" />
        <StepBar steps={STEPS} current={step} />
        {step === 0 && (
          <UploadStep
            docs={DOCS}
            files={files}
            setFile={setFile}
            error={error}
            reupload={reupload}
            rejectedTypes={rejectedTypes}
            role="RIDER"
            onNext={() => setStep(1)}
            onCancelReupload={handleCancelReupload}
          />
        )}
        {step === 1 && (
          <ReviewStep
            docs={DOCS}
            files={files}
            reupload={reupload}
            rejectedTypes={rejectedTypes}
            error={error}
            uploading={uploading}
            onSubmit={handleSubmit}
            onBack={() => setStep(0)}
            onChangeDoc={handleChangeDoc}
          />
        )}
        {step === 2 && (
          <DoneStep
            docs={DOCS}
            role="RIDER"
            onDashboard={() => navigate("/rider/dashboard")}
          />
        )}
      </Card>
    </PageShell>
  );
}
