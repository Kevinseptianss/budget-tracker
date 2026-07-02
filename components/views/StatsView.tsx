"use client";

import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  CardContent,
  Box,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { Analytics as AnalyticsIcon } from "@mui/icons-material";
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
import { formatCurrency, formatCurrencyShort } from "../../lib/formatCurrency";

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
  "#0a84ff",
  "#bf5af2",
  "#34c759",
  "#ff9f0a",
  "#ff3b30",
  "#5ac8fa",
  "#ffd60a",
  "#ff6482",
];

export default function StatsView() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const loadData = async () => {
    try {
      const [transactionsData, categoriesData] = await Promise.all([
        getTransactions(),
        getCategories(),
      ]);
      setTransactions(transactionsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newValue: number
  ) => {
    setTabValue(newValue);
  };

  const categoryData = transactions.reduce(
    (
      acc: { name: string; value: number; category: string }[],
      transaction
    ) => {
      const existing = acc.find(
        (item) => item.category === transaction.category
      );
      if (existing) {
        existing.value += transaction.amount;
      } else {
        const categoryInfo = categories.find(
          (cat) => cat.name === transaction.category
        );
        acc.push({
          name: categoryInfo ? categoryInfo.name : transaction.category,
          value: transaction.amount,
          category: transaction.category,
        });
      }
      return acc;
    },
    []
  );

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyData = daysInMonth.map((day) => {
    const dayTransactions = transactions.filter(
      (t) => format(t.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, "MMM dd"),
      amount: dayTransactions.reduce((s, t) => s + t.amount, 0),
    };
  });

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const weeklyData = daysInWeek.map((day) => {
    const dayTransactions = transactions.filter(
      (t) => format(t.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, "EEE"),
      amount: dayTransactions.reduce((s, t) => s + t.amount, 0),
    };
  });

  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date;
  });

  const last30DaysData = last30Days.map((day) => {
    const dayTransactions = transactions.filter(
      (t) => format(t.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd")
    );
    return {
      date: format(day, "MMM dd"),
      amount: dayTransactions.reduce((s, t) => s + t.amount, 0),
    };
  });

  if (transactions.length === 0) {
    return (
      <Box sx={{ maxWidth: 900, mx: "auto" }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 3,
            color: "#1c1c1e",
          }}
        >
          <AnalyticsIcon sx={{ color: "#0a84ff" }} />
          Analytics
        </Typography>
        <Alert severity="info">
          No transactions found. Add some transactions to see analytics.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: 3,
          color: "#1c1c1e",
        }}
      >
        <AnalyticsIcon sx={{ color: "#0a84ff" }} />
        Analytics
      </Typography>

      <Card className="lg-glass-card">
        <CardContent sx={{ p: 0 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{ px: 2, pt: 2 }}
          >
            <Tab label="Categories" />
            <Tab label="Daily" />
            <Tab label="Weekly" />
            <Tab label="30 Days" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2, color: "#1c1c1e" }}
            >
              Spending by Category
            </Typography>
            <Box sx={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) =>
                      `${entry.name} ${((entry.percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={120}
                    innerRadius={50}
                    fill="#0a84ff"
                    dataKey="value"
                    paddingAngle={3}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                        stroke="rgba(255,255,255,0.5)"
                        strokeWidth={2}
                      />
                    ))}
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
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2, color: "#1c1c1e" }}
            >
              Daily Spending - {format(now, "MMMM yyyy")}
            </Typography>
            <Box sx={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                  />
                  <XAxis dataKey="date" stroke="#8e8e93" fontSize={12} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    stroke="#8e8e93"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                    cursor={{ fill: "rgba(10,132,255,0.05)" }}
                  />
                  <Bar dataKey="amount" fill="#0a84ff" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2, color: "#1c1c1e" }}
            >
              Weekly Spending
            </Typography>
            <Box sx={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <LineChart data={weeklyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                  />
                  <XAxis dataKey="date" stroke="#8e8e93" fontSize={12} />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    stroke="#8e8e93"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                    cursor={{ stroke: "rgba(0,0,0,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#bf5af2"
                    strokeWidth={3}
                    dot={{ fill: "#bf5af2", r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: 700, mb: 2, color: "#1c1c1e" }}
            >
              Daily Spending - Last 30 Days
            </Typography>
            <Box sx={{ width: "100%", height: 380 }}>
              <ResponsiveContainer>
                <LineChart data={last30DaysData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(0,0,0,0.06)"
                  />
                  <XAxis
                    dataKey="date"
                    interval="preserveStartEnd"
                    tick={{ fontSize: 12, fill: "#8e8e93" }}
                  />
                  <YAxis
                    tickFormatter={formatCurrencyShort}
                    stroke="#8e8e93"
                    fontSize={12}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) =>
                      value ? formatCurrency(value) : "Rp 0"
                    }
                    labelFormatter={(label) => `Date: ${label}`}
                    cursor={{ stroke: "rgba(0,0,0,0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#34c759"
                    strokeWidth={2}
                    dot={{ fill: "#34c759", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
}
