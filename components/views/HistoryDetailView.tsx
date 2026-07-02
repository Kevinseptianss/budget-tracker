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
  Divider,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction, TransactionFormData } from "../../types/transaction";
import { HistoryEntry } from "../../types/history";
import {
  getHistoryEntry,
  updateHistoryTransaction,
  addTransactionToHistory,
  deleteTransactionFromHistory,
} from "../../services/historyService";
import { getCategories } from "../../services/categoryService";
import { Category } from "../../types/category";
import { useCountUp } from "../../lib/useCountUp";
import { formatCurrency } from "../../lib/formatCurrency";

interface HistoryDetailViewProps {
  historyId: string;
  onBack: () => void;
}

export default function HistoryDetailView({
  historyId,
  onBack,
}: HistoryDetailViewProps) {
  const [historyEntry, setHistoryEntry] = useState<HistoryEntry | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [amountInputFocused, setAmountInputFocused] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
      showSnackbar(
        error instanceof Error ? error.message : "Error loading data",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [historyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (historyEntry) {
      const filtered = historyEntry.transactions.filter(
        (t) =>
          t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setTotalSpent(filtered.reduce((sum, t) => sum + t.amount, 0));
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
      showSnackbar(
        error instanceof Error ? error.message : "Error saving transaction",
        "error"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const scrollPosition = window.scrollY;
      if (historyEntry) {
        setHistoryEntry({
          ...historyEntry,
          transactions: historyEntry.transactions.filter(
            (t) => t.id !== id
          ),
        });
      }
      await deleteTransactionFromHistory(historyId, id);
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

  const getCategoryColor = (categoryName: string): string => {
    const category = categories.find((cat) => cat.name === categoryName);
    return category?.color || "#0a84ff";
  };

  const getFilteredAndGroupedTransactions = () => {
    if (!historyEntry) return {};
    const filtered = historyEntry.transactions.filter(
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
    return grouped;
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto", textAlign: "center", py: 8 }}>
        <Typography sx={{ color: "#8e8e93" }}>Loading...</Typography>
      </Box>
    );
  }

  if (!historyEntry) {
    return (
      <Box sx={{ maxWidth: 700, mx: "auto" }}>
        <Alert severity="error">History entry not found</Alert>
      </Box>
    );
  }

  const groupedTransactions = getFilteredAndGroupedTransactions();

  return (
    <Box sx={{ maxWidth: 700, mx: "auto" }}>
      <Box sx={{ mb: 3 }}>
        <Box
          onClick={onBack}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 1,
            cursor: "pointer",
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18, color: "#0a84ff" }} />
          <Typography
            variant="body2"
            sx={{ color: "#0a84ff", fontWeight: 600 }}
          >
            Back to History
          </Typography>
        </Box>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: 800, color: "#1c1c1e" }}
        >
          {historyEntry.title}
        </Typography>
        <Typography variant="body2" sx={{ color: "#8e8e93", mt: 0.5 }}>
          {format(historyEntry.createdAt, "PPP 'at' p")}
          {historyEntry.updatedAt.getTime() !==
            historyEntry.createdAt.getTime() && (
            <> • Updated: {format(historyEntry.updatedAt, "PPP 'at' p")}</>
          )}
        </Typography>
      </Box>

      <Card
        className="lg-glass-card"
        sx={{
          mb: 3,
          background:
            "linear-gradient(135deg, rgba(255,159,10,0.08) 0%, rgba(191,90,242,0.06) 100%)",
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
            variant="h4"
            component="div"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              mt: 0.5,
              color: "#1c1c1e",
            }}
          >
            {formatCurrency(animatedTotal)}
          </Typography>
        </CardContent>
      </Card>

      <Card className="lg-glass-card" sx={{ mb: 3 }}>
        <CardContent sx={{ py: 2 }}>
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
          />
        </CardContent>
      </Card>

      <Card className="lg-glass-card">
        <CardContent sx={{ p: 0 }}>
          {Object.keys(groupedTransactions).length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ReceiptIcon
                sx={{ fontSize: 48, color: "#8e8e93", opacity: 0.4, mb: 1 }}
              />
              <Typography
                variant="h6"
                sx={{ color: "#8e8e93", mb: 0.5 }}
              >
                No transactions found
              </Typography>
              <Typography variant="body2" sx={{ color: "#8e8e93" }}>
                {searchQuery
                  ? "Try adjusting your search"
                  : "Add your first transaction"}
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
                      py: 1.5,
                      borderBottom: "1px solid",
                      borderColor: "rgba(0,0,0,0.05)",
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
                      {format(new Date(dateKey), "EEEE, MMMM d")}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "#8e8e93", fontSize: "0.78rem" }}
                    >
                      {transactions.length} txn
                      {transactions.length !== 1 ? "s" : ""} •{" "}
                      {formatCurrency(
                        transactions.reduce((s, t) => s + t.amount, 0)
                      )}
                    </Typography>
                  </Box>
                  <List>
                    {transactions.map((transaction, index) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem
                          sx={{
                            py: 1.5,
                            px: 3,
                            transition: "all 0.25s ease",
                            "&:hover": { background: "rgba(10,132,255,0.04)" },
                          }}
                          secondaryAction={
                            <Box sx={{ display: "flex", gap: 0.5 }}>
                              <IconButton
                                edge="end"
                                onClick={() => handleOpenDialog(transaction)}
                                size="small"
                              >
                                <EditIcon
                                  sx={{ fontSize: 18, color: "#0a84ff" }}
                                />
                              </IconButton>
                              <IconButton
                                edge="end"
                                onClick={() =>
                                  handleDelete(transaction.id!)
                                }
                                size="small"
                              >
                                <DeleteIcon
                                  sx={{ fontSize: 18, color: "#ff3b30" }}
                                />
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
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    backgroundColor: getCategoryColor(
                                      transaction.category
                                    ),
                                    flexShrink: 0,
                                  }}
                                />
                                <Typography
                                  variant="body1"
                                  sx={{ fontWeight: 600, color: "#1c1c1e" }}
                                >
                                  {transaction.description}
                                </Typography>
                                <Chip
                                  label={transaction.category}
                                  size="small"
                                  variant="outlined"
                                  sx={{
                                    borderColor: `${getCategoryColor(transaction.category)}40`,
                                    color: getCategoryColor(
                                      transaction.category
                                    ),
                                    height: 20,
                                    fontSize: "0.68rem",
                                  }}
                                />
                              </Box>
                            }
                            secondary={
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, color: "#0a84ff" }}
                              >
                                {formatCurrency(transaction.amount)}
                              </Typography>
                            }
                          />
                        </ListItem>
                        {index < transactions.length - 1 && (
                          <Divider
                            component="li"
                            sx={{ borderColor: "rgba(0,0,0,0.04)" }}
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Box>
              ))
          )}
        </CardContent>
      </Card>

      <Fab
        color="primary"
        aria-label="add transaction"
        className="lg-anim-scale-in"
        sx={{ position: "fixed", bottom: 84, right: 20, zIndex: 999 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

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
          <Box
            sx={{
              pt: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
            }}
          >
            <TextField
              label="Amount"
              fullWidth
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
              inputProps={{ inputMode: "numeric" }}
            />
            <TextField
              label="Description"
              fullWidth
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
            <FormControl fullWidth>
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
              fullWidth
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
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
    </Box>
  );
}
