import jwt from "jsonwebtoken";
import cookie from "cookie";
import { prisma } from "../../config/db.config.js";

let io;

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};

export const initSocketHandlers = (socketIO) => {
  io = socketIO;

  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");
      const token = cookies.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, role: true, fullName: true },
      });
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Connected: ${socket.user.fullName} (${socket.user.id})`);

    socket.on("disconnect", () => {
      console.log(`Disconnected: ${socket.user.fullName} (${socket.user.id})`);
    });
  });
};