// src/modules/rider/documents/rider.doc.constants.js
// key must match RiderDocType enum in schema.prisma — used as FormData field name

export const Rider_DOCS = [
  {
    key: "CITIZENSHIP_FRONT",
    label: "Citizenship — Front",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "🪪",
  },
  {
    key: "CITIZENSHIP_BACK",
    label: "Citizenship — Back",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "🪪",
  },
  {
    key: "DRIVING_LICENSE_FRONT",
    label: "Driving License — Front",
    hint: "JPG or PNG · max 5 MB",
    accept: "image/*",
    emoji: "🚗",
  },
  {
    key: "VEHICLE_BLUEBOOK",
    label: "Vehicle Registration (Bluebook)",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "📋",
  },
  {
    key: "RIDER_PHOTO",
    label: "Profile Photo",
    hint: "Clear face photo · JPG/PNG",
    accept: "image/*",
    emoji: "🤳",
  },
];

// src/modules/merchant/documents/merchant.doc.constants.js
// key must match MerchantDocType enum in schema.prisma — used as FormData field name

export const Merchant_DOCS = [
  {
    key: "PAN_CERTIFICATE",
    label: "PAN Certificate",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "📄",
  },
  {
    key: "BUSINESS_REGISTRATION",
    label: "Business Registration",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "🏢",
  },
  {
    key: "TAX_CLEARANCE",
    label: "Tax Clearance Certificate",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "📋",
  },
  {
    key: "OWNER_CITIZENSHIP",
    label: "Owner Citizenship",
    hint: "JPG, PNG or PDF · max 5 MB",
    accept: "image/*,application/pdf",
    emoji: "🪪",
  },
  {
    key: "OWNER_PHOTO",
    label: "Owner Photo",
    hint: "Clear face photo · JPG/PNG",
    accept: "image/*",
    emoji: "🤳",
  },
];

export const Rider_DOC_LABELS = Object.fromEntries(
  Rider_DOCS.map((d) => [d.key, d.label]),
);
export const Merchant_DOC_LABELS = Object.fromEntries(
  Merchant_DOCS.map((d) => [d.key, d.label]),
);
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];
export const STEPS = ["Upload", "Review", "Done"];
