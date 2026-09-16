"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";
const ThemeContext = createContext({ theme: "dark" as Theme, toggle: () => {} });

export function DashboardTheme({ initialTheme, children }: { initialTheme: Theme; children: ReactNode }) {
  const [theme, setTheme] = useState(initialTheme);
  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    // The server reads the same preference so reloads paint the right theme.
    document.cookie = `menuly-dashboard-theme=${next}; Path=/dashboard; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  return <ThemeContext.Provider value={{ theme, toggle }}>
    <div className="menuly-app dashboard-workspace internal-green" data-theme={theme}>{children}</div>
  </ThemeContext.Provider>;
}

export function DashboardThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  const label = theme === "dark" ? "Activar modo claro" : "Activar modo oscuro";
  return <button type="button" onClick={toggle} className="workspace-theme-toggle" aria-label={label} title={label}>
    {theme === "dark" ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
  </button>;
}
