// src/modules/merchant/pages/MerchantPayment.jsx

import { useWallet } from "../hooks/useWallet";
import WalletCard from "../components/payements/WalletCard";
import SubscriptionGrid from "../components/subscriptions/subscriptionGrid";
export default function MerchantPayment() {
  const {
    balance,
    lastTransaction,
    loading,
    error,
    topupLoading,
    initiateTopup,
    refetch,
  } = useWallet();

  const handleTopup = async (amount) => {
    const { payment_url } = await initiateTopup(amount);
    if (payment_url) window.location.href = payment_url;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
          Billing & Subscription
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your plan, shipment quota, and wallet balance.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <WalletCard
            balance={balance}
            lastTransaction={lastTransaction}
            loading={loading}
            error={error}
            topupLoading={topupLoading}
            onTopup={handleTopup}
            onRefetch={refetch}
          />
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Next Billing
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Your subscription renews automatically each month.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Overage Charges
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Shipments beyond your quota are deducted from your wallet balance.
            </p>
          </div>
        </div>
      </div>

      <hr className="border-slate-200 dark:border-slate-700" />

      <SubscriptionGrid />
    </div>
  );
}