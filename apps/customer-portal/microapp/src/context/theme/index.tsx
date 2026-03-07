import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const ThemeModeContext = createContext<"light" | "dark">("light");

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(window.matchMedia("(prefers-color-scheme: dark)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, []);

  return <ThemeModeContext.Provider value={isDark ? "dark" : "light"}>{children}</ThemeModeContext.Provider>;
}

export const useThemeMode = () => useContext(ThemeModeContext);
