import { createContext, useContext } from "react";
import { useTheme, useThemeTokens } from "../shared/hooks/useTheme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { dark, toggle } = useTheme();
  const tokens = useThemeTokens(dark);

  return (
    <ThemeContext.Provider value={{ dark, toggle, tokens }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used inside <ThemeProvider>");
  return ctx;
}
