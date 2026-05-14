export default function RiderSelectField({
  riders,
  loading,
  value,
  onChange,
  noRiderMsg,
  error,
  inputClass = "",
  subClass = "text-zinc-500",
}) {
  return (
    <div className="space-y-2">
      <label className={`text-xs block ${subClass}`}>Available riders</label>
      {loading ? (
        <p className={`text-sm ${subClass}`}>Loading riders…</p>
      ) : riders.length === 0 ? (
        <p className={`text-sm ${subClass}`}>{noRiderMsg}</p>
      ) : (
        <select
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 text-sm rounded-lg border outline-none ${inputClass}`}
        >
          <option value="">Select a rider</option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.user?.fullName ?? "Unnamed rider"}
            </option>
          ))}
        </select>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
