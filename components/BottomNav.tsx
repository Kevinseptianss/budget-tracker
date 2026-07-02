"use client";

import React from "react";
import { Box, Typography } from "@mui/material";
import {
  AccountBalanceWallet as HomeIcon,
  Analytics as AnalyticsIcon,
  Category as CategoryIcon,
  History as HistoryIcon,
  SmartToy as AIIcon,
} from "@mui/icons-material";

export type ViewName = "home" | "stats" | "tags" | "history" | "ai";

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
  { view: "stats", label: "Stats", icon: AnalyticsIcon },
  { view: "ai", label: "AI", icon: AIIcon },
  { view: "tags", label: "Tags", icon: CategoryIcon },
  { view: "history", label: "History", icon: HistoryIcon },
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
                background: active
                  ? isAI
                    ? "rgba(191,90,242,0.14)"
                    : "rgba(10, 132, 255, 0.12)"
                  : "transparent",
                "&:hover": {
                  background: active
                    ? isAI
                      ? "rgba(191,90,242,0.18)"
                      : "rgba(10, 132, 255, 0.15)"
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
                  color: active
                    ? isAI
                      ? "#bf5af2"
                      : "#0a84ff"
                    : "#8e8e93",
                  transition: "color 0.3s ease",
                }}
              />
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  fontWeight: 600,
                  color: active
                    ? isAI
                      ? "#bf5af2"
                      : "#0a84ff"
                    : "#8e8e93",
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
