// src/utils/sendNotification.js
//
// Currently writes notifications to the console + can be extended to
// send emails (Nodemailer), SMS (Sparrow SMS — Nepal), or push notifications.
//
// To add email: install nodemailer and fill in sendEmail() below.
// To add SMS:   install axios and use Sparrow SMS API (sparrowsms.com).

// ─── Notification types ───────────────────────────────────────────────────────

export const NOTIFICATION_TYPE = {
  DOC_APPROVED:       "DOC_APPROVED",
  DOC_REJECTED:       "DOC_REJECTED",
  RIDER_VERIFIED:     "RIDER_VERIFIED",
  SHIPMENT_ASSIGNED:  "SHIPMENT_ASSIGNED",
  SHIPMENT_DELIVERED: "SHIPMENT_DELIVERED",
  COD_SETTLED:        "COD_SETTLED",
};

// ─── Main dispatcher ──────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {string} params.type     - NOTIFICATION_TYPE value
 * @param {object} params.user     - { id, fullName, email, phoneNumber }
 * @param {object} params.payload  - Extra data relevant to the notification
 */
export async function sendNotification({ type, user, payload = {} }) {
  const message = buildMessage(type, user, payload);

  if (!message) {
    console.warn(`[Notification] Unknown type: ${type}`);
    return;
  }

  console.log(`[Notification → ${user.fullName}] ${message}`);

  // Uncomment when ready:
  // await sendEmail({ to: user.email, subject: message.subject, body: message.body });
  // await sendSMS({ phone: user.phoneNumber, text: message.sms });
}

// ─── Message templates ────────────────────────────────────────────────────────

function buildMessage(type, user, payload) {
  const name = user.fullName;

  const templates = {
    [NOTIFICATION_TYPE.DOC_APPROVED]: {
      subject: "Your document has been approved — Porter",
      body:    `Hi ${name}, your document (${payload.docType}) has been approved.`,
      sms:     `Porter: Your document has been approved. You can now start using the platform.`,
    },
    [NOTIFICATION_TYPE.DOC_REJECTED]: {
      subject: "Action required: Document rejected — Porter",
      body:    `Hi ${name}, your document (${payload.docType}) was rejected. Reason: ${payload.note ?? "Please re-upload a clearer copy."}`,
      sms:     `Porter: Your document was rejected. Please re-upload. Reason: ${payload.note ?? "unclear image"}.`,
    },
    [NOTIFICATION_TYPE.RIDER_VERIFIED]: {
      subject: "You're verified! Start accepting rides — Porter",
      body:    `Hi ${name}, all your documents have been approved. You can now go online and accept deliveries.`,
      sms:     `Porter: Congratulations ${name}! You are now verified. Go online to start earning.`,
    },
    [NOTIFICATION_TYPE.SHIPMENT_ASSIGNED]: {
      subject: "New shipment assigned — Porter",
      body:    `Hi ${name}, shipment #${payload.trackingNumber} has been assigned to you.`,
      sms:     `Porter: New shipment #${payload.trackingNumber} assigned. Open the app for details.`,
    },
    [NOTIFICATION_TYPE.SHIPMENT_DELIVERED]: {
      subject: "Shipment delivered — Porter",
      body:    `Shipment #${payload.trackingNumber} was delivered by ${name}.`,
      sms:     `Porter: Shipment #${payload.trackingNumber} delivered successfully.`,
    },
    [NOTIFICATION_TYPE.COD_SETTLED]: {
      subject: "COD settlement processed — Porter",
      body:    `Hi ${name}, your COD amount of रू ${payload.amount} has been settled.`,
      sms:     `Porter: COD settlement of Rs ${payload.amount} processed for ${name}.`,
    },
  };

  return templates[type] ?? null;
}

// ─── Email stub (fill in when ready) ─────────────────────────────────────────

// async function sendEmail({ to, subject, body }) {
//   const transporter = nodemailer.createTransport({
//     host:   process.env.SMTP_HOST,
//     port:   Number(process.env.SMTP_PORT),
//     secure: false,
//     auth: {
//       user: process.env.SMTP_USER,
//       pass: process.env.SMTP_PASS,
//     },
//   });
//   await transporter.sendMail({
//     from:    `"Porter" <${process.env.SMTP_FROM}>`,
//     to, subject,
//     text:    body,
//   });
// }

// ─── SMS stub — Sparrow SMS (Nepal) ──────────────────────────────────────────

// async function sendSMS({ phone, text }) {
//   await axios.post("http://api.sparrowsms.com/v2/sms/", {
//     token:  process.env.SPARROW_SMS_TOKEN,
//     from:   "Porter",
//     to:     phone,
//     text,
//   });
// }