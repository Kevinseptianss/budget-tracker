"use client";

import React, { useRef, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import {
  AccountBalanceWallet as HomeIcon,
  SmartToy as AIIcon,
  Category as CategoryIcon,
  History as HistoryIcon,
  Settings as SettingsIcon,
} from "@mui/icons-material";

export type ViewName = "home" | "ai" | "tags" | "history" | "settings";

interface BottomNavProps {
  activeView: ViewName;
  onViewChange: (view: ViewName) => void;
}

const tabs: {
  view: ViewName;
  label: string;
  icon: React.ComponentType<{ sx?: object }>;
}[] = [
  { view: "home", label: "Home", icon: HomeIcon },
  { view: "tags", label: "Tags", icon: CategoryIcon },
  { view: "ai", label: "AI", icon: AIIcon },
  { view: "history", label: "History", icon: HistoryIcon },
  { view: "settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  useEffect(() => {
    const updateIndicator = () => {
      const bar = barRef.current;
      if (!bar) return;
      const activeEl = bar.querySelector(
        `[data-view="${activeView}"]`
      ) as HTMLElement | null;
      if (!activeEl) return;
      const barRect = bar.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: elRect.left - barRect.left + 4,
        width: elRect.width - 8,
        opacity: 1,
      });
    };

    updateIndicator();
    const timer = setTimeout(updateIndicator, 50);
    return () => clearTimeout(timer);
  }, [activeView]);

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "calc(100% - 32px)",
        maxWidth: 440,
      }}
    >
      <Box
        ref={barRef}
        className="lg-glass lg-liquid-nav"
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderRadius: 28,
          py: 1,
          px: 1,
          gap: 0.25,
          position: "relative",
          overflow: "visible",
        }}
      >
        {/* Sliding liquid indicator */}
        <Box
          sx={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: indicator.left,
            width: indicator.width,
            borderRadius: 20,
            background:
              "linear-gradient(135deg, rgba(10,132,255,0.15), rgba(191,90,242,0.12))",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow:
              "0 2px 12px rgba(10,132,255,0.12), inset 0 1px 0 rgba(255,255,255,0.3)",
            opacity: indicator.opacity,
            transition:
              "left 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Liquid shimmer overlay */}
        <Box
          className="lg-liquid-shimmer"
          sx={{
            position: "absolute",
            inset: 0,
            borderRadius: 28,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeView === tab.view;
          const isAI = tab.view === "ai";
          const isSettings = tab.view === "settings";
          const activeColor = isAI ? "#bf5af2" : isSettings ? "#8e8e93" : "#0a84ff";

          if (isAI) {
            return (
              <Box
                key={tab.view}
                data-view={tab.view}
                onClick={() => onViewChange(tab.view)}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 56,
                  height: 56,
                  mt: -3,
                  borderRadius: "50%",
                  cursor: "pointer",
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 1,
                  background: active
                    ? "linear-gradient(135deg, rgba(191,90,242,0.9), rgba(10,132,255,0.9))"
                    : "linear-gradient(135deg, rgba(191,90,242,0.15), rgba(10,132,255,0.15))",
                  border: active
                    ? "2px solid rgba(255,255,255,0.6)"
                    : "2px solid rgba(255,255,255,0.4)",
                  boxShadow: active
                    ? "0 8px 24px rgba(191,90,242,0.4)"
                    : "0 4px 16px rgba(0,0,0,0.1)",
                  transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  "&:hover": {
                    transform: "scale(1.08)",
                    boxShadow: "0 10px 30px rgba(191,90,242,0.5)",
                  },
                  "&:active": {
                    transform: "scale(0.95)",
                  },
                }}
              >
                <Icon
                  sx={{
                    fontSize: 26,
                    color: active ? "white" : "#bf5af2",
                    transition: "color 0.3s ease",
                  }}
                />
              </Box>
            );
          }

          return (
            <Box
              key={tab.view}
              data-view={tab.view}
              onClick={() => onViewChange(tab.view)}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.25,
                px: 1.75,
                py: 0.75,
                borderRadius: 4,
                cursor: "pointer",
                position: "relative",
                zIndex: 1,
                transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
                "&:active": {
                  transform: "scale(0.92)",
                },
              }}
            >
              <Icon
                sx={{
                  fontSize: 24,
                  color: active ? activeColor : "#8e8e93",
                  transition: "color 0.3s ease",
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  color: active ? activeColor : "#8e8e93",
                  transition: "color 0.3s ease",
                }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
