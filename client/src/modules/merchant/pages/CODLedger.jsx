// src/modules/merchant/pages/CODLedger.jsx
import {
  Wallet,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { useCODLedger } from "../hooks/useShipment";
import StatCard from "../../../components/common/StatCard";
import ShipmentCard from "../components/shipment/ShipmentCard.jsx";

export default function CODLedger() {
  const { data, loading, refetch } = useCODLedger();

  const shipments = data?.shipments ?? [];
  const totalCOD = data?.totalCOD ?? 0;
  const collected = data?.collected ?? 0;
  const pending = data?.pending ?? 0;
  const remitted = data?.remitted ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-zinc-100">
            COD Ledger
          </h1>
          <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
            Track every COD shipment and its payment status
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Wallet}
          label="Total COD"
          value={"Rs " + totalCOD.toLocaleString()}
          color="rose"
        />
        <StatCard
          icon={CheckCircle}
          label="Collected"
          value={"Rs " + collected.toLocaleString()}
          color="green"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={"Rs " + pending.toLocaleString()}
          color="amber"
        />
        <StatCard
          icon={ArrowDownLeft}
          label="Remitted"
          value={"Rs " + remitted.toLocaleString()}
          color="blue"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="py-10 text-center text-gray-400 dark:text-zinc-500 text-sm">
          Loading...
        </div>
      ) : shipments.length === 0 ? (
        <div className="py-10 text-center text-gray-400 dark:text-zinc-500 text-sm">
          No COD shipments found
        </div>
      ) : (
        shipments.map((s) => <ShipmentCard key={s.id} s={s} />)
      )}
    </div>
  );
}
