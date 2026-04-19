import { useState } from "react";
import { Search, Plus, Eye, RefreshCw, X, Loader2, Package, AlertCircle } from "lucide-react";
import { useShipments, useCreateShipment } from "../hooks/useMerchant";
import StatusBadge from "../../shared/components/StatusBadge";

const ALL_TABS = [
  { value: "",                 label: "All" },
  { value: "PENDING",          label: "Pending" },
  { value: "ASSIGNED",         label: "Assigned" },
  { value: "IN_HUB",           label: "At hub" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
  { value: "DELIVERED",        label: "Delivered" },
  { value: "CANCELLED",        label: "Cancelled" },
];

const VEHICLE_TYPES = [
  { id: 1, label: "Bike — up to 20 kg",         icon: "??" },
  { id: 2, label: "Mini Truck — up to 500 kg",   icon: "??" },
  { id: 3, label: "Covered Van — up to 1500 kg", icon: "??" },
];

const INITIAL_FORM = {
  receiverName: "", receiverPhone: "", deliveryAddress: "",
  weight: "", orderValue: "", codAmount: "",
  isFragile: false, vehicleTypeId: 1, paymentType: "PREPAID",
};

function CreateShipmentModal({ onClose, onSuccess }) {
  const [form, setForm]     = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const { createShipment, loading, error } = useCreateShipment();

  const set = (key, val) => setForm(f => {
    const updated = { ...f, [key]: val };
    if (key === "weight") {
      const w = parseFloat(val);
      if (w <= 20)        updated.vehicleTypeId = 1; // Bike
      else if (w <= 500)  updated.vehicleTypeId = 2; // Mini Truck
      else                updated.vehicleTypeId = 3; // Covered Van
    }
    return updated;
  });

  const validate = () => {
    const e = {};
    if (!form.receiverName.trim())    e.receiverName    = "Required";
    if (!form.receiverPhone.trim())   e.receiverPhone   = "Required";
    if (!form.deliveryAddress.trim()) e.deliveryAddress = "Required";
    if (!form.weight || form.weight <= 0)         e.weight     = "Enter package weight";
    if (!form.orderValue || form.orderValue <= 0) e.orderValue = "Enter order value";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      await createShipment({
        receiverName:    form.receiverName,
        receiverPhone:   form.receiverPhone,
        deliveryAddress: form.deliveryAddress,
        weight:          parseFloat(form.weight),
        orderValue:      parseFloat(form.orderValue),
        codAmount:       parseFloat(form.codAmount || 0),
        isFragile:       form.isFragile,
        vehicleTypeId:   form.vehicleTypeId,
        paymentType:     form.paymentType,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
          <h2 className="text-base font-semibold text-white">New shipment</h2>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-lg transition-all">
            <X size={16} />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Receiver details</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Full name <span className="text-rose-400">*</span></label>
                <input value={form.receiverName} onChange={e => set("receiverName", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${errors.receiverName ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"}`}
                  placeholder="Aarav Shah" />
                {errors.receiverName && <p className="text-xs text-red-400 mt-1">{errors.receiverName}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Phone <span className="text-rose-400">*</span></label>
                <input value={form.receiverPhone} onChange={e => set("receiverPhone", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${errors.receiverPhone ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"}`}
                  placeholder="98XXXXXXXX" />
                {errors.receiverPhone && <p className="text-xs text-red-400 mt-1">{errors.receiverPhone}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Delivery address <span className="text-rose-400">*</span></label>
                <input value={form.deliveryAddress} onChange={e => set("deliveryAddress", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none transition-colors ${errors.deliveryAddress ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"}`}
                  placeholder="Thamel, Kathmandu" />
                {errors.deliveryAddress && <p className="text-xs text-red-400 mt-1">{errors.deliveryAddress}</p>}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Package details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Weight (kg) <span className="text-rose-400">*</span></label>
                <input type="number" min="0.1" step="0.1" value={form.weight} onChange={e => set("weight", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 focus:outline-none transition-colors ${errors.weight ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"}`}
                  placeholder="1.5" />
                {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Order value (??) <span className="text-rose-400">*</span></label>
                <input type="number" min="0" value={form.orderValue} onChange={e => set("orderValue", e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-zinc-800 border rounded-lg text-zinc-200 focus:outline-none transition-colors ${errors.orderValue ? "border-red-500" : "border-zinc-700 focus:border-zinc-500"}`}
                  placeholder="2400" />
                {errors.orderValue && <p className="text-xs text-red-400 mt-1">{errors.orderValue}</p>}
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">COD amount (??)</label>
                <input type="number" min="0" value={form.codAmount} onChange={e => set("codAmount", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none transition-colors"
                  placeholder="0" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1.5">Payment type</label>
                <select value={form.paymentType} onChange={e => set("paymentType", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-zinc-800 border border-zinc-700 focus:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none transition-colors">
                  <option value="PREPAID">Prepaid</option>
                  <option value="COD">COD</option>
                </select>
              </div>
              <div className="col-span-2 flex items-center gap-2 pt-1">
                <input type="checkbox" id="fragile" checked={form.isFragile} onChange={e => set("isFragile", e.target.checked)} className="accent-rose-500 w-4 h-4" />
                <label htmlFor="fragile" className="text-sm text-zinc-400 cursor-pointer">Fragile package</label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Vehicle type</h3>
            <div className="space-y-2">
              {VEHICLE_TYPES.map(v => (
                <button key={v.id} onClick={() => set("vehicleTypeId", v.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${form.vehicleTypeId === v.id ? "border-rose-500 bg-rose-500/5" : "border-zinc-800 hover:bg-zinc-800"}`}>
                  <span className="text-lg">{v.icon}</span>
                  <span className="text-sm text-zinc-300">{v.label}</span>
                  {form.vehicleTypeId === v.id && <span className="ml-auto text-xs text-rose-400 font-medium">Selected</span>}
                </button>
              ))}
            </div>
          </div>

          {(errors.submit || error) && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-700/50 rounded-lg">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-sm text-red-300">{errors.submit || error}</span>
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" />Creating…</> : <><Package size={14} />Create shipment</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MerchantShipments() {
  const [activeStatus, setActiveStatus] = useState("");
  const [search, setSearch]             = useState("");
  const [page, setPage]                 = useState(1);
  const [showModal, setShowModal]       = useState(false);

  // Fetch ALL shipments to compute tab counts
  const { data: allData }                  = useShipments("", 1);
  const { data, loading, refetch }         = useShipments(activeStatus, page);

  const allShipments = allData?.shipments ?? [];
  const shipments    = data?.shipments    ?? [];

  // Compute count per status from all shipments
  const countByStatus = allShipments.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {});

  // Only show tabs that have shipments (except "All" which always shows)
  const visibleTabs = ALL_TABS.filter(t =>
    t.value === "" || countByStatus[t.value] > 0
  );

  const filtered = shipments.filter(s =>
    !search ||
    s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {showModal && (
        <CreateShipmentModal
          onClose={() => setShowModal(false)}
          onSuccess={() => refetch()}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Shipments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.total ?? 0} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium transition-all">
            <Plus size={14} /> New shipment
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex-wrap">
          {visibleTabs.map(t => (
            <button key={t.value} onClick={() => { setActiveStatus(t.value); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1.5 ${activeStatus === t.value ? "bg-rose-500 text-white" : "text-zinc-400 hover:text-zinc-200"}`}>
              {t.label}
              {t.value !== "" && countByStatus[t.value] > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeStatus === t.value ? "bg-white/20 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                  {countByStatus[t.value]}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
            className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-52" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {["Tracking #","Receiver","Phone","Address","Weight","COD","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-600 text-sm">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-600 text-sm">No shipments found</td></tr>
              ) : filtered.map(s => (
                <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.receiverPhone}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 max-w-[140px] truncate">{s.deliveryAddress}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{s.weight} kg</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{s.codAmount > 0 ? `?? ${s.codAmount.toLocaleString()}` : <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-600">Showing {filtered.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">Prev</button>
            <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < 20}
              className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}





