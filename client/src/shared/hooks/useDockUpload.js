// src/shared/hooks/useDocUpload.js
import { useState, useEffect } from "react";
import { apiGet, apiPostForm } from "./useApi.js";
import { ALLOWED_TYPES } from "../constants/doc.constants.js";

// ── Pure helpers (no React) ───────────────────────────────────

/**
 * Validates file types before upload.
 * @param {Record<string, File>} files
 * @returns {string | null} error message, or null if valid
 */
export function validateDocFiles(files) {
  for (const [, file] of Object.entries(files)) {
    if (file && !ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: only JPG, PNG, WebP or PDF allowed.`;
    }
  }
  return null;
}

/**
 * Derives display-relevant booleans from the raw docs array.
 * @param {Array<{ status: string, type: string }>} docs
 */
export function useDocStatus(docs = []) {
  const hasDocs       = docs.length > 0;
  const allApproved   = hasDocs && docs.every((d) => d.status === "APPROVED");
  const hasRejected   = hasDocs && docs.some((d)  => d.status === "REJECTED");
  const rejectedTypes = docs.filter((d) => d.status === "REJECTED").map((d) => d.type);
  return { hasDocs, allApproved, hasRejected, rejectedTypes };
}

// ── Main hook ─────────────────────────────────────────────────

/**
 * Generic document upload hook for any role.
 *
 * @param {{ apiBase: string }} options
 *   apiBase — role-specific API prefix, e.g. "/api/merchant" or "/api/rider"
 *
 * @example
 *   const { docs, uploadDocs, uploading } = useDocUpload({ apiBase: "/api/rider" });
 */
export function useDocUpload({ apiBase }) {
  const [docs,        setDocs]        = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError,   setDocsError]   = useState(null);
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const fetchDocs = () => {
    setDocsLoading(true);
    setDocsError(null);
    apiGet(`${apiBase}/documents`)
      .then((res) => setDocs(res.data ?? []))
      .catch((e)  => setDocsError(e.message))
      .finally(()  => setDocsLoading(false));
  };

  useEffect(() => { fetchDocs(); }, [apiBase]);

  /**
   * @param {Record<string, File>} files  key = DocType enum value
   */
  const uploadDocs = async (files) => {
    const fd = new FormData();
    Object.entries(files).forEach(([type, file]) => {
      if (file) fd.append(type, file);
    });
    setUploading(true);
    setUploadError(null);
    try {
      const result = await apiPostForm(`${apiBase}/documents`, fd);
      await fetchDocs();
      return result;
    } catch (e) {
      setUploadError(e.message);
      throw e;
    } finally {
      setUploading(false);
    }
  };

  return {
    docs,
    docsLoading,
    docsError,
    refetchDocs: fetchDocs,
    uploadDocs,
    uploading,
    uploadError,
  };
}