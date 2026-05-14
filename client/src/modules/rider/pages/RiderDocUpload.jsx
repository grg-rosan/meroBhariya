// src/modules/rider/pages/RiderDocumentUpload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageShell,
  Card,
  Brand,
  StepBar,
} from "../../../shared/ui/porter-ui.jsx";
import {
  Rider_DOCS as DOCS,
  Rider_DOC_LABELS as DOC_LABELS,
  STEPS,
} from "../../../shared/constants/doc.constants.js";
import {
  StatusView,
  UploadStep,
  ReviewStep,
  DoneStep,
} from "../../../components/docs/DocSteps.jsx";
import {
  useDocUpload,
  useDocStatus,
  validateDocFiles,
} from "../../../shared/hooks/useDockUpload.js";

export default function RiderDocumentUpload() {
  const navigate = useNavigate();
  const { docs, docsLoading, uploadDocs, uploading, uploadError } =
    useDocUpload({ apiBase: "/api/rider" });

  const [step, setStep] = useState(0);
  const [files, setFiles] = useState({});
  const [error, setError] = useState(null);
  const [reupload, setReupload] = useState(false);

  const setFile = (key, file) => setFiles((p) => ({ ...p, [key]: file }));
  const { hasDocs, allApproved, hasRejected, rejectedTypes } =
    useDocStatus(docs);

  async function handleSubmit() {
    const validationError = validateDocFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      await uploadDocs(files);
      setStep(2);
      setTimeout(() => navigate("/rider/dashboard"), 3000);
    } catch {
      setError(uploadError);
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

  if (docsLoading)
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
