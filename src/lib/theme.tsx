import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type ThemeName = "crimson" | "amber";
type ModeName = "dark" | "light";

interface ThemeCtx {
  theme: ThemeName;
  mode: ModeName;
  setTheme: (t: ThemeName) => void;
  setMode: (m: ModeName) => void;
  toggleTheme: () => void;
  toggleMode: () => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

const THEME_KEY = "sh.theme";
const MODE_KEY = "sh.mode";

function applyAttrs(theme: ThemeName, mode: ModeName) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-mode", mode);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>("crimson");
  const [mode, setModeState] = useState<ModeName>("dark");

  useEffect(() => {
    const t = (localStorage.getItem(THEME_KEY) as ThemeName | null) ?? "crimson";
    const m = (localStorage.getItem(MODE_KEY) as ModeName | null) ?? "dark";
    setThemeState(t);
    setModeState(m);
    applyAttrs(t, m);
  }, []);

  const setTheme = (t: ThemeName) => {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyAttrs(t, mode);
  };
  const setMode = (m: ModeName) => {
    setModeState(m);
    localStorage.setItem(MODE_KEY, m);
    applyAttrs(theme, m);
  };

  return (
    <Ctx.Provider
      value={{
        theme,
        mode,
        setTheme,
        setMode,
        toggleTheme: () => setTheme(theme === "crimson" ? "amber" : "crimson"),
        toggleMode: () => setMode(mode === "dark" ? "light" : "dark"),
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTheme outside ThemeProvider");
  return v;
}
