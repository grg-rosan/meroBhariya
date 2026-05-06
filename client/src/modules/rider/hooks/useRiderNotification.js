// src/modules/rider/hooks/useRiderNotifications.js
// Listens to socket events emitted by notification.consumer.js for rider users.
//
// Backend emits to room "user:<riderUserId>":
//   "shipment:assigned"   — dispatcher assigned this rider to a shipment
//   "rider:doc_approved"  — admin approved a document
//   "rider:doc_rejected"  — admin rejected a document
//   "rider:verified"      — rider profile fully verified by admin
//
// Mount once in RiderLayout so it runs for the whole rider session.

import { useEffect }        from "react";
import { useSocket }        from "../../../shared/hooks/useSocket";
import { useNotifications } from "../../../context/NotificationContext";
import { useAuth }          from "../../auth/AuthContext";
import { formatDocType } from "../../../shared/constants/doc.constants";

export function useRiderNotifications() {
  const { user } = useAuth();
  const socket   = useSocket(user?.id);
  const { push } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    // ── shipment:assigned ─────────────────────────────────────────────────────
    // Payload: { shipmentId, trackingNumber, deliveryAddress, receiverName,
    //            receiverPhone, fareSnapshot, riderUserId }
    const handleAssigned = (payload) => {
      push({
        type:           "ASSIGNED",
        title:          "New delivery assigned",
        message:        `Pick up #${payload.trackingNumber} for ${payload.receiverName}`,
        trackingNumber: payload.trackingNumber,
        shipmentId:     payload.shipmentId,
        deliveryAddress: payload.deliveryAddress,
        receiverName:   payload.receiverName,
        receiverPhone:  payload.receiverPhone,
      });
    };

    // ── rider:doc_approved ────────────────────────────────────────────────────
    // Payload: { documentType } — e.g. "CITIZENSHIP_FRONT"
    const handleDocApproved = (payload) => {
      push({
        type:    "DOC_APPROVED",
        title:   "Document approved",
        message: `Your ${formatDocType(payload.documentType)} was approved`,
      });
    };

    // ── rider:doc_rejected ────────────────────────────────────────────────────
    // Payload: { documentType, reason }
    const handleDocRejected = (payload) => {
      push({
        type:    "DOC_REJECTED",
        title:   "Document rejected",
        message: payload.reason
          ? `${formatDocType(payload.documentType)}: ${payload.reason}`
          : `Your ${formatDocType(payload.documentType)} was rejected`,
      });
    };

    // ── rider:verified ────────────────────────────────────────────────────────
    // Payload: { riderId }
    const handleVerified = () => {
      push({
        type:    "VERIFIED",
        title:   "Account verified 🎉",
        message: "You can now accept deliveries",
      });
    };

    socket.on("shipment:assigned",   handleAssigned);
    socket.on("rider:doc_approved",  handleDocApproved);
    socket.on("rider:doc_rejected",  handleDocRejected);
    socket.on("rider:verified",      handleVerified);

    return () => {
      socket.off("shipment:assigned",   handleAssigned);
      socket.off("rider:doc_approved",  handleDocApproved);
      socket.off("rider:doc_rejected",  handleDocRejected);
      socket.off("rider:verified",      handleVerified);
    };
  }, [socket, push]);
}

