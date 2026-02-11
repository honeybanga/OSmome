import { useMemo, useState } from "react";
import { inferCategory } from "../utils/categorize.js";

const initialState = {
  itemName: "",
  amount: "",
  buyer: "Banga",
  date: new Date().toISOString().slice(0, 10),
  splitType: "equal",
  provider: "Local",
};

const PROVIDERS = ["Local", "Zepto", "Blinkit", "Instamart", "BigBasket", "Other"];

const isLikelyTotalLine = (line) => {
  const lower = line.toLowerCase();
  return (
    lower.includes("to pay") ||
    lower.includes("total") ||
    lower.includes("grand") ||
    lower.includes("payable")
  );
};

const cleanAmountToken = (token) => token.replace(/[₹,]/g, "");

const FEE_KEYWORDS = [
  "delivery",
  "surge",
  "handling",
  "fee",
  "packaging",
  "platform",
  "tip",
  "tax",
  "gst",
  "saving",
  "saved",
  "discount",
  "coupon",
  "promo",
];

const shouldIgnoreLine = (line, ignoreFees) => {
  if (!ignoreFees) return false;
  const lower = line.toLowerCase();
  return FEE_KEYWORDS.some((word) => lower.includes(word));
};

const getTotalScore = (line) => {
  const lower = line.toLowerCase();
  if (lower.includes("total bill")) return 4;
  if (lower.includes("to pay") || lower.includes("amount due") || lower.includes("payable")) return 4;
  if (lower.includes("grand total")) return 3;
  if (lower.includes("item total")) return 2;
  if (lower.includes("total")) return 1;
  return 0;
};

const parseOcrLines = (text, { totalOnly, ignoreFees }) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2);

  const items = [];
  const totals = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (shouldIgnoreLine(line, ignoreFees)) {
      continue;
    }
    if (lower.includes("free")) {
      continue;
    }

    const matches = [...line.matchAll(/₹?\s?\d{1,6}(?:[.,]\d{2})?/g)];
    if (!matches.length) continue;

    const last = matches[matches.length - 1][0];
    const amount = Number(cleanAmountToken(last).replace(/,/g, "."));

    if (!Number.isFinite(amount) || amount <= 0) continue;

    const label = line.replace(last, "").replace(/\s{2,}/g, " ").trim();

    const isTotal = isLikelyTotalLine(line);
    if (!totalOnly || isTotal) {
      items.push({ line, label: label || line, amount });
    }
    if (isTotal) {
      totals.push({ line, amount, score: getTotalScore(line) });
    }
  }

  return { items, totals };
};

