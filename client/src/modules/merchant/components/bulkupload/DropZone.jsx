// src/modules/merchant/components/bulk/DropZone.jsx
import { useRef } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";

/**
 * @param {{
 *   file: File | null,
 *   onFile: (file: File) => void,
 * }} props
 */
export default function DropZone({ file, onFile }) {
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    onFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-4
        ${file
          ? "border-green-600 bg-green-500/5"
          : "border-gray-300 dark:border-zinc-700 hover:border-gray-400 dark:hover:border-zinc-600 bg-white dark:bg-gray-900"
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={(e) => onFile(e.target.files[0])}
      />

      {file ? (
        <div className="flex flex-col items-center gap-2">
          <FileSpreadsheet size={36} className="text-green-400" />
          <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">{file.name}</p>
          <p className="text-xs text-gray-400 dark:text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload size={36} className="text-gray-300 dark:text-zinc-600" />
          <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Drop your file here or click to browse</p>
          <p className="text-xs text-gray-300 dark:text-zinc-600">CSV, XLSX, XLS · max 500 rows</p>
        </div>
      )}
    </div>
  );
}