import { useEffect, useMemo, useState } from "react";
import ExpenseForm from "./components/Form.jsx";
import History from "./components/History.jsx";
import SummaryCard from "./components/SummaryCard.jsx";

const STORAGE_KEY = "grocery-splitter-expenses";
const USERS = ["User A", "User B"];

const seedExpenses = [
  {
    id: "seed-1",
    itemName: "Vegetables",
    amount: 350,
    buyer: "User A",
    date: new Date().toISOString().slice(0, 10),
    splitType: "equal",
  },
  {
    id: "seed-2",
    itemName: "Milk",
    amount: 220,
    buyer: "User B",
    date: new Date().toISOString().slice(0, 10),
    splitType: "equal",
  },
  {
    id: "seed-3",
    itemName: "Steak (personal)",
    amount: 500,
    buyer: "User A",
    date: new Date().toISOString().slice(0, 10),
    splitType: "personal",
  },
];

const formatCurrency = (value) => `₹${value.toFixed(2)}`;

const computeSummary = (expenses) => {
  const totals = {
    paid: { "User A": 0, "User B": 0 },
    owed: { "User A": 0, "User B": 0 },
  };

  for (const expense of expenses) {
    totals.paid[expense.buyer] += expense.amount;

    if (expense.splitType === "personal") {
      totals.owed[expense.buyer] += expense.amount;
    } else {
      const split = expense.amount / 2;
      totals.owed["User A"] += split;
      totals.owed["User B"] += split;
    }
  }

  const netA = totals.paid["User A"] - totals.owed["User A"];
  const netB = totals.paid["User B"] - totals.owed["User B"];
  const totalSpent = totals.paid["User A"] + totals.paid["User B"];

  return {
    totalSpent,
    paidA: totals.paid["User A"],
    paidB: totals.paid["User B"],
    owedA: totals.owed["User A"],
    owedB: totals.owed["User B"],
    netA,
    netB,
  };
};

export default function App() {
  const [expenses, setExpenses] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedExpenses;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : seedExpenses;
    } catch {
      return seedExpenses;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }, [expenses]);

  const summary = useMemo(() => computeSummary(expenses), [expenses]);

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
        ? `User B owes User A ${formatCurrency(summary.netA)}.`
        : `User A owes User B ${formatCurrency(Math.abs(summary.netA))}.`;

    const text = `Grocery Splitter Summary\nTotal Spent: ${formatCurrency(summary.totalSpent)}\nUser A Paid: ${formatCurrency(
      summary.paidA
    )}\nUser B Paid: ${formatCurrency(summary.paidB)}\n${balanceText}`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen px-4 py-10 text-slate-100 sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="badge bg-emerald-500/20 text-emerald-200">Shared Expenses</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Grocery Splitter
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Track shared grocery spends, handle personal items, and settle up in seconds.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <ExpenseForm onAddExpense={handleAddExpense} />
          <SummaryCard summary={summary} onShare={shareSummary} />
        </div>

        <History expenses={expenses} onDelete={handleDeleteExpense} onClear={handleClearAll} />

        <footer className="text-xs text-slate-500">
          Tip: Use "Personal" for items only one roommate should cover.
        </footer>
      </div>
    </div>
  );
}
