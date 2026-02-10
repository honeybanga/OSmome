import { useState } from "react";

const initialState = {
  itemName: "",
  amount: "",
  buyer: "User A",
  date: new Date().toISOString().slice(0, 10),
  splitType: "equal",
};

export default function ExpenseForm({ onAddExpense }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    const amountValue = Number(form.amount);

    if (!form.itemName.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    const expense = {
      id: crypto.randomUUID(),
      itemName: form.itemName.trim(),
      amount: amountValue,
      buyer: form.buyer,
      date: form.date,
      splitType: form.splitType,
    };

    onAddExpense(expense);
    setForm((prev) => ({
      ...prev,
      itemName: "",
      amount: "",
    }));
  };

  return (
    <section className="glass rounded-3xl p-6 shadow-soft">
      <h2 className="text-lg font-semibold">Add Expense</h2>
      <p className="mt-1 text-xs text-slate-400">Split evenly or mark as personal.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <label className="text-xs font-medium text-slate-300">Item Name</label>
          <input
            name="itemName"
            value={form.itemName}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
            placeholder="Grocery item"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Amount (₹)</label>
            <input
              name="amount"
              value={form.amount}
              onChange={handleChange}
              inputMode="decimal"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Buyer</label>
            <select
              name="buyer"
              value={form.buyer}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option>User A</option>
              <option>User B</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-slate-300">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-300">Split Type</label>
            <select
              name="splitType"
              value={form.splitType}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
            >
              <option value="equal">Equal</option>
              <option value="personal">Personal</option>
            </select>
          </div>
        </div>

        {error ? <p className="text-xs text-rose-400">{error}</p> : null}

        <button
          type="submit"
          className="mt-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
        >
          Add Expense
        </button>
      </form>
    </section>
  );
}
