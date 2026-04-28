import { useEffect, useRef,} from 'react'
import { io } from 'socket.io-client'
import { API } from './useApi'

export function useSocket(userId, onEvent) {
  const socketRef = useRef(null)
  const onEventRef = useRef(onEvent)

  // keep ref in sync without triggering reconnect
  useEffect(() => {
    onEventRef.current = onEvent
  }, [onEvent])

  useEffect(() => {
    if (!userId) return

    const socket = io(API, {
      auth: { token: localStorage.getItem('token') },
    })
    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message)
    })

    socket.on('rider:doc_approved', (data) => onEventRef.current('doc_approved', data))
    socket.on('rider:verified',     (data) => onEventRef.current('verified', data))
    socket.on('rider:doc_rejected', (data) => onEventRef.current('doc_rejected', data))

    return () => socket.disconnect()
  }, [userId])  

  return socketRef 
}