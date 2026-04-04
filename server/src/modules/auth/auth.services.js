import { prisma } from "../../config/db.config.js";
import bcrypt from "bcryptjs";
import { createCustomerProfile, createRiderProfile } from "../../utils/profileCreator.js";
import AppError from "../../utils/AppError.js";

const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) throw new AppError("Email already in use", 400);

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const user = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { name, email, password: hashedPassword, role },
            });

            if (role === "CUSTOMER") {
                await createCustomerProfile(tx, user.userID, userData);
            } else if (role === "RIDER") {
                await createRiderProfile(tx, user.userID, userData);
            }
            return user
        });
        return user
    } catch (error) {
        if (error.code === "P2002") {
            const field  = error.meta?.target?.[0] ?? 'Field';
            throw new AppError(`${field} already in use`, 400)
        }
        throw error
    }
};
const logInUser = async (userData) => {
    const { email, password } = userData;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AppError("Invalid email or password", 401);

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) throw new AppError("Invalid email or password", 401);

    return user;
};

export { registerUser, logInUser };