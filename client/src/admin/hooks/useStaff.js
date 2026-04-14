// src/admin/hooks/useStaff.js
import { useState, useEffect } from 'react';
import { useAPI, apiPost, apiPatch } from '../../shared/hooks/useApi';

// ─── Fetch staff list ─────────────────────────────────────────────────────────

export function useStaffList() {
  const { data, loading, error, refetch } = useAPI('/api/admin/staff');
  return { staff: data ?? [], loading, error, refetch };
}

// ─── Create staff ─────────────────────────────────────────────────────────────

export function useCreateStaff() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const create = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiPost('/api/admin/staff', payload);
      return res;
    } catch (e) {
      const msg = e.response?.data?.message ?? e.message ?? 'Failed to create staff.';
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { create, loading, error, clearError: () => setError(null) };
}

// ─── Toggle staff active status ───────────────────────────────────────────────

export function useToggleStaff() {
  const [loading, setLoading] = useState(null); // holds userId being toggled

  const toggle = async (userId) => {
    setLoading(userId);
    try {
      const res = await apiPatch(`/api/admin/staff/${userId}/toggle`);
      return res;
    } finally {
      setLoading(null);
    }
  };

  return { toggle, loading };
}

// ─── Local optimistic staff state ─────────────────────────────────────────────
// Wraps useStaffList with optimistic create + toggle so pages don't re-fetch

export function useStaffManager() {
  const { staff, loading, error } = useStaffList();
  const { toggle, loading: toggling } = useToggleStaff();
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (staff.length) setLocal(staff);
  }, [staff]);

  const list = local ?? staff;

  const handleToggle = async (userId) => {
    // optimistic flip
    setLocal(prev => prev.map(m => m.id === userId ? { ...m, isActive: !m.isActive } : m));
    try {
      const updated = await toggle(userId);
      setLocal(prev => prev.map(m => m.id === userId ? (updated.data ?? updated) : m));
    } catch {
      // revert on failure
      setLocal(prev => prev.map(m => m.id === userId ? { ...m, isActive: !m.isActive } : m));
    }
  };

  const handleCreate = (newMember) => {
    setLocal(prev => [newMember, ...(prev ?? [])]);
  };

  const counts = {
    total:       list.length,
    admins:      list.filter(m => m.role === 'ADMIN').length,
    dispatchers: list.filter(m => m.role === 'DISPATCHER').length,
    active:      list.filter(m => m.isActive).length,
  };

  return { list, loading, error, counts, toggling, handleToggle, handleCreate };
}