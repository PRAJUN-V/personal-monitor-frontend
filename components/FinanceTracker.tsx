"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type { Source, Transaction } from "@/lib/types";
import ConfirmDialog from "./ConfirmDialog";

interface FinanceTrackerProps {
  sources: Source[];
  transactions: Transaction[];
  page: number;
  onPageChange: (page: number) => void;
  onAddSource: (form: { name: string; balance: string }) => Promise<boolean>;
  onUpdateSource: (id: number, form: { name: string; balance: string }) => Promise<boolean>;
  onAddTransaction: (payload: TransactionPayload) => Promise<boolean>;
  onDeleteTransaction: (id: number) => void;
  isSaving: boolean;
  isFetching: boolean;
}

interface TransactionPayload {
  source_id: string;
  amount: string;
  type: string;
  category: string;
  description: string;
  date: string;
}

function getCurrentLocalDateTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

const emptyTransForm = () => ({
  source_id: "",
  amount: "",
  type: "expense",
  category: "",
  datetime: getCurrentLocalDateTime(),
  description: "",
});

function SourceSkeleton() {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-soft animate-pulse border border-slate-100">
      <div className="h-2 bg-slate-200 rounded w-1/2 mb-2" />
      <div className="h-6 bg-slate-100 rounded w-3/4" />
    </div>
  );
}

function TransSkeleton() {
  return (
    <div className="p-5 flex justify-between items-center animate-pulse">
      <div className="flex gap-4 items-center">
        <div className="w-11 h-11 bg-slate-100 rounded-2xl" />
        <div className="space-y-2">
          <div className="h-3 bg-slate-200 rounded w-24" />
          <div className="h-2 bg-slate-100 rounded w-16" />
        </div>
      </div>
      <div className="h-4 bg-slate-200 rounded w-12" />
    </div>
  );
}

const darkInput =
  "w-full bg-white/10 rounded-xl p-3 text-white placeholder-white/40 border border-white/10 outline-none transition focus:border-white/40 focus:ring-4 focus:ring-white/10";
const darkLabel = "text-xs font-bold text-indigo-200 block mb-1.5";

