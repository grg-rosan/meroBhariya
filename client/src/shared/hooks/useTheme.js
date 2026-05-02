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