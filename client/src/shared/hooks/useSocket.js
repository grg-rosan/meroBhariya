import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { API } from './useApi';

export function useSocket(userId, onEvent) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    const socket = io(API, {
      auth: { token: localStorage.getItem('token') },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // ✅ matches backend emits exactly
    socket.on('rider:doc_approved', (data) => onEvent('doc_approved', data));
    socket.on('rider:verified',     (data) => onEvent('verified', data));
    socket.on('rider:doc_rejected', (data) => onEvent('doc_rejected', data));

    return () => socket.disconnect();
  }, [userId]);
}