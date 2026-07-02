"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#0a84ff",
      light: "#64d2ff",
      dark: "#0058d0",
    },
    secondary: {
      main: "#bf5af2",
      light: "#d77bf7",
      dark: "#8e3db8",
    },
    success: {
      main: "#34c759",
    },
    warning: {
      main: "#ff9f0a",
    },
    error: {
      main: "#ff3b30",
    },
    info: {
      main: "#5ac8fa",
    },
    background: {
      default: "#f2f3f7",
      paper: "rgba(255, 255, 255, 0.6)",
    },
    text: {
      primary: "#1c1c1e",
      secondary: "#8e8e93",
    },
    divider: "rgba(0, 0, 0, 0.06)",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
    h4: {
      fontWeight: 800,
      letterSpacing: "-0.02em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    button: {
      fontWeight: 600,
      letterSpacing: 0,
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "transparent",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          textTransform: "none",
          fontWeight: 600,
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        },
        contained: {
          boxShadow: "0 4px 16px rgba(10, 132, 255, 0.25)",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 22px rgba(10, 132, 255, 0.35)",
          },
          "&:active": {
            transform: "translateY(0) scale(0.98)",
          },
        },
        outlined: {
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(255, 255, 255, 0.5)",
          borderColor: "rgba(0, 0, 0, 0.08)",
          "&:hover": {
            background: "rgba(255, 255, 255, 0.7)",
            borderColor: "rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(30px) saturate(180%)",
          WebkitBackdropFilter: "blur(30px) saturate(180%)",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06), inset 0 1px 0 0 rgba(255,255,255,0.5)",
          backgroundImage: "none",
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "20px",
          "&:last-child": { paddingBottom: "20px" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          boxShadow: "0 6px 24px rgba(10,132,255,0.35)",
          transition: "all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "&:hover": {
            transform: "scale(1.06)",
            boxShadow: "0 8px 30px rgba(10,132,255,0.45)",
          },
          "&:active": {
            transform: "scale(0.94)",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          "&:hover": {
            background: "rgba(10,132,255,0.08)",
          },
          "&:active": {
            transform: "scale(0.92)",
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 24 },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          color: "#1c1c1e",
        },
      },
    },
  },
});

export default function ThemeProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
