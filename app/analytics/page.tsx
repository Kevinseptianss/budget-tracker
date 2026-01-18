"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { Transaction } from "../../types/transaction";
import { getTransactions } from "../../services/transactionService";
import { getCategories } from "../../services/categoryService";
import { Category } from "../../types/category";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
];

export default function Analytics() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Calculate category spending
  const categoryData = transactions.reduce(
    (acc: { name: string; value: number; category: string }[], transaction) => {
      const existing = acc.find(
        (item) => item.category === transaction.category
      );
      if (existing) {
        existing.value += transaction.amount;
      } else {
        // Get the proper category name from categories list
        const categoryInfo = categories.find(
          (cat) => cat.name === transaction.category
        );
        const displayName = categoryInfo
          ? categoryInfo.name
          : transaction.category;

        acc.push({
          name: displayName,
          value: transaction.amount,
          category: transaction.category,
        });
      }
      return acc;
    },
    []
  );

  // Calculate daily spending for the current month
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map((day) => {
    const dayTransactions = transactions.filter(
      (transaction) =>
        format(transaction.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, "MMM dd"),
      amount: total,
    };
  });

  // Calculate weekly spending
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = daysInWeek.map((day) => {
    const dayTransactions = transactions.filter(
      (transaction) =>
        format(transaction.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, "EEE"),
      amount: total,
    };
  });

  // Calculate daily spending for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  const last30DaysData = last30Days.map((day) => {
    const dayTransactions = transactions.filter(
      (transaction) =>
        format(transaction.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    const total = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
    return {
      date: format(day, "MMM dd"),
      amount: total,
      fullDate: format(day, "yyyy-MM-dd"),
    };
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (transactions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <Link href="/" passHref>
            <IconButton color="primary" sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
          </Link>
          <Typography variant="h4" component="h1">
            Spending Analytics
          </Typography>
        </Box>
        <Alert severity="info">
          No transactions found. Add some transactions to see analytics.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Link href="/" passHref>
          <IconButton color="primary" sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
        </Link>
        <Typography variant="h4" component="h1">
          Spending Analytics
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="analytics tabs"
          >
            <Tab label="Categories" />
            <Tab label="Daily (Month)" />
            <Tab label="Weekly" />
            <Tab label="Last 30 Days" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Spending by Category
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name} ${((entry.percent || 0) * 100).toFixed(
                        0
                      )}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map(
                      (
                        entry: {
                          name: string;
                          value: number;
                          category: string;
                        },
                        index: number
                      ) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      )
                    )}
                  </Pie>
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Daily Spending - {format(now, "MMMM yyyy")}
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                  />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Weekly Spending
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8884d8"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Daily Spending - Last 30 Days
            </Typography>
            <Box sx={{ width: "100%", height: 400 }}>
              <ResponsiveContainer>
                <LineChart data={last30DaysData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={{ fill: "#82ca9d", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "#82ca9d", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Container>
  );
}
