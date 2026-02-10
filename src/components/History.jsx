const formatCurrency = (value) => `₹${value.toFixed(2)}`;

export default function History({ expenses, onDelete, onClear }) {
  return (
    <section className="glass rounded-3xl p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">History</h2>
          <p className="text-xs text-slate-400">All recorded transactions.</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-400"
        >
          Clear All
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {expenses.length === 0 ? (
          <p className="text-sm text-slate-400">No expenses yet.</p>
        ) : (
          expenses.map((expense) => (
            <article
              key={expense.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-slate-100">{expense.itemName}</p>
                <p className="text-xs text-slate-400">
                  {expense.date} • {expense.buyer} • {expense.splitType === "personal" ? "Personal" : "Equal"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-sm font-semibold text-emerald-300">
                  {formatCurrency(expense.amount)}
                </p>
                <button
                  type="button"
                  onClick={() => onDelete(expense.id)}
                  className="rounded-full border border-rose-500/40 px-3 py-1 text-xs font-semibold text-rose-300 transition hover:border-rose-400"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
