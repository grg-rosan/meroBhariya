import { useState } from 'react';
import { Search, Plus, Eye, RefreshCw } from 'lucide-react';
import { useShipments } from '../hooks/useMerchant';
import StatusBadge from '../../shared/components/StatusBadge';

const STATUSES = ['', 'PENDING', 'ASSIGNED', 'IN_HUB', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS = {
  '': 'All', PENDING: 'Pending', ASSIGNED: 'Assigned', IN_HUB: 'At hub',
  OUT_FOR_DELIVERY: 'Out for delivery', DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

const MOCK = [
  { trackingNumber: 'PTR-2841', receiverName: 'Aarav Shah',   receiverPhone: '9841000001', deliveryAddress: 'Thamel, KTM',    weight: 1.2, codAmount: 2400,  status: 'DELIVERED' },
  { trackingNumber: 'PTR-2840', receiverName: 'Priya Thapa',  receiverPhone: '9841000002', deliveryAddress: 'Lalitpur-3',     weight: 0.8, codAmount: 1800,  status: 'OUT_FOR_DELIVERY' },
  { trackingNumber: 'PTR-2839', receiverName: 'Raj Gurung',   receiverPhone: '9841000003', deliveryAddress: 'Bhaktapur',      weight: 2.1, codAmount: 0,     status: 'PENDING' },
  { trackingNumber: 'PTR-2838', receiverName: 'Sita Rai',     receiverPhone: '9841000004', deliveryAddress: 'Patan-7',        weight: 0.5, codAmount: 900,   status: 'IN_HUB' },
  { trackingNumber: 'PTR-2837', receiverName: 'Manish KC',    receiverPhone: '9841000005', deliveryAddress: 'Koteshwor',      weight: 3.4, codAmount: 5200,  status: 'CANCELLED' },
  { trackingNumber: 'PTR-2836', receiverName: 'Deepa Magar',  receiverPhone: '9841000006', deliveryAddress: 'Baneshwor',      weight: 1.0, codAmount: 1200,  status: 'ASSIGNED' },
  { trackingNumber: 'PTR-2835', receiverName: 'Suresh Lama',  receiverPhone: '9841000007', deliveryAddress: 'Kalanki',        weight: 4.2, codAmount: 0,     status: 'DELIVERED' },
];

export default function MerchantShipments() {
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  const { data, loading, refetch } = useShipments(activeStatus, page);
  const shipments = data?.shipments ?? MOCK;
  const total     = data?.total ?? MOCK.length;

  const filtered = shipments.filter((s) =>
    !search || s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Shipments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{total} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <a
            href="/merchant/shipments/new"
            className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg transition-all font-medium"
          >
            <Plus size={14} /> New shipment
          </a>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Status tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setActiveStatus(s); setPage(1); }}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${
                activeStatus === s
                  ? 'bg-rose-500 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or name…"
            className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Tracking #', 'Receiver', 'Phone', 'Address', 'Weight', 'COD', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-zinc-600 text-sm">
                    No shipments found
                  </td>
                </tr>
              ) : filtered.map((s) => (
                <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                  <td className="px-4 py-3 text-zinc-200 font-medium">{s.receiverName}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.receiverPhone}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500 max-w-[140px] truncate">{s.deliveryAddress}</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">{s.weight} kg</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {s.codAmount > 0 ? `रु ${s.codAmount.toLocaleString()}` : <span className="text-zinc-600">—</span>}
                  </td>
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

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-600">Showing {filtered.length} of {total}</span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={filtered.length < 20}
              className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}