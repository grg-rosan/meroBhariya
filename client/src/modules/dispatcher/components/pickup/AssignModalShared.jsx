
export default function ModalActions({
  onCancel,
  onConfirm,
  disabled,
  loading,
  loadingLabel = "Assigning…",
  confirmLabel = "Assign Rider",
  cancelClass = "border-zinc-600 text-zinc-300 hover:bg-zinc-800",
}) {
  return (
    <div className="flex gap-2 pt-1">
      <button
        onClick={onCancel}
        className={`flex-1 py-2 rounded-lg border ${cancelClass} text-sm`}
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled || loading}
        className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-medium"
      >
        {loading ? loadingLabel : confirmLabel}
      </button>
    </div>
  );
}