import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Eye, RefreshCw, Package,
  Calendar, CreditCard,
} from "lucide-react";
import { useShipments } from "../hooks/useShipment.js";
import { usePayment }   from "../hooks/usePayment.js";
import StatusBadge      from "../../../components/common/StatusBadge";

const ALL_TABS = [
  { value: "",                 label: "All Shipments"    },
  { value: "UNPAID",           label: "Unpaid"           },
  { value: "PENDING",          label: "Pending"          },
  { value: "ASSIGNED",         label: "Assigned"         },
  { value: "IN_HUB",           label: "At Hub"           },
  { value: "OUT_FOR_DELIVERY", label: "Out for Delivery" },
  { value: "DELIVERED",        label: "Delivered"        },
  { value: "CANCELLED",        label: "Cancelled"        },
];

export default function MerchantShipments() {
  const navigate = useNavigate();
  const [activeStatus, setActiveStatus] = useState("");
  const [search,       setSearch]       = useState("");
  const [page,         setPage]         = useState(1);
  const [payingId,     setPayingId]     = useState(null); // shipment id currently being paid

  const { data, loading, refetch }          = useShipments(activeStatus, page);
  const { initiatePayment, loading: paying } = usePayment();

  const shipments  = data?.shipments ?? [];
  const totalCount = data?.total     ?? 0;

  const filtered = shipments.filter(
    (s) =>
      !search ||
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.receiverName.toLowerCase().includes(search.toLowerCase()),
  );

  const handlePayNow = async (shipment) => {
    setPayingId(shipment.id);
    try {
      await initiatePayment(shipment.id); // redirects to Khalti
    } catch {
      setPayingId(null); // only reached if initiation itself fails
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shipments</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Manage your outbound deliveries and track real-time status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refetch}
            className="p-2.5 text-gray-500 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => navigate("/merchant/shipments/new")}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition-all"
          >
            <Plus size={18} />
            New Shipment
          </button>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-900/50 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {ALL_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => { setActiveStatus(t.value); setPage(1); }}
              className={`px-4 py-2 text-xs font-semibold whitespace-nowrap rounded-lg transition-all ${
                activeStatus === t.value
                  ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking or name..."
            className="w-full lg:w-72 pl-10 pr-4 py-2 text-sm bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Shipment</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Receiver</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Fare / COD</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    <p className="text-sm text-gray-400 mt-2">Loading shipments…</p>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No shipments found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  const isUnpaid      = s.status === "UNPAID";
                  const isThisPaying  = paying && payingId === s.id;

                  return (
                    <tr
                      key={s.trackingNumber}
                      className={`transition-colors group ${
                        isUnpaid
                          ? "bg-amber-50/40 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      {/* Shipment */}
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-rose-500">
                          #{s.trackingNumber}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Calendar size={10} />
                          {new Date(s.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      {/* Receiver */}
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900 dark:text-zinc-200 block">
                          {s.receiverName}
                        </span>
                        <span className="text-xs text-gray-500">{s.receiverPhone}</span>
                      </td>

                      {/* Location */}
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 dark:text-zinc-400 max-w-180px truncate">
                          {s.deliveryAddress}
                        </p>
                      </td>

                      {/* Fare / COD */}
                      <td className="px-6 py-4">
                        {isUnpaid ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">Shipping fare</span>
                            <span className="text-sm font-semibold text-gray-900 dark:text-zinc-200">
                              रु {Number(s.totalFare).toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 dark:text-zinc-200">
                            {s.codAmount > 0 ? `Rs. ${s.codAmount.toLocaleString()}` : "—"}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <StatusBadge status={s.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isUnpaid && (
                            <button
                              onClick={() => handlePayNow(s)}
                              disabled={paying}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white rounded-lg transition-all shadow-sm shadow-rose-500/20"
                            >
                              {isThisPaying ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <CreditCard size={12} />
                              )}
                              {isThisPaying ? "Redirecting…" : "Pay Now"}
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/merchant/shipments/${s.id}`)}
                            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-800/30 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700 dark:text-zinc-300">{filtered.length}</span> of {totalCount} shipments
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-1.5 text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={shipments.length < 20}
              className="px-4 py-1.5 text-xs font-medium border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-600 dark:text-zinc-400 hover:bg-white dark:hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}