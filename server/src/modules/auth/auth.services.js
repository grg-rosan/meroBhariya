// src/modules/auth/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/db.config.js";
import AppError from "../../utils/error/appError.js";
import { getRedisClient } from "../../config/redis.config.js";
import { otpEmailTemplate } from "../../utils/services/emailTemplate.js";
import { transporter } from "../../config/email.config.js";
import { resetEmailTemplate } from "../../utils/services/resetEmail.js";


const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || "7d";
const RESET_TTL = 10 * 60;

const OTP_TTL = 5 * 60;
const RATE_LIMIT_TTL = 60 * 60;
const MAX_OTP_TRIES = 3;

// _______HELPERS_______
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

//_______LOGIN_______
export async function login({ email, password }) {
  console.log("server:",email, password)

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }
  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

//_______REGISTER RIDER_______
// Frontend sends:
//   basicInfo:  { name, email, phone, password }
//   details:    { vehicleType (name string), plateNumber, address }
//
// Schema requires:
//   User          → fullName, email, passwordHash, phoneNumber, role: RIDER
//   RiderProfile  → vehicleTypeId (looked up by name), licenseNumber (plateNumber),
//                   vehicleNumber (plateNumber — same field, adjust if you collect separately)

export async function registerRider({
  name,
  email,
  phone,
  password,
  vehicleType,
  plateNumber,
  address,
}) {
  // 1. Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneNumber: phone }] },
  });
  if (existing) {
    throw {
      status: 409,
      message:
        existing.email === email
          ? "Email already registered."
          : "Phone number already registered.",
    };
  }

  // 2. Resolve vehicleType name → id
  //    VehicleType.name is unique in the schema
  const vehicleTypeRecord = await prisma.vehicleType.findUnique({
    where: { name: vehicleType },
  });
  if (!vehicleTypeRecord || !vehicleTypeRecord.isActive) {
    throw {
      status: 400,
      message: `Vehicle type "${vehicleType}" not found or inactive.`,
    };
  }

  // 3. Check plate uniqueness (stored as both licenseNumber and vehicleNumber for now)
  const plateExists = await prisma.riderProfile.findFirst({
    where: {
      OR: [{ vehicleNumber: plateNumber }, { licenseNumber: plateNumber }],
    },
  });
  if (plateExists) {
    throw {
      status: 409,
      message: "Vehicle / plate number already registered.",
    };
  }

  // 4. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 5. Create User + RiderProfile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        fullName: name,
        email,
        phoneNumber: phone,
        passwordHash,
        role: "RIDER",
        riderProfile: {
          create: {
            vehicleTypeId: vehicleTypeRecord.id,
            licenseNumber: plateNumber, // update if you collect license number separately
            vehicleNumber: plateNumber,
          },
        },
      },
    });
    return newUser;
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

// ─── Register Merchant ───────────────────────────────────────────────────────
//
// Frontend sends:
//   basicInfo:  { name, email, phone, password }
//   details:    { businessName, businessType (unused in schema — stored in businessName), address, panNumber }
//
// Schema requires:
//   User            → fullName, email, passwordHash, phoneNumber, role: MERCHANT
//   MerchantProfile → businessName, panNumber (optional), pickupAddress

export async function registerMerchant({
  name,
  email,
  phone,
  password,
  businessName,
  address,
  panNumber,
}) {
  // 1. Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneNumber: phone }] },
  });
  if (existing) {
    throw {
      status: 409,
      message:
        existing.email === email
          ? "Email already registered."
          : "Phone number already registered.",
    };
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create User + MerchantProfile in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        fullName: name,
        email,
        phoneNumber: phone,
        passwordHash,
        role: "MERCHANT",
        merchantProfile: {
          create: {
            businessName,
            panNumber: panNumber || null,
            pickupAddress: address,
          },
        },
      },
    });
    return newUser;
  });

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

// ─── Send OTP ────────────────────────────────────────────────────────────────

export async function sendOtp(userId, email) {
  const redis = await getRedisClient();

  // 1. Rate limit — max 3 requests per hour per user
  const limitKey = `otp_limit:${userId}`;
  const attempts = await redis.incr(limitKey);
  if (attempts === 1) await redis.expire(limitKey, RATE_LIMIT_TTL);
  if (attempts > MAX_OTP_TRIES) {
    throw new AppError("Too many OTP requests. Try again in 1 hour.", 429);
  }

  // 2. Generate and store OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.set(`otp:${userId}`, otp, { EX: OTP_TTL });

  const mailOptions = {
    from: `MeroBhariya <${process.env.EMAIL_USER}>`,
    to:email,
    subject:"Verify Your MeroBhariya Account",
    html: otpEmailTemplate(otp)
  }

  await transporter.sendMail(mailOptions);
  console.log(`[DEV] OTP for userId ${userId}: ${otp}`);


  return { message: "OTP sent successfully." };
}

