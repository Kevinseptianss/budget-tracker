"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Typography,
  Box,
  Card,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
} from "@mui/material";
import {
  SmartToy as RobotIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Person as PersonIcon,
  DeleteOutline as ClearIcon,
  ArrowBack as BackIcon,
} from "@mui/icons-material";
import { format } from "date-fns";
import { Transaction } from "../../types/transaction";
import {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
} from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import {
  addCategory,
  deleteCategory,
  updateCategory,
} from "../../services/categoryService";
import { Category } from "../../types/category";
import { formatCurrency } from "../../lib/formatCurrency";
import { saveChatMessage, getChatMessages } from "../../services/chatService";
import {
  saveBudgetToHistory,
  getHistoryEntries,
} from "../../services/historyService";
import { HistoryEntry } from "../../types/history";
import ReactMarkdown from "react-markdown";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PendingAction {
  type: string;
  data: Record<string, unknown>;
}

const suggestions = [
  "How much did I spend this week?",
  "Add 25000 for lunch at McDonald's",
  "Which category am I overspending on?",
  "Delete my last transaction",
  "Show me all food expenses",
];

interface AIChatViewProps {
  onBack: () => void;
}

export default function AIChatView({ onBack }: AIChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error" = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const loadContext = useCallback(async () => {
    try {
      const [txData, catData, histData] = await Promise.all([
        getTransactions(),
        getCategories(),
        getHistoryEntries().catch(() => [] as HistoryEntry[]),
      ]);
      setTransactions(txData);
      setCategories(catData);
      setHistory(histData);
    } catch (error) {
      console.error("Error loading context:", error);
    } finally {
      setDataLoaded(true);
    }
  }, []);

  const loadChatHistory = useCallback(async () => {
    try {
      const saved = await getChatMessages();
      if (saved.length > 0) {
        setMessages(
          saved.map((m) => ({ role: m.role, content: m.content }))
        );
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  }, []);

  useEffect(() => {
    loadContext();
    loadChatHistory();
  }, [loadContext, loadChatHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const buildContext = () => {
    const totalSpent = transactions
      .filter((t) => !t.title)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions: transactions
        .filter((t) => !t.title)
        .slice(0, 50)
        .map((t) => ({
          id: t.id || "",
          amount: t.amount,
          description: t.description,
          category: t.category,
          date: format(t.date, "yyyy-MM-dd"),
        })),
      categories: categories.map((c) => ({
        id: c.id || "",
        name: c.name,
        color: c.color || "#0a84ff",
        icon: c.icon || "category",
      })),
      totalSpent,
      currency: "IDR",
      history: history.map((h) => {
        const hTotal = h.transactions.reduce((s, t) => s + t.amount, 0);
        const byCat: Record<string, number> = {};
        h.transactions.forEach((t) => {
          byCat[t.category] = (byCat[t.category] || 0) + t.amount;
        });
        const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
        return {
          id: h.id,
          title: h.title,
          totalSpent: hTotal,
          transactionCount: h.transactions.length,
          createdAt: format(h.createdAt, "yyyy-MM-dd"),
          topCategory: sorted[0]?.[0] || "N/A",
          topCategoryAmount: sorted[0]?.[1] || 0,
        };
      }),
    };
  };

  const executeAction = async (action: PendingAction): Promise<boolean> => {
    try {
      switch (action.type) {
        case "add_transaction": {
          const { amount, description, category, date } = action.data as {
            amount: number;
            description: string;
            category: string;
            date: string;
          };
          await addTransaction({
            amount,
            description,
            category,
            date: new Date(date),
          });
          setTransactions((prev) => [
            {
              id: `temp-${Date.now()}`,
              amount,
              description,
              category,
              date: new Date(date),
              createdAt: new Date(),
            },
            ...prev,
          ]);
          showSnackbar(`${formatCurrency(amount)} added to ${category}`, "success");
          return true;
        }

        case "delete_transaction": {
          const { id } = action.data as { id: string };
          const tx = transactions.find((t) => t.id === id);
          await deleteTransaction(id);
          setTransactions((prev) => prev.filter((t) => t.id !== id));
          showSnackbar(
            tx ? `Deleted: ${tx.description}` : "Transaction deleted",
            "success"
          );
          return true;
        }

        case "update_transaction": {
          const { id, ...updates } = action.data as {
            id: string;
            amount?: number;
            description?: string;
            category?: string;
            date?: string;
          };
          const updateData: Record<string, unknown> = {};
          if (updates.amount !== undefined) updateData.amount = updates.amount;
          if (updates.description !== undefined) updateData.description = updates.description;
          if (updates.category !== undefined) updateData.category = updates.category;
          if (updates.date !== undefined) updateData.date = new Date(updates.date);
          await updateTransaction(id, updateData);
          setTransactions((prev) =>
            prev.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
                    ...(updates.description !== undefined ? { description: updates.description } : {}),
                    ...(updates.category !== undefined ? { category: updates.category } : {}),
                    ...(updates.date !== undefined ? { date: new Date(updates.date) } : {}),
                  }
                : t
            )
          );
          showSnackbar("Transaction updated", "success");
          return true;
        }

        case "get_transactions": {
          const { category, start_date, end_date } = action.data as {
            category?: string;
            start_date?: string;
            end_date?: string;
          };
          let filtered = transactions.filter((t) => !t.title);
          if (category) {
            filtered = filtered.filter(
              (t) => t.category.toLowerCase() === category.toLowerCase()
            );
          }
          if (start_date) {
            const start = new Date(start_date);
            filtered = filtered.filter((t) => t.date >= start);
          }
          if (end_date) {
            const end = new Date(end_date);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter((t) => t.date <= end);
          }
          const total = filtered.reduce((s, t) => s + t.amount, 0);
          const summaryText =
            `Found **${filtered.length}** transaction(s) totaling **Rp ${total.toLocaleString("id-ID")}**` +
            (category ? ` in **${category}**` : "") +
            (start_date || end_date
              ? ` for ${start_date || "start"} to ${end_date || "now"}`
              : "");
          showSnackbar(summaryText.replace(/\*\*/g, ""), "success");
          return true;
        }

        case "get_summary": {
          const total = transactions
            .filter((t) => !t.title)
            .reduce((s, t) => s + t.amount, 0);
          showSnackbar(`Total: Rp ${total.toLocaleString("id-ID")}`, "success");
          return true;
        }

        case "analyze_spending": {
          const current = transactions.filter((t) => !t.title);
          const total = current.reduce((s, t) => s + t.amount, 0);
          const byCat: Record<string, number> = {};
          current.forEach((t) => {
            byCat[t.category] = (byCat[t.category] || 0) + t.amount;
          });
          const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
          const topCat = sorted[0]?.[0] || "N/A";
          const topAmt = sorted[0]?.[1] || 0;
          const pct = total > 0 ? ((topAmt / total) * 100).toFixed(1) : "0";
          const days = new Set(current.map((t) => format(t.date, "yyyy-MM-dd"))).size;
          const avg = days > 0 ? Math.round(total / days) : 0;
          showSnackbar(
            `Analyzed: Rp ${total.toLocaleString("id-ID")} total, ${current.length} txns, Rp ${avg.toLocaleString("id-ID")}/day`,
            "success"
          );
          return true;
        }

        case "save_budget": {
          const { title } = action.data as { title: string };
          await saveBudgetToHistory(title);
          const histData = await getHistoryEntries().catch(() => [] as HistoryEntry[]);
          setHistory(histData);
          showSnackbar(`Budget saved as "${title}"`, "success");
          return true;
        }

        case "get_history": {
          const histData = await getHistoryEntries().catch(() => [] as HistoryEntry[]);
          setHistory(histData);
          const summary = histData
            .map(
              (h) =>
                `${h.title}: Rp ${h.transactions.reduce((s, t) => s + t.amount, 0).toLocaleString("id-ID")}`
            )
            .join(", ");
          showSnackbar(
            histData.length > 0
              ? `${histData.length} budget(s): ${summary}`
              : "No saved budgets found",
            "success"
          );
          return true;
        }

        case "add_category": {
          const { name, color, icon } = action.data as {
            name: string;
            color?: string;
            icon?: string;
          };
          await addCategory({
            name,
            color: color || "#0a84ff",
            icon: icon || "category",
          });
          setCategories((prev) => [
            ...prev,
            {
              id: `temp-${Date.now()}`,
              name,
              color: color || "#0a84ff",
              icon: icon || "category",
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ]);
          showSnackbar(`Category "${name}" created`, "success");
          return true;
        }

        case "delete_category": {
          const { id } = action.data as { id: string };
          const cat = categories.find((c) => c.id === id);
          await deleteCategory(id);
          setCategories((prev) => prev.filter((c) => c.id !== id));
          showSnackbar(
            cat ? `Category "${cat.name}" deleted` : "Category deleted",
            "success"
          );
          return true;
        }

        case "update_category": {
          const { id, ...updates } = action.data as {
            id: string;
            name?: string;
            color?: string;
            icon?: string;
          };
          const updateData: Record<string, unknown> = {};
          if (updates.name !== undefined) updateData.name = updates.name;
          if (updates.color !== undefined) updateData.color = updates.color;
          if (updates.icon !== undefined) updateData.icon = updates.icon;
          await updateCategory(id, updateData);
          setCategories((prev) =>
            prev.map((c) =>
              c.id === id
                ? {
                    ...c,
                    ...(updates.name !== undefined ? { name: updates.name } : {}),
                    ...(updates.color !== undefined ? { color: updates.color } : {}),
                    ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
                  }
                : c
            )
          );
          showSnackbar("Category updated", "success");
          return true;
        }

        default:
          console.warn("Unknown action type:", action.type);
          return false;
      }
    } catch (error) {
      console.error("Error executing action:", error);
      showSnackbar(
        error instanceof Error ? error.message : "Action failed",
        "error"
      );
      return false;
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      await saveChatMessage({ role: "user", content: text });

      const apiMessages = newMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const storedKey =
        typeof window !== "undefined"
          ? localStorage.getItem("siliconflow_api_key")
          : null;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          context: buildContext(),
          apiKey: storedKey || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get AI response");
      }

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.reply,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      await saveChatMessage({ role: "assistant", content: data.reply });

      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          await executeAction(action);
        }
        await loadContext();
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errContent =
        error instanceof Error
          ? `Sorry, something went wrong: ${error.message}. Please try again.`
          : "Sorry, I had trouble connecting. Please try again in a moment.";
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: errContent,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input);
  };

  const handleSuggestion = (text: string) => {
    sendMessage(text);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const hasMessages = messages.length > 0;

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", height: "calc(100vh - 40px)", display: "flex", flexDirection: "column" }}>
      {/* Title bar with back button */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <IconButton
          onClick={onBack}
          size="small"
          sx={{
            flexShrink: 0,
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(0,0,0,0.06)",
            "&:hover": { background: "rgba(10,132,255,0.08)" },
          }}
        >
          <BackIcon sx={{ fontSize: 20, color: "#0a84ff" }} />
        </IconButton>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flex: 1,
            justifyContent: "center",
            position: "relative",
          }}
        >
          <RobotIcon sx={{ fontSize: 22, color: "#0a84ff" }} />
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: "#1c1c1e",
            }}
          >
            Finly AI
          </Typography>
          {hasMessages && (
            <IconButton
              onClick={handleClearChat}
              size="small"
              sx={{ position: "absolute", right: 0 }}
            >
              <ClearIcon sx={{ fontSize: 20, color: "#8e8e93" }} />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Chat area */}
      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          pb: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {/* Empty state — big robot logo */}
        {!hasMessages && !loading && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
              textAlign: "center",
            }}
          >
            <Box
              className="lg-anim-scale-in"
              sx={{
                width: 96,
                height: 96,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(10,132,255,0.15) 0%, rgba(191,90,242,0.15) 100%)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 8px 32px rgba(10,132,255,0.12)",
              }}
            >
              <RobotIcon
                sx={{
                  fontSize: 56,
                  color: "#0a84ff",
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: "#1c1c1e",
                  mb: 0.5,
                }}
              >
                Hey, I&apos;m Finly
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "#8e8e93", maxWidth: 300 }}
              >
                Your smart budget assistant. Ask me anything about your
                spending, or tell me to add an expense.
              </Typography>
            </Box>

            {/* Suggestion chips */}
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: "center",
                maxWidth: 400,
                mt: 1,
              }}
            >
              {suggestions.map((s) => (
                <Chip
                  key={s}
                  label={s}
                  onClick={() => handleSuggestion(s)}
                  sx={{
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.06)",
                    color: "#1c1c1e",
                    fontWeight: 500,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    "&:hover": {
                      background: "rgba(10,132,255,0.08)",
                      borderColor: "rgba(10,132,255,0.2)",
                      transform: "translateY(-1px)",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Chat bubbles */}
        {messages.map((msg, index) => (
          <Box
            key={index}
            className="lg-anim-fade-up"
            sx={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 1,
              alignItems: "flex-start",
            }}
          >
            {/* Avatar */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 3,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  msg.role === "assistant"
                    ? "linear-gradient(135deg, rgba(10,132,255,0.15), rgba(191,90,242,0.15))"
                    : "rgba(0,0,0,0.06)",
              }}
            >
              {msg.role === "assistant" ? (
                <RobotIcon sx={{ fontSize: 20, color: "#0a84ff" }} />
              ) : (
                <PersonIcon sx={{ fontSize: 20, color: "#8e8e93" }} />
              )}
            </Box>

            {/* Bubble */}
            <Box
              sx={{
                maxWidth: "78%",
                px: 2,
                py: 1.25,
                borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                background:
                  msg.role === "user"
                    ? "linear-gradient(135deg, #0a84ff, #0066d6)"
                    : "rgba(255,255,255,0.6)",
                border:
                  msg.role === "assistant"
                    ? "1px solid rgba(255,255,255,0.6)"
                    : "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  color: msg.role === "user" ? "white" : "#1c1c1e",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.role === "user" ? (
                  msg.content
                ) : (
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => (
                        <Box component="span" sx={{ display: "block", mb: 0.5, "&:last-child": { mb: 0 } }}>
                          {children}
                        </Box>
                      ),
                      strong: ({ children }) => (
                        <Box component="strong" sx={{ fontWeight: 700, color: "#1c1c1e" }}>
                          {children}
                        </Box>
                      ),
                      ul: ({ children }) => (
                        <Box component="ul" sx={{ pl: 2, mb: 0.5, mt: 0.25 }}>
                          {children}
                        </Box>
                      ),
                      li: ({ children }) => (
                        <Box component="li" sx={{ mb: 0.25, fontSize: "0.9rem", lineHeight: 1.5, color: "#1c1c1e" }}>
                          {children}
                        </Box>
                      ),
                      h1: ({ children }) => (
                        <Box component="strong" sx={{ display: "block", fontWeight: 700, fontSize: "1rem", mb: 0.5, color: "#1c1c1e" }}>
                          {children}
                        </Box>
                      ),
                      h2: ({ children }) => (
                        <Box component="strong" sx={{ display: "block", fontWeight: 700, fontSize: "1rem", mb: 0.5, color: "#1c1c1e" }}>
                          {children}
                        </Box>
                      ),
                      h3: ({ children }) => (
                        <Box component="strong" sx={{ display: "block", fontWeight: 700, fontSize: "0.95rem", mb: 0.5, color: "#1c1c1e" }}>
                          {children}
                        </Box>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                )}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Loading bubble */}
        {loading && (
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 3,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                  "linear-gradient(135deg, rgba(10,132,255,0.15), rgba(191,90,242,0.15))",
              }}
            >
              <RobotIcon sx={{ fontSize: 20, color: "#0a84ff" }} />
            </Box>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: "18px 18px 18px 4px",
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <CircularProgress size={16} sx={{ color: "#0a84ff" }} />
              <Typography sx={{ fontSize: "0.85rem", color: "#1c1c1e" }}>
                Thinking...
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* Input bar */}
      <Box
        sx={{
          flexShrink: 0,
          pt: 1.5,
        }}
      >
        <Card
          className="lg-glass"
          sx={{
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            pl: 1.5,
            pr: 0.5,
            py: 0.5,
          }}
        >
          <TextField
            fullWidth
            variant="standard"
            placeholder={dataLoaded ? "Ask Finly anything..." : "Loading your budget..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading || !dataLoaded}
            multiline
            maxRows={3}
            InputProps={{
              disableUnderline: true,
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.5 }}>
                  <RobotIcon sx={{ fontSize: 22, color: "#0a84ff" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleSend}
                    disabled={!input.trim() || loading || !dataLoaded}
                    sx={{
                      background: input.trim() && !loading
                        ? "linear-gradient(135deg, #0a84ff, #0066d6)"
                        : "rgba(0,0,0,0.05)",
                      color: input.trim() && !loading ? "white" : "#8e8e93",
                      width: 40,
                      height: 40,
                      transition: "all 0.25s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, #0a7eed, #0058c4)",
                        transform: "scale(1.05)",
                      },
                      "&:disabled": {
                        background: "rgba(0,0,0,0.05)",
                      },
                    }}
                  >
                    <SendIcon sx={{ fontSize: 20 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiInputBase-input": {
                fontSize: "0.9rem",
                color: "#1c1c1e",
                padding: "8px 0",
              },
            }}
          />
        </Card>
        <Typography
          sx={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: "#8e8e93",
            mt: 1,
            opacity: 0.7,
          }}
        >
          Finly can add transactions & analyze your spending
        </Typography>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
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
