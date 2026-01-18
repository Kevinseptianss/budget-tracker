"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Fab,
  Box,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction, TransactionFormData } from "../../../types/transaction";
import { HistoryEntry } from "../../../types/history";
import {
  getHistoryEntry,
  updateHistoryTransaction,
  addTransactionToHistory,
  deleteTransactionFromHistory,
} from "../../../services/historyService";
import { getCategories } from "../../../services/categoryService";
import { Category } from "../../../types/category";

export default function HistoryDetailPage() {
  const params = useParams();
  const historyId = params.id as string;

  const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Form state
  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    // Initialize date when component mounts on client
    setFormData((prev) => ({
      ...prev,
      date: format(new Date(), "yyyy-MM-dd"),
    }));
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [historyData, categoriesData] = await Promise.all([
        getHistoryEntry(historyId),
        getCategories(),
      ]);

      setHistoryEntry(historyData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error loading data";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [historyId]);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate filtered transactions and total whenever transactions change
  useEffect(() => {
    if (historyEntry) {
      const filteredTransactions = historyEntry.transactions.filter(
        (transaction) =>
          transaction.description
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
      );

      const total = filteredTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );
      setTotalSpent(total);
    }
  }, [historyEntry, searchQuery]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleOpenDialog = (transaction?: Transaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setFormData({
        amount: transaction.amount.toString(),
        description: transaction.description,
        category: transaction.category,
        date: format(transaction.date, "yyyy-MM-dd"),
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      description: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setEditingTransaction(null);
    setAmountInputFocused(false);
  };

  const handleSubmit = async () => {
    if (!formData.amount || !formData.description || !formData.category) {
      showSnackbar("Please fill in all fields", "error");
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      showSnackbar("Please enter a valid amount", "error");
      return;
    }

    try {
      const transactionData: TransactionFormData = {
        amount,
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date),
      };

      if (editingTransaction) {
        await updateHistoryTransaction(
          historyId,
          editingTransaction.id!,
          transactionData
        );
        showSnackbar("Transaction updated successfully");
      } else {
        await addTransactionToHistory(historyId, transactionData);
        showSnackbar("Transaction added successfully");
      }

      handleCloseDialog();
      await loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error saving transaction";
      showSnackbar(errorMessage, "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      // Save current scroll position
      const scrollPosition = window.scrollY;

      // Optimistically update the history entry
      if (historyEntry) {
        setHistoryEntry({
          ...historyEntry,
          transactions: historyEntry.transactions.filter((t) => t.id !== id),
        });
      }

      await deleteTransactionFromHistory(historyId, id);
      showSnackbar("Transaction deleted successfully");

      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 100);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error deleting transaction";
      showSnackbar(errorMessage, "error");
      // Restore the transaction in UI if deletion failed
      await loadData();
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

  const formatAmountForDisplay = (value: string) => {
    if (!value || value === "") return "";
    // Remove any existing formatting and parse
    const cleanValue = value.replace(/[^\d]/g, "");
    if (cleanValue === "") return "";
    // Format with thousand separators (Indonesian style with dots)
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseAmountFromInput = (inputValue: string) => {
    // Remove all non-numeric characters
    return inputValue.replace(/[^\d]/g, "");
  };

  const getFilteredAndGroupedTransactions = () => {
    if (!historyEntry) return {};

    // Filter by search query
    const filtered = historyEntry.transactions.filter(
      (transaction) =>
        transaction.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group by date
    const grouped: { [key: string]: Transaction[] } = {};
    filtered.forEach((transaction) => {
      const dateKey = format(transaction.date, "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    // Sort transactions within each group by createdAt (latest first)
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime; // Latest first
      });
    });

    return grouped;
  };

  if (loading) {
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

  if (!historyEntry) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">History entry not found</Alert>
      </Container>
    );
  }

  const groupedTransactions = getFilteredAndGroupedTransactions();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Link href="/history" passHref style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<ArrowBackIcon />}
              sx={{ textTransform: "none" }}
            >
              Back to History
            </Button>
          </Link>
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <HistoryIcon color="primary" />
            {historyEntry.title}
          </Typography>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Managing transactions for this saved budget
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Created: {format(historyEntry.createdAt, "PPP 'at' p")}
          {historyEntry.updatedAt.getTime() !==
            historyEntry.createdAt.getTime() && (
            <> • Updated: {format(historyEntry.updatedAt, "PPP 'at' p")}</>
          )}
        </Typography>
      </Box>

      {/* Total Spent Card */}
      <Card
        sx={{
          mb: 3,
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
        }}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <TrendingUpIcon sx={{ fontSize: 40, mb: 1, opacity: 0.8 }} />
          <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
            {formatCurrency(totalSpent)}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.8 }}>
            Total Spent
          </Typography>
        </CardContent>
      </Card>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <SearchIcon sx={{ mr: 1, color: "action.active" }} />
              ),
            }}
          />
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          {Object.keys(groupedTransactions).length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ReceiptIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No transactions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first transaction to this budget"}
              </Typography>
            </Box>
          ) : (
            Object.entries(groupedTransactions)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, transactions]) => (
                <Box key={dateKey}>
                  <Box
                    sx={{
                      px: 3,
                      py: 1,
                      backgroundColor: "background.paper",
                      borderBottom: 1,
                      borderColor: "divider",
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                      {format(new Date(dateKey), "EEEE, MMMM d, yyyy")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {transactions.length} transaction
                      {transactions.length !== 1 ? "s" : ""} •{" "}
                      {formatCurrency(
                        transactions.reduce((sum, t) => sum + t.amount, 0)
                      )}
                    </Typography>
                  </Box>
                  <List>
                    {transactions.map((transaction, index) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem
                          sx={{
                            py: 2,
                            px: 3,
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                          secondaryAction={
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <IconButton
                                edge="end"
                                onClick={() => handleOpenDialog(transaction)}
                                color="primary"
                                size="small"
                              >
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() => handleDelete(transaction.id!)}
                                color="error"
                                size="small"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
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
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: "medium" }}
                                >
                                  {transaction.description}
                                </Typography>
                                <Chip
                                  label={transaction.category}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                {formatCurrency(transaction.amount)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < transactions.length - 1 && (
                          <Divider component="li" />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ))
          )}
        </CardContent>
      </Card>

      {/* Add Transaction FAB */}
      <Fab
        color="primary"
        aria-label="add transaction"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Transaction Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTransaction ? "Edit Transaction" : "Add Transaction"}
        </DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Amount"
            fullWidth
            variant="outlined"
            value={
              amountInputFocused
                ? formData.amount
                : formatAmountForDisplay(formData.amount)
            }
            onChange={(e) => {
              const rawValue = parseAmountFromInput(e.target.value);
              setFormData({ ...formData, amount: rawValue });
            }}
            onFocus={() => setAmountInputFocused(true)}
            onBlur={() => setAmountInputFocused(false)}
            placeholder="0"
            inputProps={{ inputMode: "numeric" }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category}
              label="Category"
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.name}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Date"
            type="date"
            fullWidth
            variant="outlined"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingTransaction ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
