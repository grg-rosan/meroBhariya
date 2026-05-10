// src/modules/merchant/hooks/useMerchantProfile.js
import { useState, useEffect } from "react";
import { apiGet } from "../../../shared/hooks/useApi.js";

// Matches pickupAddress string against districts list
// e.g. "New Road, Kathmandu" → finds district with name "Kathmandu"
function resolveFromDistrict(pickupAddress, districts) {
  if (!pickupAddress || !districts?.length) return null;
  const lower = pickupAddress.toLowerCase();
  // Try longest name first to avoid partial matches (e.g. "Parsa" before "Parsa district")
  const sorted = [...districts].sort((a, b) => b.name.length - a.name.length);
  const match = sorted.find((d) => lower.includes(d.name.toLowerCase()));
  return match?.id ?? null;
}

export function useMerchantProfile(districts = []) {
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    apiGet("/api/merchant/me")
      .then((res) => setProfile(res.data))
      .catch((e)  => setError(e.message))
      .finally(()  => setLoading(false));
  }, []);

  const fromDistrictId = resolveFromDistrict(profile?.pickupAddress, districts);

  return {
    profile,
    loading,
    error,
    fromDistrictId,
    pickupAddress: profile?.pickupAddress ?? null,
  };
}