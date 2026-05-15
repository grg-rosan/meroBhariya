// src/modules/merchant/components/shipment/components/TransactionDetail.jsx

/**
 * @param {{ transaction: { totalFare?, collectedByRider?, remittedAt? } }} props
 */
export default function TransactionDetail({ transaction }) {
  if (!transaction) return null;

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3 mb-3">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
        Transaction
      </p>
      <div className="grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-zinc-400 dark:text-zinc-500">Total fare</p>
          <p className="text-zinc-800 dark:text-zinc-200 font-medium">
            Rs {transaction.totalFare?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-zinc-400 dark:text-zinc-500">COD collected</p>
          <p className="text-zinc-800 dark:text-zinc-200 font-medium">
            Rs {transaction.collectedByRider?.toLocaleString() ?? "—"}
          </p>
        </div>
        <div>
          <p className="text-zinc-400 dark:text-zinc-500">Remitted at</p>
          <p className="text-zinc-800 dark:text-zinc-200 font-medium">
            {transaction.remittedAt
              ? new Date(transaction.remittedAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}