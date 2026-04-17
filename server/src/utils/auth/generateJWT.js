import jwt from "jsonwebtoken";

export const generateToken = (userID) => {
  const payload = { id: userID };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
  return token;
};