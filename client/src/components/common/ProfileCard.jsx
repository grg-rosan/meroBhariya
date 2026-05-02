import React, { useState, useRef, useEffect } from "react";
import { LogOut, Lock, ChevronUp, Sun, Moon } from "lucide-react";
import { useTheme } from "../../shared/hooks/useTheme";
export default function ProfileCard({
  user,
  role,
  accentClass,
  onLogout,
  onChangePassword,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { dark, toggle } = useTheme();
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
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-white dark:bg-gray-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl p-2 z-50 overflow-hidden">
          {/* User info header */}
          <div className="flex items-center gap-3 p-3 border-b border-gray-100 dark:border-zinc-800/50 mb-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${accentClass}`}
            >
              {user?.initials ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest">
                {role}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-blue-950 rounded-lg transition-all"
            >
              {dark ? (
                <>
                  <Sun size={14} /> Light mode
                </>
              ) : (
                <>
                  <Moon size={14} /> Dark mode
                </>
              )}
            </button>

            {/* Change password */}
            <button
              onClick={() => {
                onChangePassword();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-blue-950 rounded-lg transition-all"
            >
              <Lock size={14} /> Change password
            </button>

            <div className="h-px bg-gray-100 dark:bg-gray-100 dark:bg-blue-950 my-1 mx-2" />

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}

      {/* Trigger badge */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all
          hover:bg-gray-100 dark:hover:bg-gray-100 dark:bg-blue-950
          border border-transparent
          ${isOpen ? "bg-gray-100 dark:bg-gray-100 dark:bg-blue-950 border-gray-200 dark:border-zinc-700" : ""}`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${accentClass}`}
        >
          {user?.initials ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-gray-700 dark:text-zinc-300 font-medium truncate">
            {user?.name ?? "User"}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">
            {role.toLowerCase()}
          </p>
        </div>
        <ChevronUp
          size={14}
          className={`text-gray-400 dark:text-zinc-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
    </div>
  );
}