export default function FinanceTracker({
  sources,
  transactions,
  page,
  onPageChange,
  onAddSource,
  onUpdateSource,
  onAddTransaction,
  onDeleteTransaction,
  isSaving,
  isFetching,
}: FinanceTrackerProps) {
  const [showSourceForm, setShowSourceForm] = useState(false);
  const [showTransForm, setShowTransForm] = useState(false);
  const [sourceForm, setSourceForm] = useState({ name: "", balance: "" });
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<number | null>(null);
  const [transForm, setTransForm] = useState(emptyTransForm());

  const totalBalance = sources.reduce((sum, s) => sum + s.balance, 0);

  const openAddSource = () => {
    setEditingSourceId(null);
    setSourceForm({ name: "", balance: "" });
    setShowSourceForm(true);
    setShowTransForm(false);
  };

  const startEditSource = (s: Source) => {
    setEditingSourceId(s.id);
    setSourceForm({ name: s.name, balance: String(s.balance) });
    setShowSourceForm(true);
    setShowTransForm(false);
  };

  const handleSourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = editingSourceId
      ? await onUpdateSource(editingSourceId, sourceForm)
      : await onAddSource(sourceForm);
    if (success) {
      setShowSourceForm(false);
      setEditingSourceId(null);
      setSourceForm({ name: "", balance: "" });
    }
  };

  const handleTransSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: TransactionPayload = {
      source_id: transForm.source_id,
      amount: transForm.amount,
      type: transForm.type,
      category: transForm.category,
      description: transForm.description,
      date: new Date(transForm.datetime).toISOString(),
    };
    const success = await onAddTransaction(payload);
    if (success) {
      setShowTransForm(false);
      setTransForm(emptyTransForm());
    }
  };

  const setTimeToNow = () => setTransForm({ ...transForm, datetime: getCurrentLocalDateTime() });

  return (
    <div className="space-y-8">
      {/* Total balance hero */}
      <div className="brand-gradient rounded-3xl p-6 text-white shadow-lift relative overflow-hidden">
        <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Total Balance</p>
            <p className="text-4xl font-extrabold mt-1">₹{totalBalance.toLocaleString()}</p>
            <p className="text-xs text-white/70 mt-1.5">
              Across {sources.length} {sources.length === 1 ? "account" : "accounts"}
            </p>
          </div>
          <div className="bg-white/15 p-3 rounded-2xl">
            <Wallet className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Sources overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isFetching && sources.length === 0 ? (
          <>
            <SourceSkeleton />
            <SourceSkeleton />
          </>
        ) : (
          sources.map((s) => (
            <div key={s.id} className="group relative bg-white p-4 rounded-2xl shadow-soft border border-slate-100 border-l-4 border-l-indigo-500">
              <button
                onClick={() => startEditSource(s)}
                aria-label={`Edit ${s.name}`}
                className="absolute top-2 right-2 p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition md:opacity-0 md:group-hover:opacity-100"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate pr-6">{s.name}</p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">₹{s.balance.toLocaleString()}</p>
            </div>
          ))
        )}
        <button
          onClick={openAddSource}
          className="border-2 border-dashed border-slate-200 p-4 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/40 transition flex flex-col items-center justify-center gap-1.5 min-h-[80px]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Add Source</span>
        </button>
      </div>

      {/* Forms */}
      {(showSourceForm || showTransForm) && (
        <div className="glass-dark rounded-3xl p-6 text-white shadow-glow animate-scale-in border border-white/10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">
              {showSourceForm
                ? editingSourceId
                  ? "Edit Money Source"
                  : "New Money Source"
                : "New Transaction"}
            </h2>
            <button
              onClick={() => {
                setShowSourceForm(false);
                setShowTransForm(false);
                setEditingSourceId(null);
              }}
              className="text-white/60 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {showSourceForm ? (
            <form onSubmit={handleSourceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={darkLabel}>Name</label>
                  <input type="text" required className={darkInput} placeholder="e.g. Cash" value={sourceForm.name} onChange={(e) => setSourceForm({ ...sourceForm, name: e.target.value })} />
                </div>
                <div>
                  <label className={darkLabel}>{editingSourceId ? "Balance" : "Initial Balance"}</label>
                  <input type="number" inputMode="decimal" required className={darkInput} placeholder="0.00" value={sourceForm.balance} onChange={(e) => setSourceForm({ ...sourceForm, balance: e.target.value })} />
                </div>
              </div>
              {editingSourceId && (
                <p className="text-xs text-indigo-200/80">
                  Editing the balance directly corrects the amount — it does not create a transaction.
                </p>
              )}
              <button type="submit" disabled={isSaving} className="w-full bg-white text-indigo-900 font-bold py-3 rounded-xl hover:bg-indigo-50 transition disabled:opacity-60">
                {isSaving
                  ? editingSourceId
                    ? "Saving..."
                    : "Creating..."
                  : editingSourceId
                    ? "Save Changes"
                    : "Create Source"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTransSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="col-span-2 md:col-span-1">
                  <label className={darkLabel}>Source</label>
                  <select required className={darkInput} value={transForm.source_id} onChange={(e) => setTransForm({ ...transForm, source_id: e.target.value })}>
                    <option value="" className="text-slate-900">Select Account</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id} className="text-slate-900">{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={darkLabel}>Type</label>
                  <select className={darkInput} value={transForm.type} onChange={(e) => setTransForm({ ...transForm, type: e.target.value })}>
                    <option value="expense" className="text-slate-900">Expense (-)</option>
                    <option value="income" className="text-slate-900">Income (+)</option>
                  </select>
                </div>
                <div>
                  <label className={darkLabel}>Amount</label>
                  <input type="number" inputMode="decimal" step="0.01" required className={darkInput} placeholder="0.00" value={transForm.amount} onChange={(e) => setTransForm({ ...transForm, amount: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={darkLabel}>Category</label>
                  <input type="text" required className={darkInput} placeholder="Lunch, Fuel, Salary..." value={transForm.category} onChange={(e) => setTransForm({ ...transForm, category: e.target.value })} />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold text-indigo-200 block">Date &amp; Time</label>
                    <button type="button" onClick={setTimeToNow} className="text-[10px] font-bold text-indigo-300 hover:text-white uppercase tracking-tight transition">
                      Set Now
                    </button>
                  </div>
                  <input type="datetime-local" required className={darkInput} value={transForm.datetime} onChange={(e) => setTransForm({ ...transForm, datetime: e.target.value })} />
                </div>
              </div>
              <button type="submit" disabled={isSaving} className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-600 disabled:opacity-60 transition">
                {isSaving ? "Processing..." : "Complete Transaction"}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Transaction list */}
      <div className="bg-white rounded-3xl shadow-soft overflow-hidden border border-slate-100">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
              <Receipt className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
          </div>
          <button
            onClick={() => {
              setShowTransForm(true);
              setShowSourceForm(false);
              setEditingSourceId(null);
            }}
            className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lift transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        </div>

        {isFetching && transactions.length === 0 ? (
          <div className="divide-y divide-slate-100">
            <TransSkeleton />
            <TransSkeleton />
            <TransSkeleton />
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t.id} className="p-5 flex justify-between items-center hover:bg-slate-50/70 transition group">
                <div className="flex gap-4 items-center min-w-0">
                  <div className={`p-3 rounded-2xl shrink-0 ${t.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                    {t.type === "income" ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{t.category}</p>
                    <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="truncate">{t.source_name}</span>
                      <span>•</span>
                      <span className="whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                        {new Date(t.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3 shrink-0">
                  <p className={`text-sm font-extrabold ${t.type === "income" ? "text-emerald-600" : "text-slate-900"}`}>
                    {t.type === "income" ? "+" : "-"} ₹{t.amount.toLocaleString()}
                  </p>
                  <button
                    onClick={() => setDeleteTxId(t.id)}
                    aria-label="Delete transaction"
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Receipt className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-medium">No transactions found.</p>
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/40">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold uppercase text-[10px] text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page {page + 1}</span>
          <button
            disabled={transactions.length < 5 || isFetching}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold uppercase text-[10px] text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          >
            More <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTxId !== null}
        title="Delete transaction?"
        message="This transaction will be removed and the source balance will be adjusted back. This cannot be undone."
        onCancel={() => setDeleteTxId(null)}
        onConfirm={() => {
          if (deleteTxId !== null) onDeleteTransaction(deleteTxId);
          setDeleteTxId(null);
        }}
      />
    </div>
  );
}
