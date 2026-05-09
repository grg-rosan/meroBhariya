// src/modules/merchant/hooks/useWallet.js

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost } from "../../../shared/hooks/useApi";

export function useWallet() {
  const [balance, setBalance]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [txLoading, setTxLoading]       = useState(true);
  const [error, setError]               = useState(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError]     = useState(null);

  // ── GET /api/merchant/payments/balance ──────────────────────────────────────
  const fetchBalance = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet("/api/merchant/payments/balance");
      setBalance(Number(data.balance));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GET /api/merchant/payments/transactions ──────────────────────────────────
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const data = await apiGet("/api/merchant/payments/transactions");
      setTransactions(data.transactions ?? []);
    } catch {
      // non-fatal — table just stays empty
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, [fetchBalance, fetchTransactions]);

  // ── POST /api/merchant/payments/topup/initiate ───────────────────────────────
  // Returns { payment_url, pidx } — caller redirects to payment_url
  const initiateTopup = useCallback(async (amount) => {
    setTopupLoading(true);
    setTopupError(null);
    try {
      const data = await apiPost("/api/merchant/payments/topup/initiate", { amount });
      return data; // { payment_url, pidx }
    } catch (e) {
      setTopupError(e.message);
      throw e;
    } finally {
      setTopupLoading(false);
    }
  }, []);

  // Last transaction for WalletCard preview
  const lastTransaction = transactions.length > 0 ? transactions[0] : null;

  return {
    balance,
    transactions,
    lastTransaction,
    loading,
    txLoading,
    error,
    topupLoading,
    topupError,
    refetch:       fetchBalance,
    refetchAll:    () => { fetchBalance(); fetchTransactions(); },
    initiateTopup,
  };
}