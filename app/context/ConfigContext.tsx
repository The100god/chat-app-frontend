"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { getSocket } from "../hooks/useSocket";

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  platform?: "all" | "web" | "mobile";
  description?: string;
  message?: string;
}

export interface ThemeTokenSet {
  id: string;
  name: string;
  background: string;
  foreground: string;
  primary: string;
  secondary: string;
  accent: string;
  muted: string;
  card: string;
  border: string;
  bubbleSent: string;
  bubbleSentText: string;
  bubbleReceived: string;
  bubbleReceivedText: string;
}

export interface ThemesConfig {
  activeDefault: string;
  themes: {
    light: ThemeTokenSet;
    dark: ThemeTokenSet;
    aurora: ThemeTokenSet;
    [key: string]: ThemeTokenSet;
  };
}

export interface AnimatedBgConfig {
  enabled: boolean;
  defaultEmojis: string[];
  maxCustomTextLength: number;
  prohibitedWords: string[];
  allowCustomColor: boolean;
  particleDensity: number;
  floatingSpeed: number;
  themeOpacity: {
    light: number;
    dark: number;
    aurora: number;
  };
}

export interface TogetherGameItem {
  id: string;
  title: string;
  category: string;
  enabled: boolean;
  minPlayers: number;
  maxPlayers: number;
  order: number;
}

export interface CoupleActivityItem {
  id: string;
  title: string;
  enabled: boolean;
  category: string;
  totalQuestions: number;
}

export interface PublicSystemConfig {
  features: Record<string, FeatureFlag>;
  themes: ThemesConfig;
  animated_bg: AnimatedBgConfig;
  together_games: Record<string, TogetherGameItem>;
  couple_activities: Record<string, CoupleActivityItem>;
  mobile_app: Record<string, any>;
}

