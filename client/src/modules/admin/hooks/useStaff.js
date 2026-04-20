// src/admin/hooks/useStaff.js
import { useState} from "react";
import { useAPI, apiPost, apiPatch } from "../../../shared/hooks/useApi";
import { useToast } from "../../../shared/context/ToastContext";

// ─── Fetch staff list ─────────────────────────────────────────────────────────

export function useStaffList() {
  const { data, loading, error, refetch } = useAPI("/api/admin/staff");
  return { staff: data ?? [], loading, error, refetch };
}

// ─── Create staff ─────────────────────────────────────────────────────────────

export function useCreateStaff() {
  const [loading, setLoading] = useState(false);
const toast = useToast();
  const create = async (payload) => {
    setLoading(true);
    try {
      const res = await apiPost("/api/admin/staff", payload);
      return res;
    } catch (e) {
 toast({ message: e.message, type: "error" });  
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, };
}

// ─── Toggle staff active status ───────────────────────────────────────────────

export function useToggleStaff() {
  const [loading, setLoading] = useState(null); // holds userId being toggled
  const toast = useToast();
  const toggle = async (userId) => {
    setLoading(userId);
    try {
      const res = await apiPatch(`/api/admin/staff/${userId}/toggle`);
      return res;
    } 
    catch(e){
      toast({ message: e.message, type: "error" });
      throw e;
    }finally {
      setLoading(null);
    }
  };

  return { toggle, loading };
}

// ─── Local optimistic staff state ─────────────────────────────────────────────
// Wraps useStaffList with optimistic create + toggle so pages don't re-fetch

export function useStaffManager() {
  const { staff, loading, refetch } = useStaffList();
  const {create}  = useCreateStaff();
  const { toggle, loading: toggling } = useToggleStaff();
  const [local, setLocal] = useState(null);


  const list = local ?? staff;

  const handleToggle = async (userId) => {
    // optimistic flip
    setLocal((prev) =>
      prev.map((m) => (m.id === userId ? { ...m, isActive: !m.isActive } : m)),
    );
    try {
      const updated = await toggle(userId);
      setLocal((prev) =>
        prev.map((m) => (m.id === userId ? (updated.data ?? updated) : m)),
      );
    } catch {
      // revert on failure
      setLocal((prev) =>
        prev.map((m) =>
          m.id === userId ? { ...m, isActive: !m.isActive } : m,
        ),
      );
    }
  };

  const handleCreate = async (payload) => {
    const newMember = await create(payload);
    setLocal((prev) => [newMember, ...(prev ?? [])]);
    return newMember;
  };
  const counts = {
    total: list.length,
    admins: list.filter((m) => m.role === "ADMIN").length,
    dispatchers: list.filter((m) => m.role === "DISPATCHER").length,
    active: list.filter((m) => m.isActive).length,
  };

  return { list, loading, counts, toggling, handleToggle, handleCreate, refetch };
}
