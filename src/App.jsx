import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "./components/Form.jsx";
import History from "./components/History.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import Dashboard from "./components/Dashboard.jsx";
import { inferCategory } from "./utils/categorize.js";

const STORAGE_KEY = "grocery-splitter-expenses";
const DEFAULT_PROVIDER = "Local";

const seedExpenses = [
  {
    id: "seed-1",
    itemName: "Vegetables",
    amount: 350,
    buyer: "Banga",
    date: new Date().toISOString().slice(0, 10),
    splitType: "equal",
    category: "Produce",
    provider: "Local",
  },
  {
    id: "seed-2",
    itemName: "Milk",
    amount: 220,
    buyer: "Aaryaman",
    date: new Date().toISOString().slice(0, 10),
    splitType: "equal",
    category: "Dairy",
    provider: "Zepto",
  },
  {
    id: "seed-3",
    itemName: "Steak (personal)",
    amount: 500,
    buyer: "Banga",
    date: new Date().toISOString().slice(0, 10),
    splitType: "personal",
    category: "Meat",
    provider: "Local",
  },
];

const formatCurrency = (value) => `₹${value.toFixed(2)}`;

const computeSummary = (expenses) => {
  const totals = {
    paid: { Banga: 0, Aaryaman: 0 },
    owed: { Banga: 0, Aaryaman: 0 },
  };

  for (const expense of expenses) {
    totals.paid[expense.buyer] += expense.amount;

    if (expense.splitType === "personal") {
      totals.owed[expense.buyer] += expense.amount;
    } else {
      const split = expense.amount / 2;
      totals.owed.Banga += split;
      totals.owed.Aaryaman += split;
    }
  }

  const netA = totals.paid.Banga - totals.owed.Banga;
  const netB = totals.paid.Aaryaman - totals.owed.Aaryaman;
  const totalSpent = totals.paid.Banga + totals.paid.Aaryaman;

  return {
    totalSpent,
    paidA: totals.paid.Banga,
    paidB: totals.paid.Aaryaman,
    owedA: totals.owed.Banga,
    owedB: totals.owed.Aaryaman,
    netA,
    netB,
  };
};

const normalizeExpense = (expense) => {
  const itemName = typeof expense.itemName === "string" ? expense.itemName : "";
  return {
    id: expense.id ?? crypto.randomUUID(),
    itemName,
    amount: Number(expense.amount) || 0,
    buyer: expense.buyer === "Aaryaman" ? "Aaryaman" : "Banga",
    date: expense.date ?? new Date().toISOString().slice(0, 10),
    splitType: expense.splitType === "personal" ? "personal" : "equal",
    category: expense.category ?? inferCategory(itemName),
    provider: expense.provider ?? DEFAULT_PROVIDER,
  };
};

const getMonthKey = (dateString) => dateString.slice(0, 7);

const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-IN", { month: "long", year: "numeric" });
};

export default function App() {
  const [view, setView] = useState("entry");
  const [expenses, setExpenses] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedExpenses;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeExpense) : seedExpenses;
    } catch {
      return seedExpenses;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

  const months = useMemo(() => {
    const set = new Set(expenses.map((expense) => getMonthKey(expense.date)));
    const list = Array.from(set).sort().reverse();
    return list.length ? list : [getMonthKey(new Date().toISOString().slice(0, 10))];
  }, [expenses]);

  const [activeMonth, setActiveMonth] = useState(() => months[0]);

  useEffect(() => {
    if (!months.includes(activeMonth)) {
      setActiveMonth(months[0]);
    }
  }, [months, activeMonth]);

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => getMonthKey(expense.date) === activeMonth),
    [expenses, activeMonth]
  );

  const monthSummary = useMemo(() => computeSummary(monthExpenses), [monthExpenses]);

  const categoryTotals = useMemo(() => {
    const totals = new Map();
    for (const expense of monthExpenses) {
      totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
    }
    const totalAmount = monthExpenses.reduce((sum, expense) => sum + expense.amount, 0) || 1;
    return Array.from(totals.entries()).map(([name, total]) => ({
      name,
      total,
      percent: (total / totalAmount) * 100,
    }));
  }, [monthExpenses]);

  const providerTotals = useMemo(() => {
    const totals = new Map();
    for (const expense of monthExpenses) {
      totals.set(expense.provider, (totals.get(expense.provider) ?? 0) + expense.amount);
    }
    return Array.from(totals.entries()).map(([name, total]) => ({ name, total }));
  }, [monthExpenses]);

  const handleAddExpense = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
  };

  const handleDeleteExpense = (id) => {
    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  };

  const handleClearAll = () => {
    setExpenses([]);
  };

  const shareSummary = () => {
    const balanceText =
      summary.netA === 0
        ? "All settled up."
        : summary.netA > 0
        ? `Aaryaman owes Banga ${formatCurrency(summary.netA)}.`
        : `Banga owes Aaryaman ${formatCurrency(Math.abs(summary.netA))}.`;

    const text = `Grocery Splitter Summary\nTotal Spent: ${formatCurrency(summary.totalSpent)}\nBanga Paid: ${formatCurrency(
      summary.paidA
    )}\nAaryaman Paid: ${formatCurrency(summary.paidB)}\n${balanceText}`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen px-4 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="badge bg-emerald-500/20 text-emerald-200">Shared Expenses</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Grocery Splitter
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Track shared grocery spends, auto-categorize items, and settle up fast.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 p-1 text-xs">
              <button
                type="button"
                onClick={() => setView("entry")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  view === "entry" ? "bg-emerald-500 text-emerald-950" : "text-slate-300"
                }`}
              >
                Expenses
              </button>
              <button
                type="button"
                onClick={() => setView("dashboard")}
                className={`rounded-full px-4 py-2 font-semibold transition ${
                  view === "dashboard" ? "bg-emerald-500 text-emerald-950" : "text-slate-300"
                }`}
              >
                Dashboard
              </button>
            </div>
          </div>

          {view === "dashboard" ? (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <span className="uppercase tracking-wide text-slate-500">Month</span>
              <div className="flex flex-wrap items-center gap-2">
                {months.map((month) => (
                  <button
                    key={month}
                    type="button"
                    onClick={() => setActiveMonth(month)}
                    className={`rounded-full border px-3 py-1 transition ${
                      activeMonth === month
                        ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-100"
                        : "border-slate-700 text-slate-400"
                    }`}
                  >
                    {formatMonthLabel(month)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </header>

        {view === "entry" ? (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <ExpenseForm onAddExpense={handleAddExpense} />
              <SummaryCard summary={summary} onShare={shareSummary} />
            </div>

            <History expenses={expenses} onDelete={handleDeleteExpense} onClear={handleClearAll} />

            <footer className="text-xs text-slate-500">
              Tip: Use "Personal" for items only one roommate should cover.
            </footer>
          </>
        ) : (
          <Dashboard
            summary={monthSummary}
            expenses={monthExpenses}
            monthLabel={formatMonthLabel(activeMonth)}
            categoryTotals={categoryTotals}
            providerTotals={providerTotals}
          />
        )}
      </div>
    </div>
  );
}
