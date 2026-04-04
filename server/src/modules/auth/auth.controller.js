import { registerUser, logInUser } from "./auth.service.js";
import { generateToken } from "../../utils/generateToken.js";
import asyncHandler from "../../utils/asyncHandler.js";

const register = asyncHandler(async (req, res, next) => {
  const user = await registerUser(req.body);
  res.status(201).json({
    status: "success",
    data: {
      user: {
        id: user.userID,
        name: user.name,
        email: user.email,
      },
    },
  });
});

const login = asyncHandler(async(req, res) => {
  //login user | if loginUser throws new error  => asyncHandler catches  => globalMiddleware responds
  const user = await logInUser(req.body);

  //generate jwt token
  const token = generateToken(user.userID);
  console.log(token);

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
        id: user.userID,
        name: user.name,
        email: user.email,
        role: user.role.toLocaleLowerCase(),
      },
      // do not show token here because it is already saved in cookie in generateToken function
      token,
    },
  });
})

const logout = asyncHandler(async(req, res) => {
    res.clearCookie("token", {
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
    });

    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
})

const changePassword = asyncHandler(async(req,res) => {

})
export { register, login, logout,changePassword };