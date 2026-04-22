// src/admin/staff/components/CreateStaffModal.jsx
import { useState } from 'react';
import { X, Eye, EyeOff, Shield, Radio } from 'lucide-react';

export default function CreateStaffModal({ onClose, onCreate }) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', role: 'DISPATCHER',
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    try {
      await onCreate(form); // ← parent's handleCreate does the API call
      onClose();
    } catch { /* toast handled upstream in useCreateStaff */ }
    finally { setLoading(false); }
  };

  const isValid = form.name && form.email && form.phone && form.password.length >= 8;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-sm font-semibold text-white">New staff account</h2>
            <p className="text-xs text-zinc-500 mt-0.5">They can log in immediately after creation</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* body */}
        <div className="px-5 py-4 space-y-4">

          {/* role selector */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'DISPATCHER', label: 'Dispatcher', icon: Radio },
                { value: 'ADMIN',      label: 'Admin',       icon: Shield },
              ].map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set('role', value)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all ${
                    form.role === value
                      ? value === 'DISPATCHER'
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-300'
                        : 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                      : 'border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <Icon size={15} />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Full name</label>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Bikash Tamang"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>

          {/* email + phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="bikash@merobhariya.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
            </div>
          </div>

          {/* password */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !isValid}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  );
}