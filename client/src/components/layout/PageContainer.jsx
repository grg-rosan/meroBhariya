import { useAppTheme } from "../../context/ThemeContext";

export default function PageContainer({ children, className = "", wide = false }) {
  const { tokens: t } = useAppTheme();
  return (
    <div
      className={`p-4 md:p-6 ${wide ? "max-w-7xl" : "max-w-5xl"} mx-auto space-y-6 min-w-0 ${t.text} ${className}`}
    >
      {children}
    </div>
  );
}
