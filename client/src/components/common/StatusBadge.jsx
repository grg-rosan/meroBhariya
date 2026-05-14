import { getStatus } from "../../shared/constants/shipmentStatus";

export default function StatusBadge({ status }) {
  const { label, chip } = getStatus(status);
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${chip}`}
    >
      {label}
    </span>
  );
}
