// src/admin/staff/components/StaffRow.jsx
import { ToggleLeft, ToggleRight } from "lucide-react";
import {
  ROLE_STYLES,
  initials,
} from "../../../../shared/constants/staffConstants";

export default function StaffRow({ member, onToggle, isToggling }) {
  const styles = ROLE_STYLES[member.role] ?? ROLE_STYLES.DISPATCHER;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors">
      {/* avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${styles.avatar}`}
      >
        {initials(member.fullName)}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {member.fullName}
        </p>
        <p className="text-xs text-zinc-500 truncate">
          {member.email} · {member.phoneNumber}
        </p>
      </div>

      {/* badges */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.badge}`}
        >
          {member.role}
        </span>
        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
            member.isActive
              ? "bg-green-500/10 text-green-400"
              : "bg-zinc-800 text-zinc-500"
          }`}
        >
          {member.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* toggle */}
      <button
        onClick={() => onToggle(member.id)}
        disabled={isToggling}
        className="shrink-0 p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-300 transition-all disabled:opacity-40"
        title={member.isActive ? "Deactivate" : "Activate"}
      >
        {member.isActive ? (
          <ToggleRight size={18} className="text-green-500" />
        ) : (
          <ToggleLeft size={18} />
        )}
      </button>
    </div>
  );
}
