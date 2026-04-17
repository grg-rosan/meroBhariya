import { useState } from 'react';
import { Search, Plus, Eye, RefreshCw } from 'lucide-react';
import { useShipments } from '../hooks/useMerchant';
import StatusBadge from '../../shared/components/StatusBadge';

const TABS = [
  { value:'',                 label:'All' },
  { value:'PENDING',          label:'Pending' },
  { value:'ASSIGNED',         label:'Assigned' },
  { value:'IN_HUB',           label:'At hub' },
  { value:'OUT_FOR_DELIVERY', label:'Out for delivery' },
  { value:'DELIVERED',        label:'Delivered' },
  { value:'CANCELLED',        label:'Cancelled' },
];

const MOCK = [
  { trackingNumber:'PTR-2841', receiverName:'Aarav Shah',   receiverPhone:'9841000001', deliveryAddress:'Thamel, KTM',  weight:1.2, codAmount:2400, status:'DELIVERED' },
  { trackingNumber:'PTR-2840', receiverName:'Priya Thapa',  receiverPhone:'9841000002', deliveryAddress:'Lalitpur-3',   weight:0.8, codAmount:1800, status:'OUT_FOR_DELIVERY' },
  { trackingNumber:'PTR-2839', receiverName:'Raj Gurung',   receiverPhone:'9841000003', deliveryAddress:'Bhaktapur',    weight:2.1, codAmount:0,    status:'PENDING' },
  { trackingNumber:'PTR-2838', receiverName:'Sita Rai',     receiverPhone:'9841000004', deliveryAddress:'Patan-7',      weight:0.5, codAmount:900,  status:'IN_HUB' },
  { trackingNumber:'PTR-2837', receiverName:'Manish KC',    receiverPhone:'9841000005', deliveryAddress:'Koteshwor',    weight:3.4, codAmount:5200, status:'CANCELLED' },
  { trackingNumber:'PTR-2836', receiverName:'Deepa Magar',  receiverPhone:'9841000006', deliveryAddress:'Baneshwor',    weight:1.0, codAmount:1200, status:'ASSIGNED' },
  { trackingNumber:'PTR-2835', receiverName:'Suresh Lama',  receiverPhone:'9841000007', deliveryAddress:'Kalanki',      weight:4.2, codAmount:0,    status:'DELIVERED' },
];

export default function MerchantShipments() {
  const [activeStatus, setActiveStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [page, setPage]                 = useState(1);

  const { data, loading, refetch } = useShipments(activeStatus, page);
  const shipments = data?.shipments ?? MOCK;

  const filtered = shipments.filter(s =>
    !search || s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Shipments</h1>
          <p className="text-sm text-zinc-500 mt-0.5">{data?.total ?? MOCK.length} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="p-2 text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-sm rounded-lg font-medium transition-all">
            <Plus size={14} /> New shipment
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 flex-wrap">
          {TABS.map(t=>(
            <button key={t.value} onClick={()=>{setActiveStatus(t.value);setPage(1);}}
              className={`px-3 py-1 text-xs rounded-md font-medium transition-all ${activeStatus===t.value ? 'bg-rose-500 text-white':'text-zinc-400 hover:text-zinc-200'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
            className="pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-52" />
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-zinc-800">
              {['Tracking #','Receiver','Phone','Address','Weight','COD','Status',''].map(h=>(
                <th key={h} className="text-left px-4 py-3 text-xs text-zinc-500 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={8} className="px-4 py-10 text-center text-zinc-600 text-sm">No shipments found</td></tr>
                : filtered.map(s=>(
                  <tr key={s.trackingNumber} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-400">{s.trackingNumber}</td>
                    <td className="px-4 py-3 text-zinc-200 font-medium">{s.receiverName}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500">{s.receiverPhone}</td>
                    <td className="px-4 py-3 text-xs text-zinc-500 max-w-[140px] truncate">{s.deliveryAddress}</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{s.weight} kg</td>
                    <td className="px-4 py-3 text-xs text-zinc-400">{s.codAmount > 0 ? `रु ${s.codAmount.toLocaleString()}` : <span className="text-zinc-600">—</span>}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status}/></td>
                    <td className="px-4 py-3"><button className="p-1.5 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-all"><Eye size={13}/></button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-xs text-zinc-600">Showing {filtered.length}</span>
          <div className="flex gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">Prev</button>
            <button onClick={()=>setPage(p=>p+1)} disabled={filtered.length<20} className="px-3 py-1 text-xs border border-zinc-800 rounded text-zinc-400 hover:bg-zinc-800 disabled:opacity-30">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}