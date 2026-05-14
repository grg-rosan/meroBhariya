// src/context/SocketContext.jsx
import { createContext, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../modules/auth/AuthContext";
import logger from "../utils/logger.js";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext(null);

export const SocketProvider = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const s = io(import.meta.env.VITE_API_URL, {
      auth: { token: localStorage.getItem("token") },
      autoConnect: true,
    });

    s.on("connect", () => {
      setSocket(s);
      logger.info({ socketId: s.id }, "[Socket] Connected");
    });
    s.on("disconnect", () => {
      setSocket(null);
      logger.info("[Socket] Disconnected");
    });
    s.on("connect_error", (err) => logger.error({ err }, "[Socket] Error"));

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      <Outlet />
    </SocketContext.Provider>
  );
};
