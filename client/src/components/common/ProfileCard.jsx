import { useState, useRef, useEffect } from "react";
import { LogOut, Lock, ChevronUp, Sun, Moon } from "lucide-react";
import { useAppTheme } from "../../context/ThemeContext";

export default function ProfileCard({
  user,
  role,
  accentClass,
  onLogout,
  onChangePassword,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { dark, toggle, tokens: t } = useAppTheme();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const menuBtn =
    `flex items-center gap-3 w-full px-3 py-2 text-xs ${t.sub} hover:${t.text} ${t.hover} rounded-lg transition-all`;

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div
          className={`absolute bottom-full left-0 right-0 mb-2 ${t.surface} border ${t.border} rounded-xl shadow-2xl p-2 z-50 overflow-hidden`}
        >
          <div className={`flex items-center gap-3 p-3 border-b ${t.border} mb-1`}>
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white shrink-0 ${accentClass}`}
            >
              {user?.initials ?? "U"}
            </div>
            <div className="min-w-0">
              <p className={`text-sm ${t.text} font-medium truncate`}>
                {user?.name ?? "User"}
              </p>
              <p className={`text-[11px] ${t.muted} uppercase tracking-widest`}>
                {role}
              </p>
            </div>
          </div>

          <div className="space-y-0.5">
            <button type="button" onClick={toggle} className={menuBtn}>
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

            <button
              type="button"
              onClick={() => {
                onChangePassword();
                setIsOpen(false);
              }}
              className={menuBtn}
            >
              <Lock size={14} /> Change password
            </button>

            <div className={`h-px ${t.border} my-1 mx-2`} />

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <LogOut size={14} /> Log out
            </button>
          </div>
        </div>
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => e.key === "Enter" && setIsOpen(!isOpen)}
        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${t.hover} border border-transparent ${
          isOpen ? `${t.tag} border ${t.border}` : ""
        }`}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 ${accentClass}`}
        >
          {user?.initials ?? "U"}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`text-xs ${t.selText} font-medium truncate`}>
            {user?.name ?? "User"}
          </p>
          <p className={`text-[10px] ${t.muted} truncate`}>
            {role.toLowerCase()}
          </p>
        </div>
        <ChevronUp
          size={14}
          className={`${t.muted} transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </div>
    </div>
  );
}
