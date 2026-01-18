"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  List,
  ListItemText,
  ListItemButton,
  Button,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { HistoryEntry } from "../../types/history";
import { getHistoryEntries } from "../../services/historyService";

export default function HistoryPage() {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalAmount = (transactions: any[]) => {
    return transactions.reduce(
      (total, transaction) => total + transaction.amount,
      0
    );
  };

  useEffect(() => {
    loadHistory();
  }, []);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Link href="/" passHref style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: "none" }}
            >
              Back to Budget
            </Button>
          </Link>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <HistoryIcon color="primary" />
            Budget History
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary">
          View and manage your saved budget snapshots
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* History List */}
      {historyEntries.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <HistoryIcon
              sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Budget History Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Save your current budget to create your first history entry
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {historyEntries.map((entry, index) => (
                <React.Fragment key={entry.id}>
                  <ListItemButton
                    component={Link}
                    href={`/history/${entry.id}`}
                    sx={{
                      py: 2,
                      px: 3,
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
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
                          }}
                        >
                          <Typography variant="h6" component="span">
                            {entry.title}
                          </Typography>
                          <Chip
                            label={`${entry.transactions.length} transaction${
                              entry.transactions.length !== 1 ? "s" : ""
                            }`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                          <Chip
                            label={formatCurrency(
                              calculateTotalAmount(entry.transactions)
                            )}
                            size="small"
                            color="secondary"
                            variant="filled"
                          />
                        </Box>
                      }
                      secondary={
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 0.5,
                            }}
                          >
                            <CalendarIcon fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              Created: {format(entry.createdAt, "PPP 'at' p")}
                            </Typography>
                          </Box>
                          {entry.updatedAt.getTime() !==
                            entry.createdAt.getTime() && (
                            <Typography variant="body2" color="text.secondary">
                              • Updated: {format(entry.updatedAt, "PPP 'at' p")}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {index < historyEntries.length - 1 && (
                    <hr
                      style={{
                        margin: 0,
                        border: "none",
                        borderTop: "1px solid",
                        borderTopColor: "divider",
                      }}
                    />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Container>
  );
}
