"use client";

export const dynamic = "force-dynamic";

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
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction, CATEGORIES } from "../types/transaction";
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTotalSpent,
} from "../services/transactionService";

export default function BudgetTracker() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
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
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsData, total] = await Promise.all([
        getTransactions(),
        getTotalSpent(),
      ]);
      setTransactions(transactionsData);
      setTotalSpent(total);
    } catch (error) {
      console.error("Error loading data:", error);
      showSnackbar("Error loading data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSnackbar = (
    message: string,
    severity: "success" | "error" = "success"
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      description: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setEditingTransaction(null);
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
      loadData();
    } catch (error) {
      console.error("Error saving transaction:", error);
      showSnackbar("Error saving transaction", "error");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      try {
        await deleteTransaction(id);
        showSnackbar("Transaction deleted successfully");
        loadData();
      } catch (error) {
        console.error("Error deleting transaction:", error);
        showSnackbar("Error deleting transaction", "error");
      }
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
          <Link href="/analytics" passHref>
            <IconButton color="primary" size="large">
              <AnalyticsIcon />
            </IconButton>
          </Link>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Track your travel expenses
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
            Recent Transactions
          </Typography>
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
            <List>
              {transactions.slice(0, 5).map((transaction) => (
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
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
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
                            color="primary"
                            variant="outlined"
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
                    secondary={format(transaction.date, "MMM dd, yyyy")}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

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
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              fullWidth
              required
              inputProps={{ step: "0.01", min: "0" }}
            />
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
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                label="Category"
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
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
    </Container>
  );
}
