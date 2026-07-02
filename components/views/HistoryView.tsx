"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItemText,
  ListItemButton,
  Chip,
  Alert,
  Divider,
} from "@mui/material";
import {
  History as HistoryIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { HistoryEntry } from "../../types/history";
import { getHistoryEntries } from "../../services/historyService";
import { formatCurrency } from "../../lib/formatCurrency";

interface HistoryViewProps {
  onSelectHistory: (id: string) => void;
}

export default function HistoryView({ onSelectHistory }: HistoryViewProps) {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const entries = await getHistoryEntries();
      setHistoryEntries(entries);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateTotalAmount = (transactions: any[]) => {
    return transactions.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (total: number, transaction: any) => total + transaction.amount,
      0
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", textAlign: "center", py: 8 }}>
        <Typography sx={{ color: "#8e8e93" }}>Loading history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
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
          <HistoryIcon sx={{ color: "#0a84ff" }} />
          Budget History
        </Typography>
        <Typography variant="body2" sx={{ color: "#8e8e93", mt: 0.5 }}>
          View and manage your saved budget snapshots
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {historyEntries.length === 0 ? (
        <Card className="lg-glass-card">
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <HistoryIcon
              sx={{ fontSize: 56, color: "#8e8e93", opacity: 0.4, mb: 1.5 }}
            />
            <Typography
              variant="h6"
              sx={{ color: "#8e8e93", mb: 0.5 }}
            >
              No Budget History Yet
            </Typography>
            <Typography variant="body2" sx={{ color: "#8e8e93" }}>
              Save your current budget to create your first history entry
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card className="lg-glass-card">
          <CardContent sx={{ p: 0 }}>
            <List>
              {historyEntries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <ListItemButton
                    onClick={() => onSelectHistory(entry.id)}
                    sx={{
                      py: 2.5,
                      px: 3,
                      transition: "all 0.25s ease",
                      "&:hover": { background: "rgba(10,132,255,0.05)" },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                            flexWrap: "wrap",
                          }}
                        >
                          <Typography
                            variant="h6"
                            component="span"
                            sx={{ fontWeight: 700, color: "#1c1c1e" }}
                          >
                            {entry.title}
                          </Typography>
                          <Chip
                            label={`${entry.transactions.length} txns`}
                            size="small"
                            variant="outlined"
                            sx={{ height: 22, fontSize: "0.68rem" }}
                          />
                          <Chip
                            label={formatCurrency(
                              calculateTotalAmount(entry.transactions)
                            )}
                            size="small"
                            sx={{
                              background: "rgba(255,159,10,0.1)",
                              color: "#b86a00",
                              height: 22,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <CalendarIcon
                            fontSize="small"
                            sx={{ color: "#8e8e93" }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: "#8e8e93" }}
                          >
                            {format(entry.createdAt, "PPP 'at' p")}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {index < historyEntries.length - 1 && (
                    <Divider sx={{ borderColor: "rgba(0,0,0,0.05)" }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
