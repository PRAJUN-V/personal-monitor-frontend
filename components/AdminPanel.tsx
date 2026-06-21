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
import ConfirmDialog from "./ConfirmDialog";

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

export default function AdminPanel({ currentUsername, onNotify, onUnauthorized }: AdminPanelProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm());
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null);

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
      <div className="surface overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="bg-zinc-800 text-zinc-200 p-2 rounded-xl border border-zinc-700/80">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-50">User Management</h2>
              <p className="text-xs text-zinc-500 font-medium">Admin only</p>
            </div>
          </div>
          <button
            onClick={() => (showForm && !editingId ? closeForm() : openAdd())}
            className="flex items-center gap-1.5 btn-primary px-4 py-2 text-sm"
          >
            {showForm && !editingId ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {showForm && !editingId ? "Close" : "Add User"}
          </button>
        </div>

        {showForm && (
          <div className="p-5 sm:p-6 bg-zinc-950/50 border-b border-zinc-800 animate-fade-in">
            <div className="flex items-center gap-2 mb-4 text-zinc-300">
              {editingId ? <UserCog className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <h3 className="text-sm font-bold">{editingId ? "Edit User" : "Create New User"}</h3>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-field">Username</label>
                <input
                  type="text"
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="input-field"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">
                  {editingId ? "New Password (leave blank to keep)" : "Password"}
                </label>
                <input
                  type="password"
                  required={!editingId}
                  placeholder={editingId ? "••••••••" : ""}
                  className="input-field"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <label className="md:col-span-2 flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded-md border-zinc-600 bg-zinc-900 text-zinc-200 focus:ring-zinc-600 disabled:opacity-50"
                  checked={form.is_admin}
                  disabled={isEditingSelf}
                  onChange={(e) => setForm({ ...form, is_admin: e.target.checked })}
                />
                <span className="text-sm font-semibold text-zinc-300">
                  Grant admin privileges
                  {isEditingSelf && (
                    <span className="text-zinc-500 font-normal"> (you can&apos;t change your own)</span>
                  )}
                </span>
              </label>
              <div className="md:col-span-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 btn-primary px-6 py-2.5 text-sm"
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
              <div key={i} className="h-14 bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {users.map((u) => {
              const isSelf = u.username === currentUsername;
              return (
                <div key={u.id} className="p-4 sm:p-5 flex items-center justify-between gap-3 hover:bg-zinc-800/30 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="brand-gradient w-10 h-10 rounded-xl flex items-center justify-center text-white font-black shrink-0">
                      {u.username[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-zinc-100 truncate">{u.username}</p>
                        {isSelf && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-700">
                            You
                          </span>
                        )}
                      </div>
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                          Member
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(u)}
                      aria-label={`Edit ${u.username}`}
                      className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 active:scale-90 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => setPendingDelete(u)}
                        aria-label={`Delete ${u.username}`}
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/50 active:scale-90 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="p-16 text-center text-zinc-500">
                <Users className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                <p className="text-sm font-medium">No users found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete user?"
        message={
          pendingDelete
            ? `"${pendingDelete.username}" will be permanently deleted along with their data. This cannot be undone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) handleDelete(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
