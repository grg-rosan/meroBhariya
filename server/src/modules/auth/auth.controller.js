import { registerUserService, logInUserService, changeUserPasswordService } from "./auth.service.js";
import { generateToken } from "../../utils/generateToken.js";
import asyncHandler from "../../utils/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const user = await registerUserService(req.body);

  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.id,           // id ✓
        name: user.fullName,   // fullName ✓
        email: user.email,
        role: user.role.toLowerCase(),
      },
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const user = await logInUserService(req.body);

  const token = generateToken(user.id); // id ✓

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: {
        id: user.id,           // id ✓
        name: user.fullName,   // fullName ✓
        email: user.email,
        role: user.role.toLowerCase(),
      },
      token,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

const changePassword = asyncHandler(async (req, res) => {
  await changeUserPasswordService(req.user.id, req.body); // id ✓

  res.status(200).json({
    status: "success",
    message: "Password changed successfully",
  });
});

export { register, login, logout, changePassword };