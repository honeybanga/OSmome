const formatCurrency = (value) => `₹${value.toFixed(2)}`;

const PROVIDER_META = {
  Local: { label: "Local", color: "bg-slate-500" },
  Zepto: { label: "Zepto", color: "bg-fuchsia-500" },
  Blinkit: { label: "Blinkit", color: "bg-lime-400" },
  Instamart: { label: "Instamart", color: "bg-orange-400" },
  BigBasket: { label: "BigBasket", color: "bg-emerald-500" },
  Other: { label: "Other", color: "bg-slate-400" },
};

export default function Dashboard({ summary, expenses, monthLabel, categoryTotals, providerTotals }) {
  const topCategories = [...categoryTotals]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const topProviders = [...providerTotals]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <section className="glass rounded-3xl p-6 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Dashboard</p>
          <h2 className="mt-2 text-2xl font-semibold">{monthLabel}</h2>
          <p className="text-xs text-slate-400">{expenses.length} expenses logged</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-2 text-xs text-slate-300">
          Total: <span className="font-semibold text-slate-100">{formatCurrency(summary.totalSpent)}</span>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Who Paid</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Banga</span>
              <span className="font-semibold text-slate-100">{formatCurrency(summary.paidA)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Aaryaman</span>
              <span className="font-semibold text-slate-100">{formatCurrency(summary.paidB)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Balance</p>
          <p className="mt-3 text-lg font-semibold text-emerald-300">
            {summary.netA === 0
              ? "All settled"
              : summary.netA > 0
              ? `Aaryaman owes Banga ${formatCurrency(summary.netA)}`
              : `Banga owes Aaryaman ${formatCurrency(Math.abs(summary.netA))}`}
          </p>
          <p className="mt-2 text-xs text-slate-400">Based on equal vs personal splits.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Top Categories</p>
          <div className="mt-3 space-y-3">
            {topCategories.length === 0 ? (
              <p className="text-sm text-slate-400">No category data yet.</p>
            ) : (
              topCategories.map((category) => (
                <div key={category.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{category.name}</span>
                    <span className="font-semibold text-slate-100">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-slate-900">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${Math.max(6, category.percent)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Stores / Apps</p>
          <div className="mt-3 space-y-3">
            {topProviders.length === 0 ? (
              <p className="text-sm text-slate-400">No store data yet.</p>
            ) : (
              topProviders.map((provider) => {
                const meta = PROVIDER_META[provider.name] ?? {
                  label: provider.name,
                  color: "bg-slate-400",
                };

                return (
                  <div key={provider.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${meta.color}`} />
                      <span className="text-slate-300">{meta.label}</span>
                    </div>
                    <span className="font-semibold text-slate-100">
                      {formatCurrency(provider.total)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
