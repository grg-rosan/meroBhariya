// src/rider/pages/DeliverPackage.jsx
// Rider clicks "Mark as Delivered" — app:
//  1. Gets browser GPS
//  2. Sends to backend (POST /api/shipments/:id/deliver)
//  3. Backend runs ST_DWithin check — rejects if >100m
//  4. Shows result + distance error if rejected

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Loader2,
  Navigation2,
  AlertTriangle,
} from "lucide-react";
import { API, authHeaders } from "../../shared/hooks/useAPI";

const GEOFENCE_RADIUS = 100; // must match backend

function useGeolocation() {
  const [loc, setLoc] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setL] = useState(false);

  const request = () =>
    new Promise((resolve, reject) => {
      setL(true);
      setErr(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLoc(coords);
          setL(false);
          resolve(coords);
        },
        (e) => {
          setErr(e.message);
          setL(false);
          reject(e);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });

  return { loc, error: err, loading, request };
}

export default function DeliverPackage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const geo = useGeolocation();
  const [codCollected, setCod] = useState("");
  const [podFile, setPod] = useState(null);
  const [podNote, setNote] = useState("");
  const [result, setResult] = useState(null); // null | 'success' | 'geofence' | 'error'
  const [apiError, setApiErr] = useState(null);
  const [submitting, setSub] = useState(false);

  const handleDeliver = async () => {
    setSub(true);
    setResult(null);
    setApiErr(null);

    let coords;
    try {
      coords = await geo.request();
    } catch {
      setApiErr(
        "Could not get GPS location. Enable location in your browser settings.",
      );
      setSub(false);
      return;
    }

    try {
      const res = await fetch(`${API}/api/shipments/${id}/deliver`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          lat: coords.lat,
          lng: coords.lng,
          codCollected: parseFloat(codCollected) || 0,
          podNote,
        }),
      });

      const data = await res.json();

      if (res.status === 403 && data.error === "OUTSIDE_GEOFENCE") {
        setResult("geofence");
        setApiErr(data);
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "Delivery failed");

      setResult("success");
      setTimeout(() => navigate("/rider/manifest"), 2000);
    } catch (e) {
      setResult("error");
      setApiErr(typeof e === "string" ? e : e.message);
    } finally {
      setSub(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">Confirm delivery</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Your GPS will be verified before delivery is logged
        </p>
      </div>

      {/* GPS status */}
      <div
        className={`flex items-center gap-3 p-4 rounded-xl border mb-5 transition-all ${
          geo.loc
            ? "border-green-700/50 bg-green-500/5"
            : "border-zinc-700 bg-zinc-900"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${geo.loc ? "bg-green-500/10" : "bg-zinc-800"}`}
        >
          <Navigation2
            size={15}
            className={geo.loc ? "text-green-400" : "text-zinc-500"}
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">
            {geo.loading
              ? "Getting GPS…"
              : geo.loc
                ? "Location acquired"
                : "Location required"}
          </p>
          <p className="text-xs text-zinc-500">
            {geo.loc
              ? `${geo.loc.lat.toFixed(5)}, ${geo.loc.lng.toFixed(5)}`
              : `Must be within ${GEOFENCE_RADIUS}m of delivery address`}
          </p>
        </div>
        {geo.loading && (
          <Loader2 size={14} className="text-zinc-500 animate-spin" />
        )}
      </div>

      {/* Delivery form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 mb-4">
        <div>
          <label className="text-xs text-zinc-400 font-medium block mb-1.5">
            COD collected (रु)
          </label>
          <input
            type="number"
            min="0"
            value={codCollected}
            onChange={(e) => setCod(e.target.value)}
            placeholder="0"
            className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-400 font-medium block mb-1.5">
            Proof of delivery photo
          </label>
          <label className="flex items-center gap-3 px-4 py-3 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-xl cursor-pointer transition-all">
            <Camera size={16} className="text-zinc-500" />
            <span className="text-sm text-zinc-500">
              {podFile ? podFile.name : "Take photo or upload"}
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setPod(e.target.files[0])}
            />
          </label>
        </div>

        <div>
          <label className="text-xs text-zinc-400 font-medium block mb-1.5">
            Delivery note (optional)
          </label>
          <input
            value={podNote}
            onChange={(e) => setNote(e.target.value)}
            placeholder='e.g. "Left with security guard"'
            className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Result banners */}
      {result === "success" && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-700/50 rounded-xl mb-4">
          <CheckCircle size={16} className="text-green-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-300">
              Delivery confirmed!
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              GPS verified. Redirecting to manifest…
            </p>
          </div>
        </div>
      )}

      {result === "geofence" && apiError && (
        <div className="p-4 bg-red-500/10 border border-red-700/50 rounded-xl mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={15} className="text-red-400 shrink-0" />
            <p className="text-sm font-medium text-red-300">
              Too far from delivery address
            </p>
          </div>
          <p className="text-xs text-zinc-400 mb-1">
            You are{" "}
            <span className="text-red-400 font-semibold">
              {apiError.distanceMeters}m
            </span>{" "}
            away. Must be within {GEOFENCE_RADIUS}m.
          </p>
          <p className="text-xs text-zinc-500">
            Navigate to the correct address and try again.
          </p>
        </div>
      )}

      {result === "error" && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-700/50 rounded-xl mb-4">
          <XCircle size={15} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-300">
            {apiError ?? "Delivery failed. Try again."}
          </p>
        </div>
      )}

      <button
        onClick={handleDeliver}
        disabled={submitting || result === "success"}
        className="w-full py-3 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Verifying location…
          </>
        ) : (
          <>
            <CheckCircle size={14} />
            Mark as delivered
          </>
        )}
      </button>

      <p className="text-xs text-zinc-600 text-center mt-3">
        Your GPS coordinates are verified server-side using PostGIS
      </p>
    </div>
  );
}
