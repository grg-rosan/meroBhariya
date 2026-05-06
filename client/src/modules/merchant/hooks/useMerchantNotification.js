// src/modules/merchant/hooks/useMerchantNotifications.js
// Listens to socket events emitted by notification.consumer.js for merchant users.
//
// Backend emits to room "user:<merchantUserId>":
//   "shipment:status_updated"  — any status change (ASSIGNED, IN_HUB, OUT_FOR_DELIVERY, DELIVERED, CANCELLED)
//   "shipment:new"             — not used for merchant, but safe to ignore
//
// This hook feeds those events into NotificationContext (persistent, localStorage-backed).
// Mount it once in MerchantLayout so it runs for the whole merchant session.

import { useEffect }          from "react";
import { useSocket }          from "../../../shared/hooks/useSocket";
import { useNotifications }   from "../../../context/NotificationContext";
import { useAuth }            from "../../auth/AuthContext";

// Human-readable labels for each status
const STATUS_LABEL = {
  PENDING:          "Shipment created",
  ASSIGNED:         "Rider assigned",
  PICKED_UP:        "Package picked up",
  IN_HUB:           "Package arrived at hub",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED:        "Delivered",
  CANCELLED:        "Shipment cancelled",
};

// Emoji icon per status — maps to TYPE_ICON fallback if you prefer
const STATUS_ICON = {
  PENDING:          "📦",
  ASSIGNED:         "🛵",
  PICKED_UP:        "🚀",
  IN_HUB:           "🏠",
  OUT_FOR_DELIVERY: "🚚",
  DELIVERED:        "✅",
  CANCELLED:        "❌",
};

export function useMerchantNotifications() {
  const { user } = useAuth();
  const socket   = useSocket(user?.id);
  const { push } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    // ── shipment:status_updated ───────────────────────────────────────────────
    // Emitted by: dispatcher scanToHub, assignRider, updateShipmentStatus
    // Payload: { shipmentId, trackingNumber, status, message }
    const handleStatusUpdate = (payload) => {
      push({
        type:           payload.status,           // e.g. "ASSIGNED" — matched by TYPE_ICON
        title:          STATUS_LABEL[payload.status] ?? "Shipment update",
        message:        payload.message ?? `#${payload.trackingNumber} is now ${payload.status}`,
        trackingNumber: payload.trackingNumber,
        shipmentId:     payload.shipmentId,
        icon:           STATUS_ICON[payload.status] ?? "📦",
      });
    };

    socket.on("shipment:status_updated", handleStatusUpdate);

    return () => {
      socket.off("shipment:status_updated", handleStatusUpdate);
    };
  }, [socket, push]);
}