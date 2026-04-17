import React, { useState, useRef, useEffect } from "react";
import { LogOut , Lock, ChevronUp } from "lucide-react";

export default function ProfileCard({ user, role, accentClass, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      {/* Pop-up Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-2 z-50 overflow-hidden">
          <div className="flex items-center gap-3 p-3 border-b border-zinc-800/50 mb-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${accentClass}`}
            >
              {user?.initials ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] text-zinc-500 uppercase tracking-widest">
                {role}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            <button className="flex items-center gap-3 w-full px-3 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all">
              <Lock size={14} /> Change Password
            </button>
            <div className="h-px bg-zinc-800 my-1 mx-2" />
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}

      {/* Trigger Badge */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:bg-zinc-800 border border-transparent ${isOpen ? "bg-zinc-800 border-zinc-700" : ""}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${accentClass}`}
        >
          {user?.initials ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-zinc-300 font-medium truncate">
            {user?.name ?? "User"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate">
            {role.toLowerCase()}
          </p>
        </div>
        <ChevronUp
          size={14}
          className={`text-zinc-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
    </div>
  );
}
