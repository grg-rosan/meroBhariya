import { Wallet, ArrowDownLeft, Clock, CheckCircle, XCircle, Truck, Package, RefreshCw } from 'lucide-react';
import { useCODLedger } from '../hooks/useShipment';
import StatCard from '../../../shared/components/StatCard';


const STATUS_STEPS = ['PENDING','ASSIGNED','PICKED_UP','IN_HUB','OUT_FOR_DELIVERY','DELIVERED'];

function Timeline({ logs }) {
  return (
    <div className="mt-3 space-y-1.5">
      {logs.map((log, i) => (
        <div key={log.id} className="flex items-start gap-2">
          <div className="flex flex-col items-center">
            <div className={'w-2 h-2 rounded-full mt-1 ' + (i === logs.length - 1 ? 'bg-rose-400' : 'bg-zinc-600')} />
            {i < logs.length - 1 && <div className="w-px h-4 bg-zinc-700" />}
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-300">{log.status.replace(/_/g, ' ')}</span>
            <span className="text-xs text-zinc-600 ml-2">{new Date(log.createdAt).toLocaleString()}</span>
            {log.note && <p className="text-xs text-zinc-500">{log.note}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ShipmentCard({ s }) {
  const [open, setOpen] = useState(false);
  const statusIdx = STATUS_STEPS.indexOf(s.status);
  const isDelivered = s.status === 'DELIVERED';
  const isCancelled = s.status === 'CANCELLED';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3">
      <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-zinc-800/30 transition-all" onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-4">
          <div>
            <p className="text-xs font-mono text-zinc-400">{s.trackingNumber}</p>
            <p className="text-sm font-medium text-zinc-200 mt-0.5">{s.receiverName}</p>
            <p className="text-xs text-zinc-500">{s.deliveryAddress}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <p className="text-xs text-zinc-500">COD Amount</p>
            <p className="text-sm font-semibold text-zinc-200">Rs {s.codAmount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-zinc-500">Status</p>
            {isDelivered ? (
              <span className="text-xs font-medium text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Collected</span>
            ) : isCancelled ? (
              <span className="text-xs font-medium text-red-400 flex items-center gap-1"><XCircle size={11} /> Cancelled</span>
            ) : (
              <span className="text-xs font-medium text-amber-400 flex items-center gap-1"><Clock size={11} /> {s.status.replace(/_/g,' ')}</span>
            )}
          </div>
          <div>
            <p className="text-xs text-zinc-500">Remitted</p>
            {s.transaction?.isRemitted
              ? <span className="text-xs text-green-400">Yes</span>
              : <span className="text-xs text-zinc-500">No</span>}
          </div>
          <span className="text-zinc-600 text-xs">{open ? '?' : '?'}</span>
        </div>
      </div>

      {open && (
        <div className="px-5 pb-4 border-t border-zinc-800">
          {/* Progress bar */}
          {!isCancelled && (
            <div className="mt-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={'w-3 h-3 rounded-full ' + (i <= statusIdx ? 'bg-rose-500' : 'bg-zinc-700')} />
                    <p className="text-[9px] text-zinc-500 mt-1 text-center">{step.replace(/_/g,' ')}</p>
                  </div>
                ))}
              </div>
              <div className="h-1 bg-zinc-700 rounded-full mt-1">
                <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: ((statusIdx + 1) / STATUS_STEPS.length * 100) + '%' }} />
              </div>
            </div>
          )}

          {/* Transaction details */}
          {s.transaction && (
            <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
              <p className="text-xs font-medium text-zinc-400 mb-2">Transaction</p>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div><p className="text-zinc-500">Total fare</p><p className="text-zinc-200 font-medium">Rs {s.transaction.totalFare?.toLocaleString()}</p></div>
                <div><p className="text-zinc-500">COD collected</p><p className="text-zinc-200 font-medium">Rs {s.transaction.collectedByRider?.toLocaleString() ?? '�'}</p></div>
                <div><p className="text-zinc-500">Remitted at</p><p className="text-zinc-200 font-medium">{s.transaction.remittedAt ? new Date(s.transaction.remittedAt).toLocaleDateString() : '�'}</p></div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <p className="text-xs font-medium text-zinc-400 mb-2">Shipment timeline</p>
          <Timeline logs={s.logs ?? []} />
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';

export default function CODLedger() {
  const { data, loading, refetch } = useCODLedger();

  const shipments = data?.shipments ?? [];
  const totalCOD  = data?.totalCOD  ?? 0;
  const collected = data?.collected  ?? 0;
  const pending   = data?.pending    ?? 0;
  const remitted  = data?.remitted   ?? 0;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">COD ledger</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Track every COD shipment and its payment status</p>
        </div>
        <button onClick={refetch} className="flex items-center gap-2 px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded-lg hover:bg-zinc-800 transition-all">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={Wallet}        label="Total COD"      value={'Rs ' + totalCOD.toLocaleString()}  color="rose"  />
        <StatCard icon={CheckCircle}   label="Collected"      value={'Rs ' + collected.toLocaleString()} color="green" />
        <StatCard icon={Clock}         label="Pending"        value={'Rs ' + pending.toLocaleString()}   color="amber" />
        <StatCard icon={ArrowDownLeft} label="Remitted"       value={'Rs ' + remitted.toLocaleString()}  color="blue"  />
      </div>

      {loading ? (
        <div className="py-10 text-center text-zinc-600 text-sm">Loading...</div>
      ) : shipments.length === 0 ? (
        <div className="py-10 text-center text-zinc-600 text-sm">No COD shipments found</div>
      ) : (
        shipments.map(s => <ShipmentCard key={s.id} s={s} />)
      )}
    </div>
  );
}
