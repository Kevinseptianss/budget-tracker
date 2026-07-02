"use client";

import React from "react";
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
  { view: "ai", label: "AI", icon: AIIcon },
  { view: "tags", label: "Tags", icon: CategoryIcon },
  { view: "history", label: "History", icon: HistoryIcon },
  { view: "settings", label: "Settings", icon: SettingsIcon },
];

export default function BottomNav({ activeView, onViewChange }: BottomNavProps) {
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
        className="lg-glass"
        sx={{
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderRadius: 28,
          py: 1,
          px: 1,
          gap: 0.25,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeView === tab.view;
          const isAI = tab.view === "ai";
          const isSettings = tab.view === "settings";
          const activeColor = isAI ? "#bf5af2" : isSettings ? "#8e8e93" : "#0a84ff";
          const activeBg = isAI
            ? "rgba(191,90,242,0.14)"
            : isSettings
            ? "rgba(142,142,147,0.14)"
            : "rgba(10, 132, 255, 0.12)";
          return (
            <Box
              key={tab.view}
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
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                background: active ? activeBg : "transparent",
                "&:hover": {
                  background: active
                    ? activeBg.replace("0.14", "0.18")
                    : "rgba(0, 0, 0, 0.04)",
                },
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
