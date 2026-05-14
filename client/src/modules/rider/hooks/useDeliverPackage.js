import { useState }        from "react";
import { useNavigate }     from "react-router-dom";
import { useToast }        from "../../../context/ToastContext";

// ── Geolocation helper ────────────────────────────────────────
function useGeolocation() {
  const [loc,     setLoc]     = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const request = () =>
    new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setLoc(coords);
          setLoading(false);
          resolve(coords);
        },
        (e) => {
          setError(e.message);
          setLoading(false);
          reject(e);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  return { loc, error, loading, request };
}

// ── Main hook ─────────────────────────────────────────────────
export function useDeliverPackage(shipmentId) {
  const navigate = useNavigate();
  const toast    = useToast();
  const geo      = useGeolocation();

  const [submitting,    setSubmitting]    = useState(false);
  const [result,        setResult]        = useState(null); // null | "success" | "geofence" | "error"
  const [geofenceError, setGeofenceError] = useState(null); // { distanceMeters }

  const deliver = async ({ codCollected, podNote, podFile }) => {
    setSubmitting(true);
    setResult(null);
    setGeofenceError(null);

    // 1. Get GPS coords
    let coords;
    try {
      coords = await geo.request();
    } catch {
      toast({ message: "Could not get GPS. Enable location in browser settings.", type: "error" });
      setSubmitting(false);
      return;
    }

    // 2. Build payload — use FormData when a POD file is attached,
    //    plain JSON otherwise so the backend receives a consistent shape.
    let body;
    let headers = {};

    if (podFile) {
      body = new FormData();
      body.append("lat",          coords.lat);
      body.append("lng",          coords.lng);
      body.append("codCollected", parseFloat(codCollected) || 0);
      if (podNote) body.append("podNote", podNote);
      body.append("podFile", podFile);
      // No Content-Type header — browser sets multipart boundary automatically
    } else {
      body    = JSON.stringify({ lat: coords.lat, lng: coords.lng, codCollected: parseFloat(codCollected) || 0, podNote });
      headers = { "Content-Type": "application/json" };
    }

    // 3. Submit — raw fetch so we can inspect the structured error body
    try {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/shipments/${shipmentId}/deliver`, {
        method: "POST",
        headers,
        body,
      });

      // Parse JSON response regardless of status so we can read error codes
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // FIX: attach structured fields from the response body to the thrown error
        //      so the geofence branch below can read e.code and e.distanceMeters
        const err = new Error(data.message ?? "Delivery failed.");
        err.code            = data.code;            // e.g. "OUTSIDE_GEOFENCE"
        err.distanceMeters  = data.distanceMeters;
        throw err;
      }

      setResult("success");
      toast({ message: "Delivery confirmed!", type: "success" });
      setTimeout(() => navigate("/rider/manifest"), 2000);

    } catch (e) {
      if (e.code === "OUTSIDE_GEOFENCE") {
        setResult("geofence");
        setGeofenceError({ distanceMeters: e.distanceMeters });
      } else {
        setResult("error");
        toast({ message: e.message ?? "Delivery failed.", type: "error" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return { deliver, submitting, result, geofenceError, geo };
}