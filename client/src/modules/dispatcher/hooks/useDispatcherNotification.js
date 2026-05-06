// src/modules/dispatcher/hooks/useDispatcherNotifications.js
// Listens for "shipment:new" socket events (emitted by dispatcher.consumer.js)
// and feeds them into NotificationContext + a local live-feed state.

import { useState, useEffect, useCallback } from "react";
import { useSocket }        from "../../../shared/hooks/useSocket";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth }          from "../../auth/AuthContext";

export function useDispatcherNotifications() {
  const { user }                = useAuth();
  const socket                  = useSocket(user?.id);
  const { push, notifications,
          markRead, markAllRead,
          unreadCount }         = useNotifications();

  // Live feed — new shipments that arrived this session (for the blinking list at top)
  const [liveShipments, setLiveShipments] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleNewShipment = (shipment) => {
      // 1. Push into persistent NotificationContext (survives navigation)
      push({
        type:           "NEW_SHIPMENT",
        title:          "New Shipment",
        message:        `#${shipment.trackingNumber} needs a rider assigned`,
        trackingNumber: shipment.trackingNumber,
        shipmentId:     shipment.id,
        vehicleType:    shipment.vehicleType?.name ?? null,
        merchant:       shipment.merchant?.businessName ?? null,
        createdAt:      shipment.createdAt ?? new Date().toISOString(),
      });

      // 2. Also add to live feed (session-only, for the top banner)
      setLiveShipments((prev) => [shipment, ...prev].slice(0, 20)); // cap at 20
    };

    socket.on("shipment:new", handleNewShipment);
    return () => socket.off("shipment:new", handleNewShipment);
  }, [socket, push]);

  const clearLiveFeed = useCallback(() => setLiveShipments([]), []);

  // Filter only shipment notifications for this page
  const shipmentNotifications = notifications.filter(
    (n) => n.type === "NEW_SHIPMENT"
  );

  return {
    liveShipments,        // brand-new arrivals this session
    shipmentNotifications, // all persisted notifications
    unreadCount,
    markRead,
    markAllRead,
    clearLiveFeed,
  };
}