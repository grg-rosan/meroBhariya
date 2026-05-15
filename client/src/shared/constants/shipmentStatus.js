// Single source of truth for ShipmentStatus enum presentation.
// Covers every value in the Prisma ShipmentStatus enum:
// UNPAID | PENDING | AWAITING_PICKUP | ASSIGNED | PICKED_UP |
// IN_HUB | OUT_FOR_DELIVERY | DELIVERED | CANCELLED | RETURNED

export const SHIPMENT_STATUS = {
  UNPAID: {
    label:  "Unpaid",
    icon:   "💳",
    // Tailwind badge classes (light + dark)
    badge:  "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    // Inline chip classes used by RiderManifest-style components
    chip:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    // Rider manifest action: null | "pickup" | "deliver"
    action: null,
  },
  PENDING: {
    label:  "Pending",
    icon:   "📦",
    badge:  "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    chip:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
    action: null,
  },
  AWAITING_PICKUP: {
    label:  "Awaiting Pickup",
    icon:   "🛵",
    badge:  "bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20",
    chip:   "bg-violet-500/10 text-violet-400 border-violet-500/20",
    action: "pickup",
  },
  ASSIGNED: {
    label:  "Assigned",
    icon:   "🛵",
    badge:  "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
    chip:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    action: null,
  },
  PICKED_UP: {
    label:  "Picked Up",
    icon:   "🚀",
    badge:  "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
    chip:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    action: null,
  },
  IN_HUB: {
    label:  "In Hub",
    icon:   "🏠",
    badge:  "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
    chip:   "bg-purple-500/10 text-purple-400 border-purple-500/20",
    action: null,
  },
  OUT_FOR_DELIVERY: {
    label:  "Out for Delivery",
    icon:   "🚚",
    badge:  "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20",
    chip:   "bg-sky-500/10 text-sky-400 border-sky-500/20",
    action: "deliver",
  },
  DELIVERED: {
    label:  "Delivered",
    icon:   "✅",
    badge:  "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    chip:   "bg-green-500/10 text-green-400 border-green-500/20",
    action: null,
  },
  CANCELLED: {
    label:  "Cancelled",
    icon:   "❌",
    badge:  "bg-red-50 text-red-500 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    chip:   "bg-red-500/10 text-red-400 border-red-500/20",
    action: null,
  },
  RETURNED: {
    label:  "Returned",
    icon:   "↩️",
    badge:  "bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20",
    chip:   "bg-orange-500/10 text-orange-400 border-orange-500/20",
    action: null,
  },
};

// Fallback for unknown/future statuses
export const UNKNOWN_STATUS = {
  label:  "Unknown",
  icon:   "❓",
  badge:  "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700",
  chip:   "bg-zinc-800 text-zinc-400 border-zinc-700",
  action: null,
};

/** Convenience getter — never throws */
export const getStatus = (status) => SHIPMENT_STATUS[status] ?? UNKNOWN_STATUS;