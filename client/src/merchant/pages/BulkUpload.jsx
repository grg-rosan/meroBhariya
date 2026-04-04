import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useBulkUpload } from '../hooks/useMerchant';

const HISTORY = [
  { date: '14 Apr 2025', filename: 'orders-apr14.csv',   total: 52, processed: 49, errors: 3 },
  { date: '10 Apr 2025', filename: 'orders-apr10.xlsx',  total: 38, processed: 38, errors: 0 },
  { date: '7 Apr 2025',  filename: 'weekly-batch.csv',   total: 64, processed: 60, errors: 4 },
];

export default function BulkUpload() {
  const { upload, progress, loading, result, error } = useBulkUpload();
  const [dragging, setDragging]   = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) return;
    setLocalFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!localFile) return;
    try {
      await upload(localFile);
    } catch (_) {}
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Bulk upload</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Upload a CSV or Excel file with up to 500 shipments</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all mb-4 ${
          dragging
            ? 'border-rose-500 bg-rose-500/5'
            : localFile
            ? 'border-green-600 bg-green-500/5'
            : 'border-zinc-700 hover:border-zinc-600 bg-zinc-900'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
        {localFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileSpreadsheet size={36} className="text-green-400" />
            <p className="text-sm font-medium text-zinc-200">{localFile.name}</p>
            <p className="text-xs text-zinc-500">{(localFile.size / 1024).toFixed(1)} KB · click to change</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={36} className="text-zinc-600" />
            <p className="text-sm font-medium text-zinc-300">Drop your file here or click to browse</p>
            <p className="text-xs text-zinc-600">Supports CSV, XLSX, XLS · max 500 rows</p>
          </div>
        )}
      </div>

      {/* Template + actions */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href="/templates/porter-bulk-template.csv"
          download
          className="text-xs text-rose-400 hover:text-rose-300 border border-zinc-800 px-3 py-1.5 rounded-lg transition-colors"
        >
          Download template
        </a>
        <button
          onClick={handleSubmit}
          disabled={!localFile || loading}
          className="flex items-center gap-2 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-all"
        >
          {loading ? 'Uploading…' : 'Upload & process'}
        </button>
      </div>

      {/* Progress */}
      {loading && progress !== null && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-4">
          <div className="flex justify-between text-xs text-zinc-400 mb-2">
            <span>Uploading…</span><span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 transition-all duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-zinc-900 border border-green-700/50 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="text-green-400" />
            <span className="text-sm font-medium text-zinc-200">Upload complete</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="text-xl font-semibold text-white">{result.total}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Total rows</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-green-400">{result.processed}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Processed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-rose-400">{result.errors}</div>
              <div className="text-xs text-zinc-500 mt-0.5">Errors</div>
            </div>
          </div>
          {result.errorRows?.length > 0 && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 mb-2">Rows with errors:</p>
              {result.errorRows.map((r, i) => (
                <div key={i} className="text-xs text-red-400 flex gap-2 mb-1">
                  <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                  Row {r.row}: {r.reason}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-zinc-900 border border-red-700/50 rounded-xl p-4 mb-4 flex items-center gap-2">
          <XCircle size={15} className="text-red-400 shrink-0" />
          <span className="text-sm text-red-300">{error}</span>
        </div>
      )}

      {/* Required columns */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <p className="text-xs font-medium text-zinc-400 mb-2">Required columns</p>
        <div className="flex flex-wrap gap-2">
          {['receiver_name','receiver_phone','delivery_address','weight_kg','cod_amount','is_fragile'].map((col) => (
            <code key={col} className="text-xs bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">{col}</code>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-white">Upload history</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-5 py-2.5 text-xs text-zinc-500 font-medium">Date</th>
              <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">File</th>
              <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Total</th>
              <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Processed</th>
              <th className="text-left px-4 py-2.5 text-xs text-zinc-500 font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            {HISTORY.map((h) => (
              <tr key={h.date} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                <td className="px-5 py-3 text-xs text-zinc-400">{h.date}</td>
                <td className="px-4 py-3 text-xs text-zinc-300 font-mono">{h.filename}</td>
                <td className="px-4 py-3 text-xs text-zinc-400">{h.total}</td>
                <td className="px-4 py-3 text-xs text-green-400">{h.processed}</td>
                <td className="px-4 py-3 text-xs text-rose-400">{h.errors || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}