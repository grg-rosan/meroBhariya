// src/modules/auth/auth.service.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "node:crypto";
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
// ─── Helpers ──────────────────────────────────────────────────────────────────

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function sanitizeUser(user) {
  const profile = user.role === "RIDER" ? user.riderProfile : user.merchantProfile;
  return {
    id:              user.id,
    email:           user.email,
    fullName:        user.fullName,
    phoneNumber:     user.phoneNumber,
    role:            user.role,
    isActive:        user.isActive,
    isEmailVerified: profile?.isEmailVerified ?? false,
  };
}

async function sendEmail(to, subject, html) {
  await transporter.sendMail({
    from: `MeroBhariya <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ─── Role creators for registration ──────────────────────────────────────────

const ROLE_CREATORS = {
  rider: async (tx, { name, email, phone, passwordHash, vehicleType, plateNumber }) => {
    const vehicleTypeRecord = await prisma.vehicleType.findUnique({
      where: { name: vehicleType },
    });
    if (!vehicleTypeRecord?.isActive)
      throw new AppError(`Vehicle type "${vehicleType}" not found or inactive.`, 400);

    return tx.user.create({
      data: {
        fullName: name, email, phoneNumber: phone, passwordHash, role: "RIDER",
        riderProfile: {
          create: {
            vehicleTypeId: vehicleTypeRecord.id,
            licenseNumber: plateNumber,
            vehicleNumber: plateNumber,
            isEmailVerified: true,
          },
        },
      },
      include: { riderProfile: { select: { isEmailVerified: true } } },
    });
  },

  merchant: async (tx, { name, email, phone, passwordHash, businessName, address, panNumber }) => {
    return tx.user.create({
      data: {
        fullName: name, email, phoneNumber: phone, passwordHash, role: "MERCHANT",
        merchantProfile: {
          create: {
            businessName,
            panNumber: panNumber || null,
            pickupAddress: address,
            isEmailVerified: true,
          },
        },
      },
      include: { merchantProfile: { select: { isEmailVerified: true } } },
    });
  },
};

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      riderProfile:    { select: { isEmailVerified: true } },
      merchantProfile: { select: { isEmailVerified: true } },
    },
  });

  if (!user || !user.isActive)
    throw new AppError("Invalid email or password", 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError("Invalid email or password", 401);

  const token = signToken({ userId: user.id, role: user.role });
  return { token, user: sanitizeUser(user) };
}

// ─── Initiate Registration ────────────────────────────────────────────────────

export async function initiateRegistration(role, payload) {
  const redis = await getRedisClient();
  const { email, phone } = payload;

  if (!ROLE_CREATORS[role])
    throw new AppError("Invalid role.", 400);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneNumber: phone }] },
  });
  if (existing) {
    throw new AppError(
      existing.email === email ? "Email already registered." : "Phone number already registered.",
      409
    );
  }

  const otp = randomInt(100000, 1000000).toString();
  await redis.set(`pending_reg:${email}`, JSON.stringify({ role, payload, otp }), { EX: 600 });

  await sendEmail(email, "Verify Your MeroBhariya Account", otpEmailTemplate(otp));
  console.log(`[DEV] OTP for ${email}: ${otp}`);

  return { message: "OTP sent to your email." };
}

// ─── Complete Registration ────────────────────────────────────────────────────

export async function completeRegistration(email, inputOtp) {
  const redis = await getRedisClient();
  const raw = await redis.get(`pending_reg:${email}`);

  if (!raw) throw new AppError("Registration expired. Please start again.", 400);

  const { role, payload, otp } = JSON.parse(raw);

  if (otp !== inputOtp) throw new AppError("Invalid OTP.", 400);

  const creator = ROLE_CREATORS[role];
  if (!creator) throw new AppError("Invalid role.", 400);

  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

  await prisma.$transaction(tx => creator(tx, { ...payload, passwordHash }));

  await redis.del(`pending_reg:${email}`);

  return { message: "Registration complete. You can now log in." };
}

// ─── Resend Registration OTP ──────────────────────────────────────────────────

export async function resendRegistrationOtp(email) {
  const redis = await getRedisClient();
  const raw = await redis.get(`pending_reg:${email}`);

  if (!raw) throw new AppError("Registration session expired. Please start again.", 400);

  const parsed = JSON.parse(raw);
  const otp = randomInt(100000, 1000000).toString();
  parsed.otp = otp;

  await redis.set(`pending_reg:${email}`, JSON.stringify(parsed), { EX: 600 });
  await sendEmail(email, "Verify Your MeroBhariya Account", otpEmailTemplate(otp));
  console.log(`[DEV] Resent OTP for ${email}: ${otp}`);

  return { message: "OTP resent." };
}

// ─── Send OTP (post-login verification) ──────────────────────────────────────

export async function sendOtp(userId, email) {
  const redis = await getRedisClient();

  const limitKey = `otp_limit:${userId}`;
  const attempts = await redis.incr(limitKey);
  if (attempts === 1) await redis.expire(limitKey, RATE_LIMIT_TTL);
  if (attempts > MAX_OTP_TRIES)
    throw new AppError("Too many OTP requests. Try again in 1 hour.", 429);

  const otp = randomInt(100000, 1000000).toString();
  await redis.set(`otp:${userId}`, otp, { EX: OTP_TTL });

  await sendEmail(email, "Verify Your MeroBhariya Account", otpEmailTemplate(otp));
  console.log(`[DEV] OTP for userId ${userId}: ${otp}`);

  return { message: "OTP sent successfully." };
}

// ─── Verify OTP (post-login verification) ────────────────────────────────────

export async function verifyOtp(userId, inputOtp) {
  const redis = await getRedisClient();
  const stored = await redis.get(`otp:${userId}`);

  if (!stored) throw new AppError("OTP has expired. Please request a new one.", 400);
  if (stored !== inputOtp) throw new AppError("Invalid OTP.", 400);

  await redis.del(`otp:${userId}`);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new AppError("User not found.", 404);

  // ← only update the correct profile, not both
  if (user.role === "RIDER") {
    await prisma.riderProfile.update({
      where: { userId },
      data: { isEmailVerified: true },
    });
  } else if (user.role === "MERCHANT") {
    await prisma.merchantProfile.update({
      where: { userId },
      data: { isEmailVerified: true },
    });
  }

  return { message: "Email verified successfully." };
}

// ─── Forgot Password ──────────────────────────────────────────────────────────

export async function forgotPassword(email) {
  const redis = await getRedisClient();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    return { message: "If that email is registered, a reset code has been sent." };
  }

  const limitKey = `pwd_reset_limit:${user.id}`;
  const attempts = await redis.incr(limitKey);
  if (attempts === 1) await redis.expire(limitKey, RATE_LIMIT_TTL);
  if (attempts > MAX_OTP_TRIES)
    throw new AppError("Too many requests. Try again in 1 hour.", 429);

  const code = randomInt(100000, 1000000).toString();
  await redis.set(`pwd_reset:${user.id}`, code, { EX: RESET_TTL });

  await sendEmail(email, "Reset Your MeroBhariya Password", resetEmailTemplate(code));
  console.log(`[DEV] Reset code for ${email}: ${code}`);

  return { message: "If that email is registered, a reset code has been sent." };
}

// ─── Reset Password ───────────────────────────────────────────────────────────

export async function resetPassword(email, code, newPassword) {
  const redis = await getRedisClient();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new AppError("Invalid request.", 400);

  const key = `pwd_reset:${user.id}`;
  const stored = await redis.get(key);

  if (!stored) throw new AppError("Reset code has expired. Please request a new one.", 400);
  if (stored !== code) throw new AppError("Invalid reset code.", 400);

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await redis.del(key);
  await redis.del(`pwd_reset_limit:${user.id}`);

  return { message: "Password reset successfully. You can now log in." };
}

// ─── Get Me ───────────────────────────────────────────────────────────────────

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      merchantProfile: {
        select: { id: true, businessName: true, pickupAddress: true, isEmailVerified: true },
      },
      riderProfile: {
        select: { id: true, isVerified: true, isOnline: true, vehicleTypeId: true, isEmailVerified: true },
      },
    },
  });

  if (!user) throw new AppError("User not found.", 404);

  const profile = user.role === "RIDER" ? user.riderProfile : user.merchantProfile;

  return {
    id:              user.id,
    email:           user.email,
    fullName:        user.fullName,
    phoneNumber:     user.phoneNumber,
    role:            user.role,
    isActive:        user.isActive,
    isEmailVerified: profile?.isEmailVerified ?? false,
    profile,
  };
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function createStaff({ name, email, phone, password, role, createdByUserId }) {
  if (!["ADMIN", "DISPATCHER"].includes(role))
    throw new AppError("Invalid staff role. Must be ADMIN or DISPATCHER.", 400);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phoneNumber: phone }] },
  });
  if (existing) {
    throw new AppError(
      existing.email === email ? "Email already registered." : "Phone number already registered.",
      409,
    );
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { fullName: name, email, phoneNumber: phone, passwordHash, role, isActive: true },
  });

  console.log(`[Auth] Staff created: ${role} — ${email} (by userId: ${createdByUserId})`);
  return sanitizeUser(user);
}

export async function toggleStaffStatus(targetUserId, adminUserId) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) throw new AppError("User not found.", 404);

  if (targetUserId === adminUserId)
    throw new AppError("You cannot deactivate your own account.", 400);

  if (!["ADMIN", "DISPATCHER"].includes(user.role))
    throw new AppError("Use the verify module to manage riders and merchants.", 400);

  return prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: !user.isActive },
    select: { id: true, fullName: true, email: true, role: true, isActive: true },
  });
}

export async function getStaffList() {
  return prisma.user.findMany({
    where: { role: { in: ["ADMIN", "DISPATCHER"] } },
    select: {
      id: true, fullName: true, email: true,
      phoneNumber: true, role: true, isActive: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}