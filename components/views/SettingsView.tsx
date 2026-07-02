"use client";

import React, { useState } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  TextField,
  Button,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  Analytics as StatsIcon,
  Save as SaveIcon,
  Visibility as EyeIcon,
  VisibilityOff as EyeOffIcon,
  CheckCircle as CheckIcon,
  Key as KeyIcon,
} from "@mui/icons-material";
import StatsView from "./StatsView";

export default function SettingsView() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [showStats, setShowStats] = useState(false);

  React.useEffect(() => {
    const stored = localStorage.getItem("siliconflow_api_key");
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      setSnackbar({ open: true, message: "API key cannot be empty", severity: "error" });
      return;
    }
    localStorage.setItem("siliconflow_api_key", apiKey.trim());
    setSnackbar({ open: true, message: "API key saved!", severity: "success" });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
            color: "#1c1c1e",
          }}
        >
          <SettingsIcon sx={{ color: "#8e8e93" }} />
          Settings
        </Typography>
      </Box>

      {/* AI API Key */}
      <Card className="lg-glass-card" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <KeyIcon sx={{ color: "#bf5af2", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1c1c1e" }}>
              AI API Key
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "#8e8e93", mb: 2 }}>
            SiliconFlow API key for Finly AI. Get yours at{" "}
            <Box component="a" href="https://cloud.siliconflow.com/account/ak" target="_blank" rel="noopener" sx={{ color: "#0a84ff", textDecoration: "none" }}>
              cloud.siliconflow.com
            </Box>
            . Stored locally on your device.
          </Typography>
          <TextField
            fullWidth
            label="SiliconFlow API Key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <KeyIcon sx={{ fontSize: 18, color: "#8e8e93" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowKey(!showKey)} size="small">
                    {showKey ? <EyeOffIcon sx={{ fontSize: 18, color: "#8e8e93" }} /> : <EyeIcon sx={{ fontSize: 18, color: "#8e8e93" }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{ borderRadius: 14 }}
          >
            Save API Key
          </Button>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="lg-glass-card" sx={{ mb: 3 }}>
        <CardContent>
          <Box
            onClick={() => setShowStats(!showStats)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              cursor: "pointer",
              "&:hover": { opacity: 0.8 },
            }}
          >
            <StatsIcon sx={{ color: "#0a84ff", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1c1c1e", flex: 1 }}>
              Spending Analytics
            </Typography>
            <Typography variant="body2" sx={{ color: "#8e8e93" }}>
              {showStats ? "Hide" : "Show"}
            </Typography>
          </Box>
          <Divider sx={{ my: 2 }} />
          {showStats ? (
            <StatsView />
          ) : (
            <Typography variant="body2" sx={{ color: "#8e8e93" }}>
              Tap to view spending charts, category breakdowns, and trends.
            </Typography>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          icon={<CheckIcon />}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
