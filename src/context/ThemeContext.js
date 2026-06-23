import React, { createContext, useContext, useEffect, useState } from "react";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme.js";

const ThemeContext = createContext(null);
const STORAGE_KEY = "avaxia-theme";

// Palette centralisée : un seul endroit à modifier pour ajuster les couleurs
// non gérées automatiquement par les composants UI5 (texte custom, fonds de
// cartes manuelles, grilles de graphiques recharts...).
function buildPalette(isDark) {
  return {
    pageBg: isDark ? "#1f2229" : "#f5f6f7",
    cardBg: isDark ? "#262a32" : "#ffffff",
    textPrimary: isDark ? "#e8eaee" : "#1e2a3e",
    textSecondary: isDark ? "#9aa0a8" : "#6a6d70",
    textTertiary: isDark ? "#6b7178" : "#aeb0b3",
    border: isDark ? "#3a3f48" : "#e5e5e5",
    badgeBg: isDark ? "rgba(55,138,221,0.18)" : "#e6f1fb",
    badgeText: isDark ? "#85b7eb" : "#0c447c",
    chartGrid: isDark ? "#3a3f48" : "#e0e0e0",
    chartAxis: isDark ? "#9aa0a8" : "#6a6d70",
    tooltipBg: isDark ? "#2f3540" : "#ffffff",
    tooltipBorder: isDark ? "#3a3f48" : "#e0e0e0",
  };
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem(STORAGE_KEY) || "light";
  });

  const isDark = theme === "dark";

  useEffect(() => {
    // Bascule le thème de tous les composants SAP UI5 (Table, Select, Card, Button...)
    setTheme(isDark ? "sap_horizon_dark" : "sap_horizon");
    // Permet aussi de cibler le mode sombre en CSS pur ailleurs dans l'app : [data-theme="dark"]
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme, isDark]);

  const toggleTheme = () => setThemeState(t => (t === "dark" ? "light" : "dark"));
  const setLight = () => setThemeState("light");
  const setDark = () => setThemeState("dark");

  const value = {
    theme,
    isDark,
    toggleTheme,
    setLight,
    setDark,
    palette: buildPalette(isDark),
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme doit être utilisé à l'intérieur d'un <ThemeProvider>.");
  }
  return ctx;
}