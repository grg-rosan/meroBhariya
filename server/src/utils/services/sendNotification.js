import logger from "../../infrastructure/logger/index.js";
import { transporter } from "../../config/email.config.js";

// ─── Notification types ───────────────────────────────────────────────────────

export const NOTIFICATION_TYPE = {
  DOC_APPROVED:       "DOC_APPROVED",
  DOC_REJECTED:       "DOC_REJECTED",
  RIDER_VERIFIED:     "RIDER_VERIFIED",
  MERCHANT_VERIFIED:  "MERCHANT_VERIFIED",
  SHIPMENT_ASSIGNED:  "SHIPMENT_ASSIGNED",
  SHIPMENT_DELIVERED: "SHIPMENT_DELIVERED",
  COD_SETTLED:        "COD_SETTLED",
};

// ─── Main dispatcher ──────────────────────────────────────────────────────────

export async function sendNotification({ type, user, payload = {} }) {
  const message = buildMessage(type, user, payload);

  if (!message) {
    logger.warn({ type }, "[Notification] Unknown type");
    return;
  }

  try {
    await transporter.sendMail({
      from:    `"MeroBhariya" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: message.subject,
      html:    message.body,
    });
    logger.info({ userId: user.id, type }, "[Notification] Email sent");
  } catch (err) {
    logger.error({ userId: user.id, type, err }, "[Notification] Email failed");
  }
}

// ─── Message templates ────────────────────────────────────────────────────────

function buildMessage(type, user, payload) {
  const name = user.fullName;

  const templates = {
    [NOTIFICATION_TYPE.DOC_APPROVED]: {
      subject: "Your document has been approved — MeroBhariya",
      body:    `Hi ${name}, your document (${payload.docType}) has been approved.`,
    },
    [NOTIFICATION_TYPE.DOC_REJECTED]: {
      subject: "Action required: Document rejected — MeroBhariya",
      body:    `Hi ${name}, your document (${payload.docType}) was rejected. Reason: ${payload.note ?? "Please re-upload a clearer copy."}`,
    },
    [NOTIFICATION_TYPE.RIDER_VERIFIED]: {
      subject: "You're verified! Start accepting rides — MeroBhariya",
      body:    `Hi ${name}, all your documents have been approved. You can now go online and accept deliveries.`,
    },
    [NOTIFICATION_TYPE.MERCHANT_VERIFIED]: {
      subject: "Your merchant account is verified — MeroBhariya",
      body:    `Hi ${name}, your merchant account has been verified. You can now start creating shipments.`,
    },
    [NOTIFICATION_TYPE.SHIPMENT_ASSIGNED]: {
      subject: "New shipment assigned — MeroBhariya",
      body:    `Hi ${name}, shipment #${payload.trackingNumber} has been assigned to you.`,
    },
    [NOTIFICATION_TYPE.SHIPMENT_DELIVERED]: {
      subject: "Shipment delivered — MeroBhariya",
      body:    `Shipment #${payload.trackingNumber} was delivered by ${name}.`,
    },
    [NOTIFICATION_TYPE.COD_SETTLED]: {
      subject: "COD settlement processed — MeroBhariya",
      body:    `Hi ${name}, your COD amount of रू ${payload.amount} has been settled.`,
    },
  };

  return templates[type] ?? null;
}