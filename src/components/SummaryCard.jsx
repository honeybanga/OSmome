const formatCurrency = (value) => `₹${value.toFixed(2)}`;

export default function SummaryCard({ summary, onShare }) {
  const balanceLabel =
    summary.netA === 0
      ? "All settled up"
      : summary.netA > 0
      ? `User B owes User A ${formatCurrency(summary.netA)}`
      : `User A owes User B ${formatCurrency(Math.abs(summary.netA))}`;

  const balanceColor =
    summary.netA === 0 ? "text-slate-300" : summary.netA > 0 ? "text-mint" : "text-flame";

  return (
    <section className="glass rounded-3xl p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Summary</p>
          <h2 className="mt-2 text-2xl font-semibold">{formatCurrency(summary.totalSpent)}</h2>
          <p className="text-xs text-slate-400">Total Spent</p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300"
        >
          Share
        </button>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">User A paid</span>
          <span className="font-semibold text-slate-100">{formatCurrency(summary.paidA)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">User B paid</span>
          <span className="font-semibold text-slate-100">{formatCurrency(summary.paidB)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Fair share (A)</span>
          <span>{formatCurrency(summary.owedA)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Fair share (B)</span>
          <span>{formatCurrency(summary.owedB)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
        <p className={`text-sm font-semibold ${balanceColor}`}>{balanceLabel}</p>
      </div>
    </section>
  );
}
