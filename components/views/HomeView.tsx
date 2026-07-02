"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
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
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction } from "../../types/transaction";
import {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import { Category } from "../../types/category";
import SaveBudgetModal from "../SaveBudgetModal";
import { saveBudgetToHistory } from "../../services/historyService";
import { useCountUp } from "../../lib/useCountUp";
import { formatCurrency } from "../../lib/formatCurrency";

export default function HomeView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saveBudgetModalOpen, setSaveBudgetModalOpen] = useState(false);

  const animatedTotal = useCountUp(totalSpent, 800);

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

  const [formData, setFormData] = useState({
    amount: "",
    description: "",
    category: "",
    date: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: format(new Date(), "yyyy-MM-dd"),
    }));
  }, []);

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error" = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Error loading data",
        "error"
      );
    }
  }, [showSnackbar]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const total = transactions
      .filter((t) => !t.title)
      .reduce((sum, t) => sum + t.amount, 0);
    setTotalSpent(total);
  }, [transactions]);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSaveBudget = async (title: string) => {
    try {
      await saveBudgetToHistory(title);
      const currentTransactions = [...transactions];
      for (const transaction of currentTransactions) {
        if (transaction.id) {
          await deleteTransaction(transaction.id);
        }
      }
      await loadData();
      showSnackbar("Budget saved to history and reset successfully!");
    } catch (error) {
      console.error("Error saving budget to history:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save budget to history";
      showSnackbar(errorMessage, "error");
      throw error;
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
      showSnackbar(
        error instanceof Error ? error.message : "Error saving transaction",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const scrollPosition = window.scrollY;
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await deleteTransaction(id);
      showSnackbar("Transaction deleted successfully");
      setTimeout(() => window.scrollTo(0, scrollPosition), 100);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Error deleting transaction",
        "error"
      );
      await loadData();
    }
  };

  const formatAmountForDisplay = (value: string) => {
    if (!value || value === "") return "";
    const cleanValue = value.replace(/[^\d]/g, "");
    if (cleanValue === "") return "";
    return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parseAmountFromInput = (inputValue: string) =>
    inputValue.replace(/[^\d]/g, "");

  const getFilteredAndGroupedTransactions = () => {
    const tripFiltered = transactions.filter((t) => !t.title);
    const filtered = tripFiltered.filter(
      (t) =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const grouped: { [key: string]: Transaction[] } = {};
    filtered.forEach((t) => {
      const dateKey = format(t.date, "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(t);
    });
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    });
    const sortedDates = Object.keys(grouped).sort((a, b) =>
      b.localeCompare(a)
    );
    return { grouped, sortedDates };
  };

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.color || "#0a84ff";
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: "#1c1c1e" }}>
          Budget Tracker
        </Typography>
        <Typography variant="body2" sx={{ color: "#8e8e93", mt: 0.5 }}>
          Track your travel expenses
        </Typography>
      </Box>

      {/* Total Spent */}
      <Card
        className="lg-glass-card"
        sx={{
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(10,132,255,0.08) 0%, rgba(191,90,242,0.06) 100%)",
        }}
      >
        <CardContent sx={{ textAlign: "center", py: 3 }}>
          <Typography
            variant="caption"
            sx={{
              color: "#8e8e93",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Total Spent
          </Typography>
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              mt: 0.5,
              color: "#1c1c1e",
            }}
          >
            {formatCurrency(animatedTotal)}
          </Typography>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card className="lg-glass-card" sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <ReceiptIcon sx={{ color: "#0a84ff", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#1c1c1e" }}>
              Transactions
            </Typography>
          </Box>

          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "#8e8e93", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            size="small"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ mb: 2 }} />

          {transactions.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 5 }}>
              <ReceiptIcon
                sx={{ fontSize: 48, color: "#8e8e93", opacity: 0.4, mb: 1 }}
              />
              <Typography variant="body2" sx={{ color: "#8e8e93" }}>
                No transactions yet. Tap + to add your first expense.
              </Typography>
            </Box>
          ) : (
            (() => {
              const { grouped, sortedDates } =
                getFilteredAndGroupedTransactions();
              if (sortedDates.length === 0) {
                return (
                  <Typography
                    variant="body2"
                    sx={{ color: "#8e8e93", textAlign: "center", py: 4 }}
                  >
                    No transactions match your search.
                  </Typography>
                );
              }
              return sortedDates.map((dateKey, dateIndex) => {
                const dayTransactions = grouped[dateKey];
                const totalForDay = dayTransactions.reduce(
                  (sum, t) => sum + t.amount,
                  0
                );
                return (
                  <Box
                    key={dateKey}
                    className={`lg-anim-fade-up lg-stagger-${Math.min(dateIndex + 1, 6)}`}
                    sx={{ mb: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          color: "#8e8e93",
                          textTransform: "uppercase",
                          fontSize: "0.72rem",
                          letterSpacing: "0.04em",
                        }}
                      >
                        {format(new Date(dateKey), "d MMM yyyy")}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#1c1c1e" }}
                      >
                        {formatCurrency(totalForDay)}
                      </Typography>
                    </Box>
                    <List sx={{ py: 0 }}>
                      {dayTransactions.map((transaction) => (
                        <ListItem
                          key={transaction.id}
                          sx={{
                            px: 1.5,
                            py: 1.25,
                            mb: 0.75,
                            borderRadius: 3,
                            cursor: "pointer",
                            background: "rgba(255,255,255,0.4)",
                            transition: "all 0.25s ease",
                            "&:hover": {
                              background: "rgba(255,255,255,0.7)",
                              transform: "translateX(2px)",
                            },
                          }}
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
                                    flex: 1,
                                    minWidth: 0,
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 8,
                                      height: 8,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        getCategoryColor(transaction.category),
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 600,
                                      color: "#1c1c1e",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {transaction.description}
                                  </Typography>
                                  <Chip
                                    label={transaction.category}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      borderColor: `${getCategoryColor(transaction.category)}40`,
                                      color: getCategoryColor(transaction.category),
                                      height: 20,
                                      fontSize: "0.68rem",
                                      "& .MuiChip-label": {
                                        fontWeight: 600,
                                        px: 0.75,
                                      },
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 700,
                                    color: "#0a84ff",
                                    flexShrink: 0,
                                    ml: 1,
                                  }}
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
              });
            })()
          )}
        </CardContent>
      </Card>

      {/* Save Budget */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <Button
          variant="outlined"
          size="large"
          startIcon={<SaveIcon />}
          sx={{
            px: 4,
            py: 1.25,
            borderRadius: 16,
            borderColor: "rgba(191,90,242,0.3)",
            color: "#bf5af2",
            "&:hover": {
              borderColor: "rgba(191,90,242,0.5)",
              background: "rgba(191,90,242,0.05)",
            },
          }}
          onClick={() => setSaveBudgetModalOpen(true)}
        >
          Save Budget
        </Button>
      </Box>

      {/* FAB */}
      <Fab
        color="primary"
        aria-label="add"
        className="lg-anim-scale-in"
        sx={{ position: "fixed", bottom: 84, right: 20, zIndex: 999 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Dialog */}
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
          <Box
            sx={{
              pt: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
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
              onFocus={() => setAmountInputFocused(true)}
              onBlur={() => setAmountInputFocused(false)}
              fullWidth
              required
              placeholder="0"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography
                      sx={{ color: "#8e8e93", fontWeight: 600 }}
                    >
                      Rp
                    </Typography>
                  </InputAdornment>
                ),
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
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor:
                            category.color || "#0a84ff",
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
        <DialogActions sx={{ p: 2.5 }}>
          {editingTransaction && (
            <Button
              onClick={() => {
                handleDelete(editingTransaction.id!);
                handleCloseDialog();
              }}
              color="error"
              variant="outlined"
              sx={{ mr: "auto", borderRadius: 14 }}
            >
              Delete
            </Button>
          )}
          <Button onClick={handleCloseDialog} sx={{ borderRadius: 14 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ borderRadius: 14 }}
          >
            {editingTransaction ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

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

      <SaveBudgetModal
        isOpen={saveBudgetModalOpen}
        onClose={() => setSaveBudgetModalOpen(false)}
        onSave={handleSaveBudget}
      />
    </Box>
  );
}
