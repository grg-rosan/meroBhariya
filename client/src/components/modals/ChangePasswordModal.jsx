import { useState } from "react";
import { X } from "lucide-react";
import { authAPI } from "../../shared/services/authService.js";
import { useToast } from "../../context/ToastContext";

export default function ChangePasswordModal({ onClose }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      return setError("Passwords do not match.");
    }
    if (form.newPassword.length < 8) {
      return setError("Password must be at least 8 characters.");
    }

    try {
      setLoading(true);
      await authAPI.changePassword(form.currentPassword, form.newPassword);
      showToast("Password changed successfully.", "success");
      onClose();
    } catch (err) {
      setError(err.message || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-full max-w-sm p-6">
        {/* header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-zinc-900 dark:text-white font-semibold">Change Password</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 dark:text-zinc-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* fields */}
        <div className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={form.currentPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, currentPassword: e.target.value }))
            }
            className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-gray-500 dark:focus:border-zinc-500"
          />
          <input
            type="password"
            placeholder="New password"
            value={form.newPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, newPassword: e.target.value }))
            }
            className="flex-1 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((f) => ({ ...f, confirmPassword: e.target.value }))
            }
            className="w-full bg-zinc-100 dark:bg-blue-950 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500"
          />
        </div>

        {/* error */}
        {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

        {/* actions */}
        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm text-zinc-500 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:bg-blue-950"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
