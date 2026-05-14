/**
 * FilterBar
 * Zone filter, district filter, and select-all checkbox for PickupQueue.
 *
 * Props
 * ─────
 * zones          {array}
 * districts      {array}
 * filters        {object}  { zoneId?, districtId? }
 * onFilterChange {fn}  (patch) => void  — merged into parent filters state
 * allSelected    {boolean}
 * onSelectAll    {fn}  () => void
 * showSelectAll  {boolean}
 * filterSelClass {string}  – theme-aware Tailwind classes
 * subClass       {string}
 */
export default function FilterBar({
  zones,
  districts,
  filters,
  onFilterChange,
  allSelected,
  onSelectAll,
  showSelectAll,
  filterSelClass = "",
  subClass = "text-zinc-500",
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-5">
      <select
        value={filters.zoneId ?? ""}
        onChange={(e) =>
          onFilterChange({ zoneId: e.target.value || undefined })
        }
        className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${filterSelClass}`}
      >
        <option value="">All zones</option>
        {zones.map((z) => (
          <option key={z.id} value={z.id}>
            {z.name}
          </option>
        ))}
      </select>

      <select
        value={filters.districtId ?? ""}
        onChange={(e) =>
          onFilterChange({ districtId: e.target.value || undefined })
        }
        className={`border rounded-lg px-3 py-1.5 text-sm focus:outline-none ${filterSelClass}`}
      >
        <option value="">All districts</option>
        {districts.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {showSelectAll && (
        <label
          className={`flex items-center gap-2 text-sm ${subClass} cursor-pointer ml-auto`}
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="accent-violet-500 w-4 h-4"
          />
          Select all
        </label>
      )}
    </div>
  );
}