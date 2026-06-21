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
import ConfirmDialog from "./ConfirmDialog";

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
      return "bg-emerald-950/60 text-emerald-400 border-emerald-800/60";
    case "Underweight":
      return "bg-amber-950/60 text-amber-400 border-amber-800/60";
    case "Overweight":
      return "bg-orange-950/60 text-orange-400 border-orange-800/60";
    case "Obese":
      return "bg-rose-950/60 text-rose-400 border-rose-800/60";
    default:
      return "bg-zinc-800 text-zinc-300 border-zinc-700";
  }
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 p-5 surface-inner">
      <div className="flex justify-between">
        <div className="h-4 bg-zinc-800 rounded w-1/3" />
        <div className="h-6 bg-zinc-800 rounded w-1/4" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-8 bg-zinc-800/60 rounded" />
        <div className="h-8 bg-zinc-800/60 rounded" />
        <div className="h-8 bg-zinc-800/60 rounded" />
      </div>
    </div>
  );
}

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
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="surface p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-400">
              <Gauge className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Latest BMI</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-zinc-50">{latest.bmi}</span>
              <span className={`px-2 py-0.5 mb-1 rounded-md text-[10px] font-bold border ${getBMICategoryColor(latest.category)}`}>
                {latest.category}
              </span>
            </div>
          </div>

          <div className="surface p-5">
            <div className="flex items-center gap-2 mb-3 text-zinc-400">
              <Scale className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">Latest Weight</p>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-extrabold text-zinc-50">{latest.weight}</span>
              <span className="text-zinc-500 text-sm mb-1.5 font-semibold">kg</span>
            </div>
          </div>

          <div className="brand-gradient p-5 rounded-3xl shadow-lift text-white">
            <div className="flex items-center gap-2 mb-3 text-white/70">
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

      <div className="surface overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-800 text-zinc-200 p-2 rounded-xl border border-zinc-700/80">
              <HeartPulse className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-50">Health History</h2>
          </div>
          <button
            onClick={() => (showForm ? closeForm() : setShowForm(true))}
            className="flex items-center gap-1.5 btn-primary px-4 py-2 text-sm"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Close" : "Add Entry"}
          </button>
        </div>

        {showForm && (
          <div className="p-5 sm:p-6 bg-zinc-950/50 border-b border-zinc-800 animate-fade-in">
            <form onSubmit={handleFormSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="label-field">Date</label>
                <input type="date" required className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Ht (cm)</label>
                <input type="number" inputMode="decimal" step="0.1" required className="input-field" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Wt (kg)</label>
                <input type="number" inputMode="decimal" step="0.1" required className="input-field" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} />
              </div>
              <div>
                <label className="label-field">BP Sys</label>
                <input type="number" inputMode="numeric" className="input-field" value={form.bp_systolic} onChange={(e) => setForm({ ...form, bp_systolic: e.target.value })} />
              </div>
              <div>
                <label className="label-field">BP Dia</label>
                <input type="number" inputMode="numeric" className="input-field" value={form.bp_diastolic} onChange={(e) => setForm({ ...form, bp_diastolic: e.target.value })} />
              </div>
              <div className="col-span-2 md:col-span-5 flex justify-end">
                <button type="submit" disabled={isSaving} className="btn-primary px-8 py-2.5 text-sm">
                  {isSaving ? "Saving..." : editingId ? "Update Record" : "Save Progress"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={`overflow-x-auto transition ${isFetching ? "opacity-50" : ""}`}>
          <div className="md:hidden divide-y divide-zinc-800">
            {records.map((r) => (
              <div key={r.id} className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-zinc-100">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(r)} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeleteId(r.id)} className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="font-bold text-zinc-300">{r.height}cm</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="font-bold text-zinc-300">{r.weight}kg</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge className="w-3.5 h-3.5 text-zinc-600" />
                    <span className="font-bold text-zinc-200">{r.bmi}</span>
                  </div>
                </div>
                <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] border font-bold uppercase ${getBMICategoryColor(r.category)}`}>
                  {r.category}
                </span>
              </div>
            ))}
            {records.length === 0 && (
              <div className="p-16 text-center text-zinc-500">
                <Activity className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm font-medium">No records yet.</p>
              </div>
            )}
          </div>

          <table className="hidden md:table w-full text-left text-sm">
            <thead className="bg-zinc-950/50 border-b border-zinc-800">
              <tr>
                <th className="p-4 label-field mb-0">Date</th>
                <th className="p-4 label-field mb-0">Height</th>
                <th className="p-4 label-field mb-0">Weight</th>
                <th className="p-4 label-field mb-0">BP</th>
                <th className="p-4 label-field mb-0">BMI Status</th>
                <th className="p-4 text-right label-field mb-0">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition">
                  <td className="p-4 font-medium text-zinc-300">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="p-4 text-zinc-400">{r.height}cm</td>
                  <td className="p-4 font-bold text-zinc-100">{r.weight}kg</td>
                  <td className="p-4 text-zinc-400">{r.bp_systolic ? `${r.bp_systolic}/${r.bp_diastolic}` : "—"}</td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] border font-bold uppercase ${getBMICategoryColor(r.category)}`}>
                      {r.category} ({r.bmi})
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => startEdit(r)} className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(r.id)} className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-16 text-center text-zinc-500">
                    <Activity className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                    <p className="text-sm font-medium">No records yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <button
            disabled={page === 0 || isFetching}
            onClick={() => onPageChange(page - 1)}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-700 rounded-xl bg-zinc-900 font-bold uppercase text-[10px] text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Page {page + 1}</span>
          <button
            disabled={records.length < 5 || isFetching}
            onClick={() => onPageChange(page + 1)}
            className="flex items-center gap-1 px-3 py-2 border border-zinc-700 rounded-xl bg-zinc-900 font-bold uppercase text-[10px] text-zinc-400 transition hover:bg-zinc-800 disabled:opacity-30"
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        title="Delete record?"
        message="This health record will be permanently removed. This action cannot be undone."
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId !== null) onDelete(deleteId);
          setDeleteId(null);
        }}
      />
    </div>
  );
}