const preprocessImage = (file) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.src = reader.result;
    };
    reader.onerror = reject;
    img.onload = () => {
      const maxWidth = 1400;
      const scale = Math.min(1, maxWidth / img.width);
      const width = Math.floor(img.width * scale);
      const height = Math.floor(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // Grayscale + contrast + threshold
      const contrast = 1.35;
      const threshold = 160;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;
        gray = (gray - 128) * contrast + 128;
        const value = gray > threshold ? 255 : 0;
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function ExpenseForm({ onAddExpense }) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [ocrItems, setOcrItems] = useState([]);
  const [ocrTotal, setOcrTotal] = useState(null);
  const [ocrPreview, setOcrPreview] = useState("");
  const [totalOnly, setTotalOnly] = useState(true);
  const [ignoreFees, setIgnoreFees] = useState(true);

  const detectedCategory = useMemo(() => inferCategory(form.itemName), [form.itemName]);

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
      category: inferCategory(form.itemName),
      provider: form.provider,
    };

    onAddExpense(expense);
    setForm((prev) => ({
      ...prev,
      itemName: "",
      amount: "",
    }));
  };

  const handleReceiptChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    setReceiptFile(file);
    setOcrItems([]);
    setOcrTotal(null);
    setOcrStatus("");
    setOcrPreview("");
  };

  const handleScanReceipt = async () => {
    if (!receiptFile) {
      setError("Please select a receipt image first.");
      return;
    }

    setError("");
    setOcrStatus("Loading OCR engine...");

    try {
      const { recognize } = await import("tesseract.js");
      setOcrStatus("Preprocessing image...");
      const prepared = await preprocessImage(receiptFile);
      setOcrPreview(prepared);

      setOcrStatus("Scanning receipt...");
      const result = await recognize(prepared, "eng", {
        workerPath: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5/tesseract-core.wasm.js",
        langPath: "https://tessdata.projectnaptha.com/4.0.0",
      });

      const text = result.data.text || "";
      const { items, totals } = parseOcrLines(text, { totalOnly, ignoreFees });
      const maxTotal = totals.length
        ? totals
            .slice()
            .sort((a, b) => b.score - a.score || a.line.localeCompare(b.line))
            .slice(0, 1)[0].amount
        : items.length
        ? Math.max(...items.map((entry) => entry.amount))
        : null;

      setOcrItems(items.slice(0, 8));
      setOcrTotal(maxTotal);
      setOcrStatus(items.length ? "Scan complete." : "Scan complete (no lines detected)." );
    } catch (err) {
      setOcrStatus("");
      setError("OCR failed. Try a clearer photo or better lighting.");
    }
  };

  const applyOcrItem = (item) => {
    setForm((prev) => ({
      ...prev,
      itemName: item.label,
      amount: item.amount.toFixed(2),
    }));
  };

  const applyOcrTotal = () => {
    if (ocrTotal == null) return;
    setForm((prev) => ({
      ...prev,
      amount: ocrTotal.toFixed(2),
    }));
  };

  return (
    <section className="glass rounded-3xl p-6 shadow-soft">
      <h2 className="text-lg font-semibold">Add Expense</h2>
      <p className="mt-1 text-xs text-slate-400">Split evenly or mark as personal.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-slate-300">Item Name</label>
            <span className="rounded-full border border-emerald-400/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-200">
              {detectedCategory}
            </span>
          </div>
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
              <option>Banga</option>
              <option>Aaryaman</option>
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

        <div>
          <label className="text-xs font-medium text-slate-300">Store / App</label>
          <select
            name="provider"
            value={form.provider}
            onChange={handleChange}
            className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none"
          >
            {PROVIDERS.map((provider) => (
              <option key={provider}>{provider}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Receipt OCR (Free)</p>
              <p className="text-xs text-slate-500">Runs in your browser. Best with clear photos.</p>
            </div>
            <button
              type="button"
              onClick={handleScanReceipt}
              className="rounded-full border border-emerald-400/40 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300"
            >
              Scan Receipt
            </button>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleReceiptChange}
              className="text-xs text-slate-300"
            />
            {ocrTotal != null ? (
              <button
                type="button"
                onClick={applyOcrTotal}
                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-400"
              >
                Use total ₹{ocrTotal.toFixed(2)}
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={totalOnly}
                onChange={(event) => setTotalOnly(event.target.checked)}
              />
              Total only
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ignoreFees}
                onChange={(event) => setIgnoreFees(event.target.checked)}
              />
              Ignore fees/discounts
            </label>
          </div>

          {ocrStatus ? <p className="mt-2 text-xs text-emerald-200">{ocrStatus}</p> : null}

          {ocrPreview ? (
            <img
              src={ocrPreview}
              alt="Preprocessed receipt preview"
              className="mt-3 w-full rounded-xl border border-slate-800"
            />
          ) : null}

          {ocrItems.length ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-400">Tap a line to fill the form:</p>
              <div className="flex flex-col gap-2">
                {ocrItems.map((item, index) => (
                  <button
                    key={`${item.line}-${index}`}
                    type="button"
                    onClick={() => applyOcrItem(item)}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-2 text-left text-xs text-slate-200 transition hover:border-emerald-400/60"
                  >
                    <span className="truncate">{item.label}</span>
                    <span className="ml-3 font-semibold text-emerald-200">₹{item.amount.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
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
