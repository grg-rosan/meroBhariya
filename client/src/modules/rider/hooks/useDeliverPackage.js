// src/rider/hooks/useDeliverPackage.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../../../shared/hooks/useApi";
import { useToast } from "../../../shared/context/ToastContext";

function useGeolocation() {
  const [loc, setLoc]         = useState(null);
  const [error, setError]     = useState(null);
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

export function useDeliverPackage(shipmentId) {
  const navigate  = useNavigate();
  const toast     = useToast();
  const geo       = useGeolocation();

  const [submitting, setSubmitting]       = useState(false);
  const [result, setResult]               = useState(null); // null | 'success' | 'geofence' | 'error'
  const [geofenceError, setGeofenceError] = useState(null); // { distanceMeters }

  const deliver = async ({ codCollected, podNote }) => {
    setSubmitting(true);
    setResult(null);
    setGeofenceError(null);

    // 1. Get GPS
    let coords;
    try {
      coords = await geo.request();
    } catch {
      toast({ message: "Could not get GPS. Enable location in browser settings.", type: "error" });
      setSubmitting(false);
      return;
    }

    // 2. Submit delivery
    try {
      await apiPost(`/api/shipments/${shipmentId}/deliver`, {
        lat: coords.lat,
        lng: coords.lng,
        codCollected: parseFloat(codCollected) || 0,
        podNote,
      });
      setResult("success");
      toast({ message: "Delivery confirmed!", type: "success" });
      setTimeout(() => navigate("/rider/manifest"), 2000);
    } catch (e) {
      // geofence errors come back as a structured object
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