interface ConfigContextValue {
  config: PublicSystemConfig | null;
  loading: boolean;
  isFeatureEnabled: (key: string) => boolean;
  isGameEnabled: (gameId: string) => boolean;
  isActivityEnabled: (activityId: string) => boolean;
  maintenance: { enabled: boolean; message: string };
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

// Apply dynamic theme tokens to DOM style sheet
function applyDynamicThemes(themesConfig?: ThemesConfig) {
  if (typeof document === "undefined" || !themesConfig?.themes) return;

  const styleId = "chugli-admin-dynamic-theme";
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  let css = "";
  const { light, dark, aurora } = themesConfig.themes;

  if (light) {
    css += `
      :root, [data-theme="light"] {
        --background: ${light.background};
        --foreground: ${light.foreground};
        --primary: ${light.primary};
        --secondary: ${light.secondary};
        --accent: ${light.accent};
        --accent-hover: color-mix(in srgb, ${light.accent} 85%, black);
        --muted: ${light.muted};
        --card: ${light.card};
        --border: ${light.border};
        --bubble-sent: ${light.bubbleSent};
        --bubble-sent-text: ${light.bubbleSentText};
        --bubble-received: ${light.bubbleReceived};
        --bubble-received-text: ${light.bubbleReceivedText};
      }
    `;
  }

  if (dark) {
    css += `
      [data-theme="dark"] {
        --background: ${dark.background};
        --foreground: ${dark.foreground};
        --primary: ${dark.primary};
        --secondary: ${dark.secondary};
        --accent: ${dark.accent};
        --accent-hover: color-mix(in srgb, ${dark.accent} 85%, white);
        --muted: ${dark.muted};
        --card: ${dark.card};
        --border: ${dark.border};
        --bubble-sent: ${dark.bubbleSent};
        --bubble-sent-text: ${dark.bubbleSentText};
        --bubble-received: ${dark.bubbleReceived};
        --bubble-received-text: ${dark.bubbleReceivedText};
      }
    `;
  }

  if (aurora) {
    css += `
      [data-theme="aurora"] {
        --background: ${aurora.background};
        --foreground: ${aurora.foreground};
        --primary: ${aurora.primary};
        --secondary: ${aurora.secondary};
        --accent: ${aurora.accent};
        --accent-hover: color-mix(in srgb, ${aurora.accent} 85%, black);
        --muted: ${aurora.muted};
        --card: ${aurora.card};
        --border: ${aurora.border};
        --bubble-sent: ${aurora.bubbleSent};
        --bubble-sent-text: ${aurora.bubbleSentText};
        --bubble-received: ${aurora.bubbleReceived};
        --bubble-received-text: ${aurora.bubbleReceivedText};
      }
    `;
  }

  styleEl.textContent = css;
}

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PublicSystemConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const getBackendUrl = () => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
      }
      return process.env.NEXT_PUBLIC_API_URL || `http://${host}:5001`;
    }
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
  };

  const fetchPublicConfig = async () => {
    try {
      const backendUrl = getBackendUrl();
      const res = await fetch(`${backendUrl}/api/config/public`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setConfig(data.config);
          applyDynamicThemes(data.config.themes);
        }
      }
    } catch (err) {
      console.warn("Public config fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicConfig();

    // Listen for realtime Socket.io config broadcasts from Admin Hub
    const checkSocketInterval = setInterval(() => {
      const socket = getSocket();
      if (socket) {
        clearInterval(checkSocketInterval);

        socket.on("admin:config_updated", (payload: { category: string; data: any }) => {
          setConfig((prev) => {
            if (!prev) return prev;
            const updated = {
              ...prev,
              [payload.category]: payload.data,
            };
            if (payload.category === "themes") {
              applyDynamicThemes(payload.data);
            }
            return updated;
          });
        });

        socket.on("features:updated", (featuresData: any) => {
          setConfig((prev) => (prev ? { ...prev, features: featuresData } : prev));
        });

        socket.on("theme:updated", (themeData: any) => {
          setConfig((prev) => (prev ? { ...prev, themes: themeData } : prev));
          applyDynamicThemes(themeData);
        });

        socket.on("animated_bg:updated", (bgData: any) => {
          setConfig((prev) => (prev ? { ...prev, animated_bg: bgData } : prev));
        });

        socket.on("together_games:updated", (gamesData: any) => {
          setConfig((prev) => (prev ? { ...prev, together_games: gamesData } : prev));
        });

        socket.on("couple_activities:updated", (activitiesData: any) => {
          setConfig((prev) => (prev ? { ...prev, couple_activities: activitiesData } : prev));
        });
      }
    }, 1500);

    return () => clearInterval(checkSocketInterval);
  }, []);

  const isFeatureEnabled = (key: string): boolean => {
    if (!config?.features) return true; // Default fallback to enabled
    const feat = config.features[key];
    if (!feat) return true;
    if (feat.platform && feat.platform === "mobile") return false; // Web only
    return feat.enabled !== false;
  };

  const isGameEnabled = (gameId: string): boolean => {
    if (!config?.together_games) return true;
    const game = config.together_games[gameId];
    if (!game) return true;
    return game.enabled !== false;
  };

  const isActivityEnabled = (activityId: string): boolean => {
    if (!config?.couple_activities) return true;
    const act = config.couple_activities[activityId];
    if (!act) return true;
    return act.enabled !== false;
  };

  const maintenance = useMemo(() => {
    const isMaintenance = config?.features?.maintenance_mode?.enabled === true;
    const message =
      config?.features?.maintenance_mode?.message ||
      "Chugli is currently undergoing scheduled system maintenance. We'll be back shortly!";
    return { enabled: isMaintenance, message };
  }, [config]);

  const value: ConfigContextValue = {
    config,
    loading,
    isFeatureEnabled,
    isGameEnabled,
    isActivityEnabled,
    maintenance,
    refreshConfig: fetchPublicConfig,
  };

  return (
    <ConfigContext.Provider value={value}>
      {/* Global Maintenance Banner if Admin activated Maintenance Mode */}
      {maintenance.enabled && (
        <div className="fixed top-0 left-0 right-0 z-[99999] bg-gradient-to-r from-amber-600 to-rose-600 text-white text-xs font-semibold px-4 py-2.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 max-w-4xl mx-auto text-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>⚠️ {maintenance.message}</span>
          </div>
        </div>
      )}
      {children}
    </ConfigContext.Provider>
  );
};

export const useSystemConfig = () => {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    return {
      config: null,
      loading: false,
      isFeatureEnabled: () => true,
      isGameEnabled: () => true,
      isActivityEnabled: () => true,
      maintenance: { enabled: false, message: "" },
      refreshConfig: async () => {},
    };
  }
  return ctx;
};
