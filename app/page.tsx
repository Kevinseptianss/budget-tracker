"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
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
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction } from "../types/transaction";
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
import { getCategories } from "../services/categoryService";
import { Category } from "../types/category";
import SaveBudgetModal from "../components/SaveBudgetModal";
import { saveBudgetToHistory } from "../services/historyService";

export default function BudgetTracker() {
  const [currentTripTitle, setCurrentTripTitle] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveBudgetModalOpen, setSaveBudgetModalOpen] = useState(false);

  // Get trip parameter from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const trip = urlParams.get("trip");
      setCurrentTripTitle(trip);
    }
  }, []);
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
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);

      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error loading data";
      showSnackbar(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate filtered transactions and total whenever transactions or currentTripTitle changes
  useEffect(() => {
    const filteredTransactions = currentTripTitle
      ? transactions.filter((t) => t.title === currentTripTitle)
      : transactions.filter((t) => !t.title);

    const total = filteredTransactions.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    setTotalSpent(total);
  }, [transactions, currentTripTitle]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSaveBudget = async (title: string) => {
    try {
      // Save current budget to history
      await saveBudgetToHistory(title);

      // Delete all current transactions to start fresh
      const currentTransactions = [...transactions];
      for (const transaction of currentTransactions) {
        if (transaction.id) {
          await deleteTransaction(transaction.id);
        }
      }

      // Reload data to reflect empty state
      await loadData();

      showSnackbar("Budget saved to history and reset successfully!");
    } catch (error) {
      console.error("Error saving budget to history:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save budget to history";
      showSnackbar(errorMessage, "error");
      throw error; // Re-throw to let the modal handle it
    }
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
      const transactionData = {
        amount,
        description: formData.description,
        category: formData.category,
        date: new Date(formData.date),
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id!, transactionData);
        showSnackbar("Transaction updated successfully");
      } else {
        await addTransaction(transactionData);
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

      // Optimistically remove from UI immediately
      setTransactions((prev) => prev.filter((t) => t.id !== id));

      await deleteTransaction(id);
      showSnackbar("Transaction deleted successfully");

      // No need to reload data after successful deletion - optimistic update is sufficient
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
    // First filter by trip title: show only transactions without title, or with current trip title
    let tripFiltered = transactions;
    if (currentTripTitle) {
      tripFiltered = transactions.filter((t) => t.title === currentTripTitle);
    } else {
      tripFiltered = transactions.filter((t) => !t.title);
    }

    // Then filter by search query
    const filtered = tripFiltered.filter(
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

    // Sort dates in descending order (most recent first)
    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    return { grouped, sortedDates };
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.color || "#1976d2"; // Default to primary blue if no color found
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ pb: 10 }}>
      {/* Header */}
      <Box sx={{ py: 3, textAlign: "center" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <WalletIcon color="primary" />
            Budget Tracker
          </Typography>

          {/* Navigation Buttons */}
          <Box sx={{ display: "flex", gap: 1 }}>
            {currentTripTitle && (
              <Link href="/" passHref style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  sx={{ textTransform: "none" }}
                >
                  ← Back to Current
                </Button>
              </Link>
            )}
            <Link href="/analytics" passHref style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Analytics
              </Button>
            </Link>
            <Link
              href="/categories"
              passHref
              style={{ textDecoration: "none" }}
            >
              <Button
                variant="outlined"
                color="primary"
                size="small"
                sx={{ textTransform: "none" }}
              >
                Categories
              </Button>
            </Link>
            <Link href="/history" passHref style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                sx={{ textTransform: "none" }}
              >
                History
              </Button>
            </Link>
          </Box>
        </Box>

        <Typography variant="body1" color="text.secondary">
          {currentTripTitle
            ? `Viewing transactions for: ${currentTripTitle}`
            : "Track your travel expenses"}
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
        <CardContent sx={{ textAlign: "center", py: 3 }}>
          <TrendingUpIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography
            variant="h3"
            component="div"
            sx={{ fontWeight: "bold", mb: 1 }}
          >
            {formatCurrency(totalSpent)}
          </Typography>
          <Typography variant="h6">Total Spent</Typography>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <ReceiptIcon />
            {currentTripTitle
              ? `Trip: ${currentTripTitle}`
              : "Current Transactions"}
          </Typography>

          {/* Search Box */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search transactions by description or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: "action.active", mr: 1 }} />
                ),
              }}
              size="small"
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {transactions.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", py: 4 }}
            >
              No transactions yet. Add your first expense!
            </Typography>
          ) : (
            (() => {
              const { grouped, sortedDates } =
                getFilteredAndGroupedTransactions();
              const hasResults = sortedDates.length > 0;

              return !hasResults ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", py: 4 }}
                >
                  No transactions match your search.
                </Typography>
              ) : (
                sortedDates.map((dateKey) => {
                  const dayTransactions = grouped[dateKey];
                  const totalForDay = dayTransactions.reduce(
                    (sum, t) => sum + t.amount,
                    0
                  );

                  return (
                    <Box key={dateKey} sx={{ mb: 3 }}>
                      {/* Date Header */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 1,
                          pb: 1,
                          borderBottom: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: "bold", color: "primary.main" }}
                        >
                          {format(new Date(dateKey), "d MMMM yyyy")}
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold", color: "primary.main" }}
                        >
                          {formatCurrency(totalForDay)}
                        </Typography>
                      </Box>

                      {/* Transactions for this date */}
                      <List sx={{ py: 0 }}>
                        {dayTransactions.map((transaction) => (
                          <ListItem
                            key={transaction.id}
                            sx={{ px: 0, cursor: "pointer" }}
                            onClick={() => handleOpenDialog(transaction)}
                          >
                            <ListItemText
                              primary={
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                  }}
                                >
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle1"
                                      sx={{ fontWeight: "medium" }}
                                    >
                                      {transaction.description}
                                    </Typography>
                                    <Chip
                                      label={transaction.category}
                                      size="small"
                                      variant="outlined"
                                      sx={{
                                        borderColor: getCategoryColor(
                                          transaction.category
                                        ),
                                        color: getCategoryColor(
                                          transaction.category
                                        ),
                                        "& .MuiChip-label": {
                                          fontWeight: "medium",
                                        },
                                      }}
                                    />
                                  </Box>
                                  <Typography
                                    variant="h6"
                                    color="primary"
                                    sx={{ fontWeight: "bold" }}
                                  >
                                    {formatCurrency(transaction.amount)}
                                  </Typography>
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  );
                })
              );
            })()
          )}
        </CardContent>
      </Card>

      {/* Save Budget Button */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3, mb: 2 }}>
        <Button
          variant="contained"
          color="secondary"
          size="large"
          sx={{ textTransform: "none", px: 4, py: 1.5 }}
          onClick={() => setSaveBudgetModalOpen(true)}
        >
          Save Budget
        </Button>
      </Box>

      {/* Add Transaction FAB */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          zIndex: 1000,
        }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Transaction Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingTransaction ? "Edit Transaction" : "Add Transaction"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              fullWidth
              required
              multiline
              rows={2}
            />
            <TextField
              label="Amount (Rp)"
              type="text"
              value={
                amountInputFocused
                  ? formData.amount
                  : formatAmountForDisplay(formData.amount)
              }
              onChange={(e) => {
                const rawValue = parseAmountFromInput(e.target.value);
                setFormData({ ...formData, amount: rawValue });
              }}
              onFocus={() => {
                setAmountInputFocused(true);
              }}
              onBlur={() => {
                setAmountInputFocused(false);
              }}
              fullWidth
              required
              placeholder="0"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>Rp</Typography>,
              }}
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.name}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: category.color || "#1976d2",
                          flexShrink: 0,
                        }}
                      />
                      {category.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          {editingTransaction && (
            <Button
              onClick={() => {
                handleDelete(editingTransaction.id!);
                handleCloseDialog();
              }}
              color="error"
              variant="outlined"
              sx={{ mr: "auto" }}
            >
              Delete
            </Button>
          )}
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

      {/* Save Budget Modal */}
      <SaveBudgetModal
        isOpen={saveBudgetModalOpen}
        onClose={() => setSaveBudgetModalOpen(false)}
        onSave={handleSaveBudget}
      />
    </Container>
  );
}
