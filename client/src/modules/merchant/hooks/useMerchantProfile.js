// src/modules/merchant/hooks/useMerchantProfile.js
import { useState, useEffect } from "react";
import { apiGet, apiPostForm } from "../../../shared/hooks/useApi.js";

// Matches pickupAddress string against districts list.
// e.g. "New Road, Kathmandu" → finds district with name "Kathmandu".
// Sorted by name length descending to avoid partial matches.
function resolveFromDistrict(pickupAddress, districts) {
  if (!pickupAddress || !districts?.length) return null;
  const lower  = pickupAddress.toLowerCase();
  const sorted = [...districts].sort((a, b) => b.name.length - a.name.length);
  const match  = sorted.find((d) => lower.includes(d.name.toLowerCase()));
  return match?.id ?? null;
}

export function useMerchantProfile(districts = []) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // ── doc state ──────────────────────────────────────────
  const [docs,        setDocs]        = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError,   setDocsError]   = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // ── fetch profile ──────────────────────────────────────
  useEffect(() => {
    apiGet("/api/merchant/me")
      .then((res) => setProfile(res.data))
      .catch((e)  => setError(e.message))
      .finally(()  => setLoading(false));
  }, []);

  // ── fetch documents ────────────────────────────────────
  const fetchDocs = () => {
    setDocsLoading(true);
    setDocsError(null);
    apiGet("/api/merchant/documents")
      .then((res) => setDocs(res.data ?? []))
      .catch((e)  => setDocsError(e.message))
      .finally(()  => setDocsLoading(false));
  };

  useEffect(() => { fetchDocs(); }, []);

  // ── upload documents ───────────────────────────────────
  /**
   * @param {Record<string, File>} files  key = MerchantDocType enum value
   * @returns {Promise<object>}
   */
  const uploadDocs = async (files) => {
    const fd = new FormData();
    Object.entries(files).forEach(([type, file]) => {
      if (file) fd.append(type, file);
    });
    setUploading(true);
    setUploadError(null);
    try {
      const result = await apiPostForm("/api/merchant/documents", fd);
      await fetchDocs(); // refresh doc list after upload
      return result;
    } catch (e) {
      setUploadError(e.message);
      throw e;           // let the caller handle navigation / step change
    } finally {
      setUploading(false);
    }
  };

  const fromDistrictId = resolveFromDistrict(profile?.pickupAddress, districts);

  return {
    // profile
    profile,
    loading,
    error,
    fromDistrictId,
    pickupAddress: profile?.pickupAddress ?? null,

    // documents
    docs,
    docsLoading,
    docsError,
    refetchDocs: fetchDocs,

    // upload
    uploadDocs,
    uploading,
    uploadError,
  };
}