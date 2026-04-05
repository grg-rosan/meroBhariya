import { useState } from 'react';
import { CheckCircle, XCircle, FileText, User } from 'lucide-react';
import { usePendingUsers, useVerifyUser } from '../hooks/useAdmin';

const MOCK_MERCHANTS = [
  {
    id: 'u1', type: 'MERCHANT', name: 'Himalayan Thread Co.', pan: '304-218-471',
    submittedAgo: '2 hrs ago',
    docs: [
      { type: 'PAN_CERTIFICATE',      status: 'APPROVED' },
      { type: 'BUSINESS_REGISTRATION',status: 'APPROVED' },
      { type: 'OWNER_CITIZENSHIP',     status: 'PENDING'  },
    ],
  },
  {
    id: 'u2', type: 'MERCHANT', name: 'Nepal Mart Pvt Ltd', pan: '301-882-214',
    submittedAgo: '5 hrs ago',
    docs: [
      { type: 'PAN_CERTIFICATE',      status: 'APPROVED' },
      { type: 'BUSINESS_REGISTRATION',status: 'APPROVED' },
      { type: 'OWNER_CITIZENSHIP',     status: 'APPROVED' },
    ],
  },
];

const MOCK_RIDERS = [
  {
    id: 'u3', type: 'RIDER', name: 'Bikash Tamang', vehicle: 'Mini Truck',
    submittedAgo: '1 hr ago',
    docs: [
      { type: 'CITIZENSHIP_FRONT',     status: 'APPROVED' },
      { type: 'DRIVING_LICENSE_FRONT', status: 'APPROVED' },
      { type: 'VEHICLE_BLUEBOOK',      status: 'PENDING'  },
      { type: 'VEHICLE_INSURANCE',     status: 'PENDING'  },
    ],
  },
  {
    id: 'u4', type: 'RIDER', name: 'Sunil Magar', vehicle: 'Bike',
    submittedAgo: '3 hrs ago',
    docs: [
      { type: 'CITIZENSHIP_FRONT',     status: 'APPROVED' },
      { type: 'DRIVING_LICENSE_FRONT', status: 'APPROVED' },
      { type: 'VEHICLE_BLUEBOOK',      status: 'APPROVED' },
      { type: 'VEHICLE_INSURANCE',     status: 'APPROVED' },
      { type: 'RIDER_PHOTO',           status: 'APPROVED' },
    ],
  },
];

const DOC_LABELS = {
  PAN_CERTIFICATE: 'PAN cert', BUSINESS_REGISTRATION: 'Biz reg', TAX_CLEARANCE: 'Tax clearance',
  OWNER_CITIZENSHIP: 'Citizenship', OWNER_PHOTO: 'Owner photo',
  CITIZENSHIP_FRONT: 'Citizenship', DRIVING_LICENSE_FRONT: 'License',
  VEHICLE_BLUEBOOK: 'Bluebook', VEHICLE_INSURANCE: 'Insurance', RIDER_PHOTO: 'Photo',
};

function UserCard({ user, onVerify, onReject, loading }) {
  const [note, setNote]     = useState('');
  const [expanded, setExpanded] = useState(false);
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const allApproved = user.docs.every(d => d.status === 'APPROVED');

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-3 last:mb-0">
      <div className="p-4 flex items-start gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-violet-500/20 text-violet-400 text-sm font-semibold flex items-center justify-center shrink-0">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-medium text-zinc-200">{user.name}</p>
            <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded">
              {user.type === 'MERCHANT' ? `PAN: ${user.pan}` : user.vehicle}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mb-3">Submitted {user.submittedAgo}</p>

          {/* Doc pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {user.docs.map(d => (
              <span key={d.type} className={`text-xs px-2 py-0.5 rounded font-medium ${
                d.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' :
                d.status === 'REJECTED' ? 'bg-red-500/10 text-red-400' :
                'bg-amber-500/10 text-amber-400'
              }`}>
                {DOC_LABELS[d.type] ?? d.type}
              </span>
            ))}
          </div>

          {/* Rejection note */}
          {expanded && (
            <div className="mb-3">
              <input value={note} onChange={e => setNote(e.target.value)}
                placeholder="Rejection reason (optional)…"
                className="w-full px-3 py-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-red-500" />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 shrink-0">
          <button onClick={() => onVerify(user.id)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg font-medium disabled:opacity-40 transition-all">
            <CheckCircle size={12} /> Approve
          </button>
          <button onClick={() => { setExpanded(e => !e); if (expanded) onReject(user.id, note); }}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-700/50 text-red-400 hover:bg-red-500/10 text-xs rounded-lg font-medium transition-all">
            <XCircle size={12} /> {expanded ? 'Confirm reject' : 'Reject'}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-700 text-zinc-400 hover:bg-zinc-800 text-xs rounded-lg transition-all">
            <FileText size={12} /> Docs
          </button>
        </div>
      </div>

      {!allApproved && (
        <div className="px-4 pb-3">
          <p className="text-xs text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            {user.docs.filter(d => d.status === 'PENDING').length} document(s) still pending review
          </p>
        </div>
      )}
    </div>
  );
}

export default function VerifyUsers() {
  const { data }              = usePendingUsers();
  const { verify, loading }   = useVerifyUser();

  const merchants = data?.merchants ?? MOCK_MERCHANTS;
  const riders    = data?.riders    ?? MOCK_RIDERS;

  const [tab, setTab] = useState('merchants');

  const handleVerify = async (userId) => {
    try { await verify(userId, 'APPROVE'); } catch (_) {}
  };
  const handleReject = async (userId, note) => {
    try { await verify(userId, 'REJECT', note); } catch (_) {}
  };

  const list = tab === 'merchants' ? merchants : riders;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">User verification</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Review KYC documents and approve accounts</p>
      </div>

      {/* Tab */}
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

      {list.length === 0
        ? <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-600 text-sm">
            No pending {tab} — all caught up!
          </div>
        : list.map(u => (
          <UserCard key={u.id} user={u} onVerify={handleVerify} onReject={handleReject} loading={loading} />
        ))
      }
    </div>
  );
}