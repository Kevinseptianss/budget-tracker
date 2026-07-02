import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_KEY = process.env.SILICONFLOW_API_KEY;
const API_URL =
  process.env.SILICONFLOW_API_URL ||
  "https://api.siliconflow.com/v1/chat/completions";
const MODEL = process.env.SILICONFLOW_MODEL || "deepseek-ai/DeepSeek-V4-Flash";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface BudgetContext {
  transactions: {
    id: string;
    amount: number;
    description: string;
    category: string;
    date: string;
  }[];
  categories: { id: string; name: string; color: string; icon: string }[];
  totalSpent: number;
  currency: string;
  history: {
    id: string;
    title: string;
    totalSpent: number;
    transactionCount: number;
    createdAt: string;
    topCategory: string;
    topCategoryAmount: number;
  }[];
}

function buildSystemPrompt(context: BudgetContext): string {
  const txList = context.transactions
    .slice(0, 50)
    .map(
      (t) =>
        `- ID:${t.id} | ${t.date} | ${t.description} | ${t.category} | Rp ${t.amount.toLocaleString("id-ID")}`
    )
    .join("\n");

  const catList = context.categories
    .map((c) => `${c.name} (ID:${c.id})`)
    .join(", ");

  const byCategory = context.transactions.reduce(
    (acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    },
    {} as Record<string, number>
  );

  const categoryBreakdown = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `Rp ${amt.toLocaleString("id-ID")} — ${cat}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  return `You are Finly, a smart AI budget assistant inside a budget tracker app. You are friendly, concise, and helpful.

You have access to the user's real-time budget data below. Use it to answer questions, analyze spending, give efficiency tips, and help manage finances.

## Current Budget Data
- Currency: Indonesian Rupiah (IDR), always formatted as "Rp X.XXX" with dots as thousand separators (e.g. Rp 25.000, Rp 1.500.000)
- Total Spent: Rp ${context.totalSpent.toLocaleString("id-ID")}
- Number of transactions: ${context.transactions.length}
- Today's date: ${today}

### Available Categories
${catList}

### Spending by Category
${categoryBreakdown || "No spending yet"}

### Recent Transactions (up to 50, with IDs)
${txList || "No transactions yet"}

### Saved Budget History
${context.history.length > 0
    ? context.history
        .map(
          (h) =>
            `- ID:${h.id} | "${h.title}" | Total: Rp ${h.totalSpent.toLocaleString("id-ID")} | ${h.transactionCount} txns | Top: ${h.topCategory} (Rp ${h.topCategoryAmount.toLocaleString("id-ID")}) | Saved: ${h.createdAt}`
        )
        .join("\n")
    : "No saved budgets yet"}

## Your Capabilities
1. **Chat about budget**: Answer questions about spending, patterns, tips
2. **Add transactions**: Use add_transaction tool when user wants to record an expense
3. **Delete transactions**: Use delete_transaction tool when user wants to remove/delete a transaction (you have the IDs above)
4. **Update transactions**: Use update_transaction tool when user wants to edit/change a transaction
5. **Get transactions**: Use get_transactions tool to retrieve/filter transactions by category or date range
6. **Get summary**: Use get_summary tool to get spending summary and analysis
7. **Analyze spending**: Use analyze_spending tool for deep analysis — trends, efficiency, comparisons, recommendations
8. **Add category**: Use add_category tool to create a new category if it doesn't exist yet
9. **Delete category**: Use delete_category tool to remove a category by ID (IDs shown in Available Categories above)
10. **Update category**: Use update_category tool to rename or change color/icon of a category
11. **Save budget**: Use save_budget tool to save current transactions as a named history entry (e.g. "save this as Summer Holiday 2025")
12. **Get history**: Use get_history tool to retrieve past saved budgets so you can answer questions like "how much did I spend last holiday?"
13. **Budget advice**: Suggest budgets, warn about overspending, recommend category limits

## Tools
You have these tools available. ALWAYS use them when the user asks for these actions:

### add_transaction
- When: user wants to add/record/log an expense
- Extract: amount (integer IDR), description, category, date (YYYY-MM-DD, default today)
- If the user's description doesn't fit any existing category, FIRST call add_category to create one, THEN call add_transaction with the new category name

### delete_transaction
- When: user wants to delete/remove a transaction
- You need: the transaction ID (find it from the transaction list above by matching description/category/amount)
- If multiple match, ask the user which one OR pick the most recent

### update_transaction
- When: user wants to edit/change a transaction (e.g. "change the amount to X", "rename it to Y")
- You need: the transaction ID + the fields to update
- Only include fields the user wants to change

### get_transactions
- When: user wants to see/list/filter transactions (e.g. "show me food expenses", "what did I spend this week")
- Optional filters: category name, start_date, end_date

### get_summary
- When: user wants a summary/analysis/overview of their spending
- Returns: total spent, breakdown by category, transaction count, insights

### add_category
- When: user mentions an expense that doesn't fit any existing category, or asks to create a new category
- You need: name (required), color (hex, optional), icon (Material-UI name, optional)
- After creating, use the new category name in add_transaction

### delete_category
- When: user wants to delete/remove a category
- You need: the category ID (find it from the Available Categories list above by matching name)

### update_category
- When: user wants to rename a category or change its color/icon
- You need: the category ID + fields to update (name, color, icon)

### analyze_spending
- When: user asks for analysis, efficiency, trends, tips, insights, comparison, "how am I doing"
- Returns: deep analysis — spending trends, category efficiency, top categories, daily average, savings tips, comparison to previous periods
- This is the tool for ANY analytical question about spending patterns

### save_budget
- When: user wants to save/archive the current budget as a named history entry (e.g. "save this as Bali Trip", "simpan budget ini sebagai liburan")
- You need: a title/name for the budget
- After saving, the current transactions remain but a snapshot is stored in history

### get_history
- When: user asks about past budgets, previous trips, historical spending (e.g. "how much did I spend last holiday?", "berapa total belanja liburan kemarin?")
- Returns: all saved budget history entries with totals, top categories, and dates
- Use this to answer questions about past spending periods

## Guidelines
- Be conversational and warm, like a smart friend
- Keep responses short and scannable
- Use **bold** for key numbers and important points
- Use bullet lists (-) for multiple items
- Use line breaks between sections for readability
- When giving analysis, use numbers and percentages
- If the user asks to add/delete/update something, call the tool IMMEDIATELY — don't just describe it
- To delete: find the matching transaction ID from the list above, then call delete_transaction
- Suggest the best matching category if the user doesn't specify one
- Proactively warn if spending in a category seems high
- Always format currency as "Rp X.XXX" with dots as thousand separators (e.g. "Rp 25.000", "Rp 1.500.000")
- Never use any other currency format
- If you don't have enough data, say so honestly
- Do NOT use # headings, use **bold** instead for section titles
- Do NOT use horizontal rules (---)
- Keep formatting clean and mobile-friendly — short lines, no long paragraphs
- The user may speak Indonesian or English — respond in the same language they use
- When you call tools, you will get the results back in the next message. Use those results to give a complete answer.
- You can call multiple tools in one response if needed (e.g. delete a transaction AND get history)
- After receiving tool results, ALWAYS give a final answer — never leave the user hanging
- When answering about history, use the actual data from the results to give specific numbers`;
}

const tools = [
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Add a new transaction/expense to the budget tracker",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "integer",
            description: "Amount in IDR (Indonesian Rupiah), no decimals",
          },
          description: {
            type: "string",
            description: "Short description of the expense",
          },
          category: {
            type: "string",
            description: "Category name for the transaction",
          },
          date: {
            type: "string",
            description: "Date in YYYY-MM-DD format",
          },
        },
        required: ["amount", "description", "category", "date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_transaction",
      description:
        "Delete/remove a transaction by its ID. Find the ID from the transaction list in context.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The transaction ID to delete",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_transaction",
      description:
        "Update/edit an existing transaction by its ID. Only include fields to change.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The transaction ID to update",
          },
          amount: {
            type: "integer",
            description: "New amount in IDR (optional)",
          },
          description: {
            type: "string",
            description: "New description (optional)",
          },
          category: {
            type: "string",
            description: "New category name (optional)",
          },
          date: {
            type: "string",
            description: "New date in YYYY-MM-DD format (optional)",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_transactions",
      description:
        "Retrieve/filter transactions by category or date range. Use when user asks to see or filter transactions.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Filter by category name (optional)",
          },
          start_date: {
            type: "string",
            description: "Start date YYYY-MM-DD (optional)",
          },
          end_date: {
            type: "string",
            description: "End date YYYY-MM-DD (optional)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_summary",
      description:
        "Get a spending summary with totals, category breakdown, and insights.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description:
              "Time period: 'all', 'week', 'month', or 'year' (default: all)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_category",
      description:
        "Create a new expense category. Use this when the user mentions an expense that doesn't fit any existing category, or explicitly asks to create a category.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Category name, e.g. 'Pet', 'Subscription', 'Gift'",
          },
          color: {
            type: "string",
            description:
              "Hex color code for the category (optional, e.g. '#FF6B6B')",
          },
          icon: {
            type: "string",
            description:
              "Material-UI icon name (optional, default 'category')",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_category",
      description:
        "Delete/remove a category by its ID. Find the ID from the Available Categories list in context.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The category ID to delete",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_category",
      description:
        "Update/edit an existing category by its ID. Only include fields to change.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "The category ID to update",
          },
          name: {
            type: "string",
            description: "New category name (optional)",
          },
          color: {
            type: "string",
            description: "New hex color code (optional, e.g. '#FF6B6B')",
          },
          icon: {
            type: "string",
            description: "New Material-UI icon name (optional)",
          },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "analyze_spending",
      description:
        "Deep analysis of spending patterns — trends, efficiency, category breakdown, daily average, top categories, savings tips, comparison. Use for ANY analytical question about spending.",
      parameters: {
        type: "object",
        properties: {
          period: {
            type: "string",
            description:
              "Time period to analyze: 'all', 'week', 'month', or 'year' (default: all)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_budget",
      description:
        "Save current transactions as a named budget history entry so the user can revisit it later (e.g. trip, holiday, monthly budget).",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Name/title for this budget snapshot (e.g. 'Bali Trip 2025')",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_history",
      description:
        "Retrieve all saved budget history entries with totals and details. Use when user asks about past budgets, trips, holidays, or historical spending.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
];

const VALID_TOOLS = [
  "add_transaction",
  "delete_transaction",
  "update_transaction",
  "get_transactions",
  "get_summary",
  "analyze_spending",
  "add_category",
  "delete_category",
  "update_category",
  "save_budget",
  "get_history",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      context,
      apiKey: clientKey,
    }: {
      messages: ChatMessage[];
      context: BudgetContext;
      apiKey?: string;
    } = body;

    const effectiveKey = clientKey?.trim() || API_KEY;

    if (!effectiveKey) {
      return NextResponse.json(
        { error: "AI API key not configured. Add your SiliconFlow API key in Settings." },
        { status: 500 }
      );
    }

    const systemPrompt = buildSystemPrompt(context);

    const payload: Record<string, unknown> = {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1024,
      stream: false,
    };

    if (MODEL.includes("DeepSeek-V4-Flash")) {
      payload.reasoning_effort = "high";
    }

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${effectiveKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("SiliconFlow API error:", response.status, errText);
      return NextResponse.json(
        { error: `AI service error (${response.status})` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;

    if (!message) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 }
      );
    }

    const toolCalls = message.tool_calls;
    const reply = message.content || "";

    if (toolCalls && toolCalls.length > 0) {
      const actions = toolCalls
        .filter((tc: { function?: { name?: string } }) =>
          tc.function?.name && VALID_TOOLS.includes(tc.function.name)
        )
        .map((tc: { function: { name: string; arguments: string } }) => {
          try {
            return {
              type: tc.function.name as string,
              data: JSON.parse(tc.function.arguments),
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      return NextResponse.json({
        reply: reply || "On it!",
        actions,
      });
    }

    return NextResponse.json({ reply, actions: [] });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    );
  }
}
