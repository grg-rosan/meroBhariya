import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate }     from "react-router-dom";
import { useToast }        from "../../../context/ToastContext";

const IS_DEV = import.meta.env.DEV;

function useGeolocation() {
  const [loc,     setLoc]     = useState(null);
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);

  const request = () =>
    new Promise((resolve, reject) => {
      if (IS_DEV) {
        const coords = { lat: 27.7172, lng: 85.3240 };
        setLoc(coords);
        resolve(coords);
        return;
      }
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

export function useDeliverPackage(shipmentId) {
  const navigate = useNavigate();
  const toast    = useToast();
  const geo      = useGeolocation();

  const [submitting,    setSubmitting]    = useState(false);
  const [result,        setResult]        = useState(null);
  const [geofenceError, setGeofenceError] = useState(null);

  const inFlightRef   = useRef(false);
  const deliveredRef  = useRef(false);
  const geoRequestRef = useRef(null);
  geoRequestRef.current = geo.request;
  const toastRef = useRef(null);
  toastRef.current = toast;

  useEffect(() => {
    deliveredRef.current = false;
    inFlightRef.current  = false;
  }, [shipmentId]);

  const deliver = useCallback(async ({ codCollected, podNote, podFile }) => {
    if (inFlightRef.current || deliveredRef.current) return;

    inFlightRef.current = true;
    setSubmitting(true);
    setResult(null);
    setGeofenceError(null);

    let coords;
    try {
      coords = await geoRequestRef.current();
    } catch {
      toastRef.current({ message: "Could not get GPS. Enable location in browser settings.", type: "error" });
      inFlightRef.current = false;
      setSubmitting(false);
      return;
    }

    let body;
    let headers = {};

    if (podFile) {
      body = new FormData();
      body.append("lat",          coords.lat);
      body.append("lng",          coords.lng);
      body.append("codCollected", parseFloat(codCollected) || 0);
      if (podNote) body.append("podNote", podNote);
      body.append("podFile", podFile);
    } else {
      body    = JSON.stringify({ lat: coords.lat, lng: coords.lng, codCollected: parseFloat(codCollected) || 0, podNote });
      headers = { "Content-Type": "application/json" };
    }

    try {
      const token = localStorage.getItem("token");
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/shipments/${shipmentId}/deliver`, {
        method: "POST",
        headers,
        body,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err      = new Error(data.message ?? "Delivery failed.");
        err.code           = data.code;
        err.distanceMeters = data.distanceMeters;
        throw err;
      }

      deliveredRef.current = true;
      setResult("success");
      toastRef.current({ message: "Delivery confirmed!", type: "success" });
      setTimeout(() => navigate("/rider/manifest"), 2000);

    } catch (e) {
      if (e.code === "OUTSIDE_GEOFENCE") {
        setResult("geofence");
        setGeofenceError({ distanceMeters: e.distanceMeters });
      } else {
        setResult("error");
        toastRef.current({ message: e.message ?? "Delivery failed.", type: "error" });
      }
    } finally {
      inFlightRef.current = false;
      setSubmitting(false);
    }
  }, [shipmentId, navigate]);

  return { deliver, submitting, result, geofenceError, geo };
}