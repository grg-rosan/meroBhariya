// src/modules/merchant/pages/BulkUpload.jsx
import { useState } from "react";
import { useBulkUpload } from "../hooks/useShipment.js";
import DropZone from "../components/bulkupload/DropZone.jsx";
import UploadResult from "../components/bulkupload/UploadResult.jsx";
import ColumnReference from "../components/bulkupload/ColumnReference.jsx";
import UploadHistory from "../components/bulkupload/UploadHistory.jsx";

const ACCEPTED_EXTENSIONS = ["csv", "xlsx", "xls"];

export default function BulkUpload() {
  const { upload, progress, loading, result, error } = useBulkUpload();
  const [file, setFile] = useState(null);

  const handleFile = (f) => {
    const ext = f?.name.split(".").pop().toLowerCase();
    if (ACCEPTED_EXTENSIONS.includes(ext)) setFile(f);
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Bulk upload</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Upload a CSV or Excel file with up to 500 shipments
        </p>
      </div>

      <DropZone file={file} onFile={handleFile} />

      {/* Actions */}
      <div className="flex items-center gap-3 mb-4">
        <a
          href="#"
          className="text-xs text-rose-400 hover:text-rose-300 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg"
        >
          Download template
        </a>
        <button
          onClick={() => file && upload(file)}
          disabled={!file || loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
        >
          {loading ? "Uploading…" : "Upload & process"}
        </button>
      </div>

      <UploadResult
        loading={loading}
        progress={progress}
        result={result}
        error={error}
      />
      <ColumnReference />
      <UploadHistory />
    </div>
  );
}
