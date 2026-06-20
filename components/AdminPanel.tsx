"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserCog,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { api, UnauthorizedError } from "@/lib/api";
import type { ManagedUser } from "@/lib/types";

interface AdminPanelProps {
  currentUsername: string;
  onNotify: (message: string, type?: "success" | "error") => void;
  onUnauthorized: () => void;
}

interface UserFormState {
  username: string;
  password: string;
  is_admin: boolean;
}

const emptyForm = (): UserFormState => ({ username: "", password: "", is_admin: false });

const inputClass =
  "w-full bg-white px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-medium outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100";
const labelClass = "text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";

export default function AdminPanel({ currentUsername, onNotify, onUnauthorized }: AdminPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());

  const guard = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) {
        onUnauthorized();
        return true;
      }
      return false;
    },
    [onUnauthorized],
  );

  const fetchUsers = useCallback(async () => {
    setIsFetching(true);
    try {
      setUsers(await api.listUsers());
    } catch (err) {
      if (!guard(err)) onNotify("Failed to load users", "error");
    } finally {
      setIsFetching(false);
    }
  }, [guard, onNotify]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const startEdit = (u: ManagedUser) => {
    setEditingId(u.id);
    setForm({ username: u.username, password: "", is_admin: u.is_admin });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  };

  const isEditingSelf = editingId != null && form.username === currentUsername;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingId) {
        const payload: { username: string; is_admin: boolean; password?: string } = {
          username: form.username,
          is_admin: form.is_admin,
        };
        if (form.password.trim()) payload.password = form.password;
        await api.updateUser(editingId, payload);
        onNotify("User updated");
      } else {
        await api.createUser({
          username: form.username,
          password: form.password,
          is_admin: form.is_admin,
        });
        onNotify(`User "${form.username}" created`);
      }
      closeForm();
      await fetchUsers();
    } catch (err) {
      if (!guard(err)) onNotify((err as Error).message || "Save failed", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    if (!window.confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    try {
      await api.deleteUser(u.id);
      onNotify("User deleted");
      await fetchUsers();
    } catch (err) {
      if (!guard(err)) onNotify((err as Error).message || "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">User Management</h2>
              <p className="text-xs text-slate-400 font-medium">Admin only</p>
            </div>
          </div>
          <button
            onClick={() => (showForm && !editingId ? closeForm() : openAdd())}
            className="flex items-center gap-1.5 brand-gradient text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lift transition hover:opacity-95 active:scale-[0.98]"
          >
            {showForm && !editingId ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm && !editingId ? "Close" : "Add User"}
          </button>
        </div>

        {showForm && (
          <div className="p-5 sm:p-6 bg-indigo-50/40 border-b border-indigo-100 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-indigo-600">
              {editingId ? <UserCog className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <h3 className="text-sm font-bold">{editingId ? "Edit User" : "Create New User"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={inputClass}
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {editingId ? "New Password (leave blank to keep)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  placeholder={editingId ? "••••••••" : ""}
                  className={inputClass}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-200 disabled:opacity-50"
                  checked={form.is_admin}
                  disabled={isEditingSelf}
                  onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                />
                <span className="text-sm font-semibold text-slate-700">
                  Grant admin privileges
                  {isEditingSelf && (
                    <span className="text-slate-400 font-normal"> (you can&apos;t change your own)</span>
                  )}
                </span>
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 brand-gradient text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lift transition hover:opacity-95 disabled:opacity-60"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? "Saving..." : editingId ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isFetching && users.length === 0 ? (
          <div className="p-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {users.map((u) => {
              const isSelf = u.username === currentUsername;
              return (
                <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-slate-50/70 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="brand-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0">
                      {u.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-slate-900 truncate">{u.username}</p>
                        {isSelf && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        )}
                      </div>
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      aria-label={`Edit ${u.username}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 active:scale-90 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => handleDelete(u)}
                        aria-label={`Delete ${u.username}`}
                        className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 active:scale-90 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="p-16 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
                <p className="text-sm font-medium">No users found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
