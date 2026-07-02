"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from "@mui/material";

interface SaveBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string) => Promise<void>;
}

export default function SaveBudgetModal({
  isOpen,
  onClose,
  onSave,
}: SaveBudgetModalProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title for your budget");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSave(title.trim());
      setTitle("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save budget");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setTitle("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Save Budget to History</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Budget Title"
          fullWidth
          variant="outlined"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
          placeholder="e.g., Paris Trip 2024, Summer Vacation"
          onKeyPress={(e) => {
            if (e.key === "Enter" && !isLoading) {
              handleSave();
            }
          }}
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2.5 }}>
        <Button onClick={handleClose} disabled={isLoading} sx={{ borderRadius: 14 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isLoading || !title.trim()}
          startIcon={isLoading ? <CircularProgress size={16} /> : null}
          sx={{ borderRadius: 14 }}
        >
          {isLoading ? "Saving..." : "Save Budget"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
