// src/modules/merchant/pages/MerchantDocumentUpload.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PageShell,
  Card,
  Brand,
  StepBar,
} from "../../../shared/ui/porter-ui.jsx";
import {
  Merchant_DOCS as DOCS,
  Merchant_DOC_LABELS as DOC_LABELS,
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

export default function MerchantDocumentUpload() {
  const navigate = useNavigate();
  const { docs, docsLoading, uploadDocs, uploading, uploadError } =
    useDocUpload({ apiBase: "/api/merchant" });

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
      setTimeout(() => navigate("/merchant/dashboard"), 3000);
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
      <div className="p-4 md:p-6 text-zinc-500 dark:text-zinc-400">Loading...</div>
    );

  if (hasDocs && !reupload) {
    return (
      <PageShell>
        <Card>
          <Brand subtitle="Merchant verification" />
          <StatusView
            docs={docs}
            labelMap={DOC_LABELS}
            allApproved={allApproved}
            hasRejected={hasRejected}
            role="MERCHANT"
            onReupload={handleReupload}
            onBack={() => navigate("/merchant/dashboard")}
          />
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <Card>
        <Brand subtitle="Merchant verification" />
        <StepBar steps={STEPS} current={step} />
        {step === 0 && (
          <UploadStep
            docs={DOCS}
            files={files}
            setFile={setFile}
            error={error}
            reupload={reupload}
            rejectedTypes={rejectedTypes}
            role="MERCHANT"
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
            role="MERCHANT"
            onDashboard={() => navigate("/merchant/dashboard")}
          />
        )}
      </Card>
    </PageShell>
  );
}
