import { useState } from "react";
import {
  usePendingRiders,
  usePendingMerchants,
  useReviewRiderDoc,
  useReviewMerchantDoc,
} from "../hooks/useAdmin";
import { useToast } from "../../../context/ToastContext";
import UserCard from "../components/verify/UserCard";

export default function VerifyUsers() {
  const { data: riderData, loading: riderLoading, refetch: refetchRiders } = usePendingRiders();
  const { data: merchantData, loading: merchantLoading, refetch: refetchMerchants } = usePendingMerchants();
  const { review: reviewRider } = useReviewRiderDoc();
  const { review: reviewMerchant } = useReviewMerchantDoc();
  const toast = useToast();
  const [tab, setTab] = useState("merchants");

  const merchants = merchantData?.merchants ?? [];
  const riders = riderData?.riders ?? [];
  const list = tab === "merchants" ? merchants : riders;
  const loading = tab === "merchants" ? merchantLoading : riderLoading;

  const TABS = [
    { key: "merchants", label: `Merchants (${merchants.length})` },
    { key: "riders",    label: `Riders (${riders.length})` },
  ];

  const handleReviewDoc = async (docId, status, note, type) => {
    try {
      if (type === "RIDER")    await reviewRider(docId, { status, note });
      if (type === "MERCHANT") await reviewMerchant(docId, { status, note });
      toast({
        message: status === "APPROVED" ? "Document approved." : "Document rejected.",
        type: status === "APPROVED" ? "success" : "info",
      });
      refetchRiders();
      refetchMerchants();
    } catch{}
  };

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">User verification</h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-0.5">
          Review KYC documents and approve accounts
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 mb-5 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${
              tab === t.key
                ? "bg-violet-500 text-white"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <p className="text-zinc-400 dark:text-zinc-500 text-sm">Loading...</p>
      ) : list.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-10 text-center text-zinc-300 dark:text-zinc-600 text-sm">
          No pending {tab} — all caught up!
        </div>
      ) : (
        list.map((u) => (
          <UserCard
            key={u.id}
            user={u}
            type={tab === "merchants" ? "MERCHANT" : "RIDER"}
            onReviewDoc={handleReviewDoc}
            loading={loading}
          />
        ))
      )}
    </div>
  );
}