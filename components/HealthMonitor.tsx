"use client";

import { useState } from "react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Gauge,
  HeartPulse,
  Pencil,
  Plus,
  Ruler,
  Scale,
  Target,
  Trash2,
  X,
} from "lucide-react";
import type { HealthRecord } from "@/lib/types";

interface HealthMonitorProps {
  records: HealthRecord[];
  page: number;
  onPageChange: (page: number) => void;
  onSave: (form: HealthFormState, editingId: number | null) => Promise<boolean>;
  onDelete: (id: number) => void;
  isSaving: boolean;
  isFetching: boolean;
}

interface HealthFormState {
  date: string;
  height: string;
  weight: string;
  bp_systolic: string;
  bp_diastolic: string;
}

const emptyForm = (): HealthFormState => ({
  date: new Date().toISOString().split("T")[0],
  height: "",
  weight: "",
  bp_systolic: "",
  bp_diastolic: "",
});

function getBMICategoryColor(category: string) {
  switch (category) {
    case "Normal weight":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Underweight":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "Overweight":
      return "bg-orange-50 text-orange-700 border-orange-200";
    case "Obese":
      return "bg-rose-50 text-rose-700 border-rose-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5 bg-white rounded-2xl border border-slate-100">
      <div className="flex justify-between">
        <div className="h-4 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-slate-200 rounded w-1/4" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-8 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded" />
        <div className="h-8 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

const inputClass =
  "w-full bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

export default function HealthMonitor({
  records,
  page,
  onPageChange,
  onSave,
  onDelete,
  isSaving,
  isFetching,
}: HealthMonitorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HealthFormState>(emptyForm());

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSave(form, editingId);
    if (success) {
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
    }
  };

  const startEdit = (record: HealthRecord) => {
    setEditingId(record.id);
    setForm({
      date: record.date,
      height: String(record.height),
      weight: String(record.weight),
      bp_systolic: record.bp_systolic != null ? String(record.bp_systolic) : "",
      bp_diastolic: record.bp_diastolic != null ? String(record.bp_diastolic) : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  if (isFetching && records.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </div>
    );
  }

  const latest = records[0];

  return (
    <div className="space-y-8">
      {/* Summary cards */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-3xl shadow-soft border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-500">
              <Gauge className="w-4 h-4" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest BMI</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{latest.bmi}</span>
              <span className={`px-2 py-0.5 mb-1 rounded-md text-[10px] font-bold border ${getBMICategoryColor(latest.category)}`}>
                {latest.category}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-soft border border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-violet-500">
              <Scale className="w-4 h-4" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Latest Weight</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{latest.weight}</span>
              <span className="text-slate-400 text-sm mb-1.5 font-semibold">kg</span>
            </div>
          </div>

          <div className="brand-gradient p-5 rounded-3xl shadow-lift text-white">
            <div className="flex items-center gap-2 mb-3 text-white/80">
              <Target className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Goal Status</p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span className="text-lg font-bold">
                {latest.weight_diff_to_normal === 0
                  ? "On track"
                  : `${latest.weight_diff_to_normal > 0 ? "Lose" : "Gain"} ${Math.abs(latest.weight_diff_to_normal)}kg`}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Health History</h2>
          </div>
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className="flex items-center gap-1.5 brand-gradient text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lift transition hover:opacity-95 active:scale-[0.98]"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close" : "Add Entry"}
          </button>
        </div>

        {showForm && (
          <div className="p-5 sm:p-6 bg-indigo-50/40 border-b border-indigo-100 animate-fade-in">
            <form onSubmit={handleFormSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className={labelClass}>Date</label>
                <input type="date" required className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Ht (cm)</label>
                <input type="number" inputMode="decimal" step="0.1" required className={inputClass} value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Wt (kg)</label>
                <input type="number" inputMode="decimal" step="0.1" required className={inputClass} value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>BP Sys</label>
                <input type="number" inputMode="numeric" className={inputClass} value={form.bp_systolic} onChange={(e) => setForm({ ...form, bp_systolic: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>BP Dia</label>
                <input type="number" inputMode="numeric" className={inputClass} value={form.bp_diastolic} onChange={(e) => setForm({ ...form, bp_diastolic: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-5 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="brand-gradient text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lift transition hover:opacity-95 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : editingId ? "Update Record" : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={`overflow-x-auto transition ${isFetching ? "opacity-50" : ""}`}>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {records.map((r) => (
              <div key={r.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-slate-900">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold">{r.height}cm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold">{r.weight}kg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-slate-300" />
                    <span className="font-bold text-indigo-600">{r.bmi}</span>
                  </div>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] border font-bold uppercase ${getBMICategoryColor(r.category)}`}>
                  {r.category}
                </span>
              </div>
            ))}
            {records.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Activity className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-medium">No records yet.</p>
              </div>
            )}
          </div>

          {/* Desktop table */}
          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Height</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weight</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">BP</th>
                <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">BMI Status</th>
                <th className="p-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-4 font-medium text-slate-700">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-4 text-slate-600">{r.height}cm</td>
                  <td className="p-4 font-bold text-slate-900">{r.weight}kg</td>
                  <td className="p-4 text-slate-600">{r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic}` : "—"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] border font-bold uppercase ${getBMICategoryColor(r.category)}`}>
                      {r.category} ({r.bmi})
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(r)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => onDelete(r.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-slate-400">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                    <p className="text-sm font-medium">No records yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50/40">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold uppercase text-[10px] text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Page {page + 1}</span>
          <button
            disabled={records.length < 5 || isFetching}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold uppercase text-[10px] text-slate-600 transition hover:bg-slate-50 disabled:opacity-30"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
