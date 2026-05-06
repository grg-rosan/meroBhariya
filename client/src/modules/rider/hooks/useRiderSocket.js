// src/modules/rider/hooks/useRiderSocket.js
// Drop-in replacement for the old useSocket(userId, onEvent) pattern.
// Now uses the shared generic useSocket(userId) and registers rider-specific events here.

import { useEffect }  from 'react';
import { useSocket }  from '../../../shared/hooks/useSocket';
import { useAuth }    from '../../auth/AuthContext';

/**
 * @param {Function} onEvent  - callback(eventName, data)
 *                              eventName: 'doc_approved' | 'verified' | 'doc_rejected' | 'shipment:assigned'
 */
export function useRiderSocket(onEvent) {
  const { user } = useAuth();
  const socket   = useSocket(user?.id);

  useEffect(() => {
    if (!socket || !onEvent) return;

    const handlers = {
      'rider:doc_approved':  (data) => onEvent('doc_approved',       data),
      'rider:verified':      (data) => onEvent('verified',           data),
      'rider:doc_rejected':  (data) => onEvent('doc_rejected',       data),
      'shipment:assigned':   (data) => onEvent('shipment:assigned',  data),
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
    };
  }, [socket, onEvent]);
}