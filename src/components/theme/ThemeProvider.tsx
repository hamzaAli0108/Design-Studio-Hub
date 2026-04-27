import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";

export type ThemeMode = "light" | "dark";

export interface ColorPreset {
  id: string;
  name: string;
  primary: string;   // HSL string: "180 100% 50%"
  secondary: string;
  accent: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  { id: "neon",    name: "Neon Cyan",   primary: "180 100% 50%", secondary: "320 100% 55%", accent: "270 100% 65%" },
  { id: "sunset",  name: "Sunset",      primary: "20 100% 55%",  secondary: "340 95% 58%",  accent: "45 100% 60%"  },
  { id: "forest",  name: "Forest",      primary: "150 70% 42%",  secondary: "90 60% 50%",   accent: "175 65% 45%"  },
  { id: "royal",   name: "Royal",       primary: "250 90% 62%",  secondary: "290 85% 60%",  accent: "210 95% 60%"  },
  { id: "candy",   name: "Candy",       primary: "330 95% 62%",  secondary: "200 95% 55%",  accent: "55 95% 60%"   },
  { id: "ocean",   name: "Ocean",       primary: "200 95% 50%",  secondary: "180 80% 45%",  accent: "230 85% 60%"  },
  { id: "mono",    name: "Mono",        primary: "0 0% 90%",     secondary: "0 0% 60%",     accent: "0 0% 75%"     },
];

interface ThemeState {
  mode: ThemeMode;
  preset: string;          // preset id or "custom"
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeContextValue extends ThemeState {
  setMode: (m: ThemeMode) => void;
  applyPreset: (id: string) => void;
  setColor: (key: "primary" | "secondary" | "accent", hsl: string) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "studio-theme-v1";
const DEFAULT: ThemeState = {
  mode: "dark",
  preset: "neon",
  primary: COLOR_PRESETS[0].primary,
  secondary: COLOR_PRESETS[0].secondary,
  accent: COLOR_PRESETS[0].accent,
};

function loadInitial(): ThemeState {
  if (typeof window === "undefined") return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT, ...parsed };
  } catch {
    return DEFAULT;
  }
}

function applyToDocument(state: ThemeState) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(state.mode);
  root.style.setProperty("--primary", state.primary);
  root.style.setProperty("--secondary", state.secondary);
  root.style.setProperty("--accent", state.accent);
  root.style.setProperty("--ring", state.primary);
  // Refresh derived gradients to use the new tokens
  root.style.setProperty(
    "--gradient-neon",
    `linear-gradient(135deg, hsl(${state.primary}) 0%, hsl(${state.secondary}) 100%)`
  );
  root.style.setProperty(
    "--gradient-violet",
    `linear-gradient(135deg, hsl(${state.accent}) 0%, hsl(${state.secondary}) 100%)`
  );
  root.style.setProperty(
    "--gradient-text",
    `linear-gradient(135deg, hsl(${state.primary}), hsl(${state.secondary}))`
  );
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<ThemeState>(loadInitial);

  useEffect(() => {
    applyToDocument(state);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const value = useMemo<ThemeContextValue>(() => ({
    ...state,
    setMode: (mode) => setState((s) => ({ ...s, mode })),
    applyPreset: (id) => {
      const p = COLOR_PRESETS.find((x) => x.id === id);
      if (!p) return;
      setState((s) => ({ ...s, preset: id, primary: p.primary, secondary: p.secondary, accent: p.accent }));
    },
    setColor: (key, hsl) =>
      setState((s) => ({ ...s, preset: "custom", [key]: hsl } as ThemeState)),
    reset: () => setState(DEFAULT),
  }), [state]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
};
