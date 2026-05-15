// src/hooks/useTheme.js
import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDark] = useState(
    () => localStorage.getItem("dashboard-theme") === "dark"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("dashboard-theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark((d) => !d) };
}

export function useThemeTokens(dark) {
  return {
    bg:        dark ? "bg-zinc-950"              : "bg-zinc-50",
    surface:   dark ? "bg-zinc-900"              : "bg-white",
    border:    dark ? "border-zinc-700"          : "border-zinc-200",
    text:      dark ? "text-white"               : "text-zinc-900",
    sub:       dark ? "text-zinc-400"            : "text-zinc-500",
    muted:     dark ? "text-zinc-600"            : "text-zinc-400",
    accent:    dark ? "text-violet-400"          : "text-violet-600",
    tag:       dark ? "bg-zinc-800 text-zinc-300": "bg-zinc-100 text-zinc-600",
    input:     dark
      ? "bg-zinc-800 border-zinc-600 text-white focus:border-violet-500"
      : "bg-zinc-50  border-zinc-300 text-zinc-900 focus:border-violet-500",
    card: (checked) => dark
      ? `bg-zinc-900 border ${checked ? "border-violet-500" : "border-zinc-800 hover:border-zinc-600"}`
      : `bg-white border ${checked ? "border-violet-500" : "border-zinc-200 hover:border-zinc-400"} shadow-sm`,
    filterSel: dark
      ? "bg-zinc-800 border-zinc-700 text-zinc-300 focus:border-violet-500"
      : "bg-white border-zinc-300 text-zinc-700 focus:border-violet-500",
    selBar:    dark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200",
    selText:   dark ? "text-zinc-300"               : "text-zinc-700",
    btnBase:   dark
      ? "bg-violet-600/20 hover:bg-violet-600 border border-violet-600/40 hover:border-violet-500 text-violet-300 hover:text-white"
      : "bg-violet-50 hover:bg-violet-600 border border-violet-200 hover:border-violet-500 text-violet-600 hover:text-white",
    modalCard: dark ? "bg-zinc-900 border-zinc-700" : "bg-white border-zinc-200",
    summary:   dark ? "bg-zinc-800 text-zinc-300"   : "bg-zinc-50 text-zinc-700",
    cancelBtn: dark
      ? "border-zinc-600 text-zinc-300 hover:bg-zinc-800"
      : "border-zinc-300 text-zinc-600 hover:bg-zinc-50",
    sidebar:   dark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200",
    navActive: dark ? "bg-zinc-800 text-white font-medium" : "bg-zinc-100 text-zinc-900 font-medium",
    navIdle:   dark
      ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
    hover:     dark ? "hover:bg-zinc-800" : "hover:bg-zinc-50",
    tableHead: dark ? "bg-zinc-800/50 border-zinc-800" : "bg-zinc-50 border-zinc-200",
    divide:    dark ? "divide-zinc-800" : "divide-zinc-100",
  };
}