const DOC_LABELS = {
  PAN_CERTIFICATE: "PAN cert",
  BUSINESS_REGISTRATION: "Biz reg",
  TAX_CLEARANCE: "Tax clearance",
  OWNER_CITIZENSHIP: "Citizenship",
  OWNER_PHOTO: "Owner photo",
  CITIZENSHIP_FRONT: "Citizenship",
  DRIVING_LICENSE_FRONT: "License",
  VEHICLE_BLUEBOOK: "Bluebook",
  VEHICLE_INSURANCE: "Insurance",
  RIDER_PHOTO: "Photo",
  CITIZENSHIP_BACK: "Citizenship (back)",
  DRIVING_LICENSE_BACK: "License (back)",
  VEHICLE_PHOTO: "Vehicle photo",
};

const STATUS_STYLES = {
  APPROVED: "bg-green-500/10 text-green-400 border-green-800",
  REJECTED: "bg-red-500/10 text-red-400 border-red-800",
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-800",
};

export default function DocPill({ doc, isExpanded, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className={`text-xs px-2 py-0.5 rounded font-medium border transition-all ${STATUS_STYLES[doc.status] ?? STATUS_STYLES.PENDING}`}
    >
      {DOC_LABELS[doc.type] ?? doc.type}
    </button>
  );
}