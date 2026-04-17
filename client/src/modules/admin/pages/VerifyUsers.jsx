import { useState } from 'react';
import { CheckCircle, XCircle, FileText } from 'lucide-react';
import { usePendingRiders, usePendingMerchants, useReviewRiderDoc, useReviewMerchantDoc } from '../hooks/useAdmin';

const DOC_LABELS = {
  PAN_CERTIFICATE: 'PAN cert', BUSINESS_REGISTRATION: 'Biz reg', TAX_CLEARANCE: 'Tax clearance',
  OWNER_CITIZENSHIP: 'Citizenship', OWNER_PHOTO: 'Owner photo',
  CITIZENSHIP_FRONT: 'Citizenship', DRIVING_LICENSE_FRONT: 'License',
  VEHICLE_BLUEBOOK: 'Bluebook', VEHICLE_INSURANCE: 'Insurance', RIDER_PHOTO: 'Photo',
  CITIZENSHIP_BACK: 'Citizenship (back)', DRIVING_LICENSE_BACK: 'License (back)',
  VEHICLE_PHOTO: 'Vehicle photo'
};

function UserCard({ user, type, onReviewDoc, loading }) {
  const [note, setNote]         = useState('');
  const [expandedDoc, setExpandedDoc] = useState(null);
  const initials = user.user.fullName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const allApproved = user.documents.every(d => d.status === 'APPROVED');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3 last:mb-0">
      <div className="p-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 text-sm font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-zinc-200">{user.user.fullName}</p>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
              {type === 'MERCHANT' ? user.businessName : user.vehicleType?.name}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-3">{user.user.email}</p>

          {/* Doc pills — each clickable to review */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.documents.map(d => (
              <button key={d.id}
                onClick={() => setExpandedDoc(expandedDoc === d.id ? null : d.id)}
                className={`text-xs px-2 py-0.5 rounded font-medium border transition-all ${
                  d.status === 'APPROVED' ? 'bg-green-500/10 text-green-400 border-green-800' :
                  d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400 border-red-800' :
                  'bg-amber-500/10 text-amber-400 border-amber-800'
                }`}>
                {DOC_LABELS[d.type] ?? d.type}
              </button>
            ))}
          </div>

          {/* Expanded doc review */}
          {expandedDoc && (() => {
            const doc = user.documents.find(d => d.id === expandedDoc);
            return doc ? (
              <div className="mb-3 p-3 bg-zinc-800 rounded-lg border border-zinc-700">
                <a href={doc.fileUrl} target="_blank" rel="noreferrer"
                  className="text-xs text-sky-400 underline mb-2 block">
                  View document ↗
                </a>
                <input value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Note (optional)…"
                  className="w-full px-3 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-violet-500 mb-2" />
                <div className="flex gap-2">
                  <button onClick={() => { onReviewDoc(doc.id, 'APPROVED', '', type); setExpandedDoc(null); }}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-40">
                    <CheckCircle size={11} /> Approve
                  </button>
                  <button onClick={() => { onReviewDoc(doc.id, 'REJECTED', note, type); setExpandedDoc(null); setNote(''); }}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-700/50 text-red-400 hover:bg-red-500/10 text-xs rounded-lg font-medium">
                    <XCircle size={11} /> Reject
                  </button>
                </div>
              </div>
            ) : null;
          })()}
        </div>

        <a href={user.documents[0]?.fileUrl} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs rounded-lg transition-all">
          <FileText size={12} /> Docs
        </a>
      </div>

      {!allApproved && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {user.documents.filter(d => d.status === 'PENDING').length} document(s) still pending review
          </p>
        </div>
      )}
    </div>
  );
}
export default function VerifyUsers() {
  const { data: riderData,    loading: riderLoading,    refetch: refetchRiders }    = usePendingRiders();
  const { data: merchantData, loading: merchantLoading, refetch: refetchMerchants } = usePendingMerchants();
  const { review: reviewRider }    = useReviewRiderDoc();
  const { review: reviewMerchant } = useReviewMerchantDoc();

  const [tab, setTab] = useState('merchants');

  const merchants = merchantData?.merchants ?? [];
  const riders    = riderData?.riders       ?? [];
  const list      = tab === 'merchants' ? merchants : riders;
  const loading   = tab === 'merchants' ? merchantLoading : riderLoading;

  const handleReviewDoc = async (docId, status, note, type) => {
    try {
      if (type === 'RIDER')    await reviewRider(docId,    { status, note });
      if (type === 'MERCHANT') await reviewMerchant(docId, { status, note });
      
      // ← refetch after review
      refetchRiders();
      refetchMerchants();
    } catch (_) {}
  };
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">User verification</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Review KYC documents and approve accounts</p>
      </div>

      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-1 mb-5 w-fit">
        {[
          { key: 'merchants', label: `Merchants (${merchants.length})` },
          { key: 'riders',    label: `Riders (${riders.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 text-xs rounded-md font-medium transition-all ${tab === t.key ? 'bg-violet-500 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-zinc-500 text-sm">Loading...</p>
      ) : list.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-600 text-sm">
          No pending {tab} — all caught up!
        </div>
      ) : (
        list.map(u => (
          <UserCard key={u.id} user={u} type={tab === 'merchants' ? 'MERCHANT' : 'RIDER'}
            onReviewDoc={handleReviewDoc} loading={loading} />
        ))
      )}
    </div>
  );
}