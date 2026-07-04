// src/modules/merchant/hooks/useMerchantProfile.js
import { useState, useEffect } from "react";
import { apiGet, apiPatch, apiPostForm } from "../../../shared/hooks/useApi.js";
import { useToast } from "../../../context/ToastContext";

export function useMerchantProfile(districts = []) {
  const toast = useToast();
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
      .catch((e) => {
        setError(e.message);
        toast({ message: e.message, type: "error" });
      })
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
      await fetchDocs();
      toast({ message: "Documents uploaded successfully.", type: "success" });
      return result;
    } catch (e) {
      setUploadError(e.message);
      toast({ message: e.message, type: "error" });
      throw e;
    } finally {
      setUploading(false);
    }
  };

  // ── update profile ────────────────────────────────────
  const updateProfile = async (data) => {
    try {
      const result = await apiPatch("/api/merchant/me", data);
      setProfile((prev) => ({ ...prev, ...result.data }));
      toast({ message: "Profile updated successfully.", type: "success" });
      return result.data;
    } catch (e) {
      toast({ message: e.message, type: "error" });
      throw e;
    }
  };

  const fromDistrictId = profile?.pickupDistrictId ?? null;

  return {
    // profile
    profile,
    loading,
    error,
    fromDistrictId,
    pickupAddress: profile?.pickupAddress ?? null,
    isVerified: profile?.isVerified ?? false,
    updateProfile,

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