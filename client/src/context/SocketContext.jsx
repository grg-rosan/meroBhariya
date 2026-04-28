import { createContext, useEffect, useRef } from "react";
import { useAuth } from "../modules/auth/AuthContext";
import {Outlet} from "react-router-dom"
import { io } from "socket.io-client"
const SocketContext = createContext(null)
export const SocketProvider = () => {
    const user = useAuth();
    const socketRef = useRef(null)

    useEffect(() => {
        if (!user) return;
        socketRef.current = io(import.meta.env.VITE_API_URL, {
            auth: { token: localStorage.getItem("token") },  
            autoConnect: true,
        });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    }, [user])

    return (
        <SocketContext.Provider value={socketRef}>
            <Outlet />
        </SocketContext.Provider>
    )
}