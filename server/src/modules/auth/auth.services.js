import { prisma } from "../../config/db.config.js";
import bcrypt from "bcryptjs";
import { createMerchantProfile, createRiderProfile } from "../../utils/profileCreator.js";
import AppError from "../../utils/appError.js";
const registerUserService = async (userData) => {
  const { fullName, email, password, phoneNumber, role } = userData;

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) throw new AppError("Email already in use", 400);

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { fullName, email, passwordHash, phoneNumber, role },
      });

      if (role === "MERCHANT") {
        await createMerchantProfile(tx, newUser.id, userData);
      } else if (role === "RIDER") {
        await createRiderProfile(tx, newUser.id, userData);
      }

      return newUser;
    });

    return user;
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0] ?? "Field";
      throw new AppError(`${field} already in use`, 400);
    }
    throw error;
  }
};

const logInUserService = async (userData) => {
  const { email, password } = userData;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError("Invalid email or password", 401);

  const validPassword = await bcrypt.compare(password, user.passwordHash); // passwordHash ✓
  if (!validPassword) throw new AppError("Invalid email or password", 401);

  return user;
};

const changeUserPasswordService = async (userId, { currentPassword, newPassword }) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError("User not found", 404);

  const validPassword = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!validPassword) throw new AppError("Current password is incorrect", 401);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });
};

export { registerUserService, logInUserService, changeUserPasswordService };