// ─── Verify OTP ──────────────────────────────────────────────────────────────

export async function verifyOtp(userId, inputOtp) {
  const redis = await getRedisClient();
  const stored = await redis.get(`otp:${userId}`);

  if (!stored)
    throw new AppError("OTP has expired. Please request a new one.", 400);
  if (stored !== inputOtp) throw new AppError("Invalid OTP.", 400);

  // Single-use — delete immediately after success
  await redis.del(`otp:${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select:{role:true},
  });
  if (user.role === "MERCHANT") {
  await prisma.merchantProfile.update({
    where: { userId },
    data: { isEmailVerified: true },
  });
} else if (user.role === "RIDER") {
  await prisma.riderProfile.update({
    where: { userId },
    data: { isEmailVerified: true },
  });
}
  return { message: "Email verified successfully." };
}

export async function forgotPassword(email) {
  const redis = await getRedisClient();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return 200 — never reveal whether the email exists
  if (!user || !user.isActive) {
    return {
      message: "If that email is registered, a reset link has been sent.",
    };
  }

  // Generate token and store against userId
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(`pwd_reset:${token}`, String(user.id), { EX: RESET_TTL });


  const resetUrl = `${process.env.APP_URL}/reset-password?token=${token}`;
  const mailOptions = {
  from: `MeroBhariya <${process.env.EMAIL_USER}>`,
  to: email,
  subject: "Reset Your MeroBhariya Password",
  html: resetEmailTemplate(resetUrl), 
  };
  await transporter.sendMail(mailOptions);
  console.log(`[DEV] Reset URL for ${email}: ${resetUrl}`); 
  return {
    message: "If that email is registered, a reset link has been sent.",
  };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(token, newPassword) {
  const redis = await getRedisClient();
  const key = `pwd_reset:${token}`;

  const userId = await redis.get(key);
  if (!userId) throw new AppError("Reset link is invalid or has expired.", 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  await redis.del(key); // single-use token
  return { message: "Password reset successfully. You can now log in." };
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      merchantProfile: {
        select: { id: true, businessName: true, pickupAddress: true },
      },
      riderProfile: {
        select: {
          id: true,
          isVerified: true,
          isOnline: true,
          vehicleTypeId: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    throw { status: 401, message: "User not found or deactivated." };
  }

  return sanitizeUser(user);
}
// ─── Create Staff (Admin or Dispatcher) ──────────────────────────────────────
// Only called by an existing ADMIN via POST /api/admin/staff
// No public registration — accounts are created internally

export async function createStaff({
  name,
  email,
  phone,
  password,
  role,
  createdByUserId,
}) {
  // Only ADMIN and DISPATCHER roles allowed through this path
  if (!["ADMIN", "DISPATCHER"].includes(role)) {
    throw new AppError("Invalid staff role. Must be ADMIN or DISPATCHER.", 400);
  }

  // Check duplicates
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneNumber: phone }] },
  });
  if (existing) {
    throw new AppError(
      existing.email === email
        ? "Email already registered."
        : "Phone number already registered.",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      fullName: name,
      email,
      phoneNumber: phone,
      passwordHash,
      role,
      isActive: true,
    },
  });

  console.log(
    `[Auth] Staff created: ${role} — ${email} (by userId: ${createdByUserId})`,
  );

  // Return user without token — staff accounts are not auto-logged in
  // They use the normal /login page
  return sanitizeUser(user);
}

// ─── Toggle staff active status ──────────────────────────────────────────────

export async function toggleStaffStatus(targetUserId, adminUserId) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new AppError("User not found.", 404);

  // Prevent admin from deactivating themselves
  if (targetUserId === adminUserId) {
    throw new AppError("You cannot deactivate your own account.", 400);
  }

  // Only staff roles can be toggled this way
  if (!["ADMIN", "DISPATCHER"].includes(user.role)) {
    throw new AppError(
      "Use the verify module to manage riders and merchants.",
      400,
    );
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: !user.isActive },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
}

// ─── List all staff ───────────────────────────────────────────────────────────

export async function getStaffList() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "DISPATCHER"] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
