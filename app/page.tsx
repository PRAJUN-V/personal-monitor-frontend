"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  HeartPulse,
  Settings as SettingsIcon,
  Shield,
  Wallet,
  XCircle,
} from "lucide-react";
import { api, clearToken, getToken, setToken, UnauthorizedError } from "@/lib/api";
import type {
  HealthRecord,
  NotificationState,
  Source,
  Transaction,
  UserProfile,
} from "@/lib/types";
import Login from "@/components/Login";
import HealthMonitor from "@/components/HealthMonitor";
import FinanceTracker from "@/components/FinanceTracker";
import Settings from "@/components/Settings";
import AdminPanel from "@/components/AdminPanel";

type Tab = "health" | "finance" | "admin" | "settings";

const ALL_TABS: { id: Tab; label: string; icon: typeof HeartPulse; adminOnly?: boolean }[] = [
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "admin", label: "Users", icon: Shield, adminOnly: true },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Home() {
  const [ready, setReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("health");

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingHealth, setIsFetchingHealth] = useState(false);
  const [isFetchingFinance, setIsFetchingFinance] = useState(false);
  const [error, setError] = useState("");

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: "",
    type: "success",
  });

  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [healthPage, setHealthPage] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transPage, setTransPage] = useState(0);

  const showNotify = (message: string, type: "success" | "error" = "success") => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification((prev) => ({ ...prev, show: false })), 3000);
  };

  const handleLogout = useCallback(() => {
    clearToken();
    setIsLoggedIn(false);
    setUserProfile(null);
    if (typeof window !== "undefined") window.location.hash = "#health";
    showNotify("Signed out");
  }, []);

  const guard = useCallback(
    (err: unknown) => {
      if (err instanceof UnauthorizedError) {
        handleLogout();
        return true;
      }
      return false;
    },
    [handleLogout],
  );

  useEffect(() => {
    setIsLoggedIn(!!getToken());
    setReady(true);

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "") as Tab;
      if (["health", "finance", "admin", "settings"].includes(hash)) setActiveTab(hash);
      else window.location.hash = "#health";
    };
    if (!window.location.hash) window.location.hash = "#health";
    else handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    try {
      setUserProfile(await api.me());
    } catch (err) {
      guard(err);
    }
  }, [guard]);

  const fetchHealthRecords = useCallback(async () => {
    setIsFetchingHealth(true);
    try {
      setHealthRecords(await api.listHealth(healthPage));
    } catch (err) {
      guard(err);
    } finally {
      setIsFetchingHealth(false);
    }
  }, [healthPage, guard]);

  const fetchSources = useCallback(async () => {
    try {
      setSources(await api.listSources());
    } catch (err) {
      guard(err);
    }
  }, [guard]);

  const fetchTransactions = useCallback(async () => {
    setIsFetchingFinance(true);
    try {
      setTransactions(await api.listTransactions(transPage));
    } catch (err) {
      guard(err);
    } finally {
      setIsFetchingFinance(false);
    }
  }, [transPage, guard]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchUserProfile();
    if (activeTab === "health") fetchHealthRecords();
    if (activeTab === "finance") {
      fetchSources();
      fetchTransactions();
    }
  }, [isLoggedIn, activeTab, healthPage, transPage, fetchUserProfile, fetchHealthRecords, fetchSources, fetchTransactions]);

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError("");
    try {
      const token = await api.login(username, password);
      setToken(token);
      setIsLoggedIn(true);
      showNotify("Logged in successfully!");
    } catch {
      setError("Invalid username or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHealthSave = async (
    form: { date: string; height: string; weight: string; bp_systolic: string; bp_diastolic: string },
    editingId: number | null,
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const payload = {
        date: form.date,
        height: parseFloat(String(form.height)),
        weight: parseFloat(String(form.weight)),
        bp_systolic: form.bp_systolic === "" ? null : parseInt(String(form.bp_systolic), 10),
        bp_diastolic: form.bp_diastolic === "" ? null : parseInt(String(form.bp_diastolic), 10),
      };
      if (editingId) await api.updateHealth(editingId, payload);
      else await api.createHealth(payload);
      await fetchHealthRecords();
      showNotify(editingId ? "Update successful!" : "Health record saved!");
      return true;
    } catch (err) {
      if (!guard(err)) showNotify((err as Error).message || "Failed to save data", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleHealthDelete = async (id: number) => {
    try {
      await api.deleteHealth(id);
      await fetchHealthRecords();
      showNotify("Record deleted");
    } catch (err) {
      if (!guard(err)) showNotify("Delete failed", "error");
    }
  };

  const handleAddSource = async (form: { name: string; balance: string }): Promise<boolean> => {
    setIsSaving(true);
    try {
      await api.createSource({ name: form.name, balance: parseFloat(form.balance) || 0 });
      await fetchSources();
      showNotify(`Source "${form.name}" added!`);
      return true;
    } catch (err) {
      if (!guard(err)) showNotify("Failed to add source", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSource = async (
    id: number,
    form: { name: string; balance: string },
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      await api.updateSource(id, { name: form.name, balance: parseFloat(form.balance) || 0 });
      // Refresh transactions too, since a renamed source shows in the activity feed.
      await Promise.all([fetchSources(), fetchTransactions()]);
      showNotify("Source updated");
      return true;
    } catch (err) {
      if (!guard(err)) showNotify("Failed to update source", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTransaction = async (form: {
    source_id: string;
    amount: string;
    type: string;
    category: string;
    description: string;
    date: string;
  }): Promise<boolean> => {
    setIsSaving(true);
    try {
      await api.createTransaction({
        source_id: parseInt(form.source_id, 10),
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.category,
        description: form.description,
        date: form.date,
      });
      await Promise.all([fetchSources(), fetchTransactions()]);
      showNotify("Transaction successful!");
      return true;
    } catch (err) {
      if (!guard(err)) showNotify("Transaction failed", "error");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleTransDelete = async (id: number) => {
    try {
      await api.deleteTransaction(id);
      await Promise.all([fetchSources(), fetchTransactions()]);
      showNotify("Transaction removed");
    } catch (err) {
      if (!guard(err)) showNotify("Failed to delete", "error");
    }
  };

  // If a non-admin lands on the admin tab (e.g. via #admin), send them home.
  useEffect(() => {
    if (isLoggedIn && userProfile && !userProfile.is_admin && activeTab === "admin") {
      window.location.hash = "#health";
    }
  }, [isLoggedIn, userProfile, activeTab]);

  if (!ready) return null;
  if (!isLoggedIn) return <Login onLogin={handleLogin} isLoading={isLoading} error={error} />;

  const initial = userProfile?.username?.[0]?.toUpperCase() ?? "?";
  const tabs = ALL_TABS.filter((t) => !t.adminOnly || userProfile?.is_admin);

  return (
    <div className="min-h-screen pb-32 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-zinc-800/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="brand-gradient p-2 rounded-xl shadow-lift">
              <Activity className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-zinc-50 tracking-tight text-lg">
              Monitor
            </span>
          </div>

          {/* Desktop segmented nav */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 rounded-2xl p-1 border border-zinc-800/80">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => (window.location.hash = `#${id}`)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                  activeTab === id
                    ? "bg-zinc-800 text-zinc-50 shadow-soft"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                Signed in
              </p>
              <p className="text-sm font-bold text-zinc-200">{userProfile?.username}</p>
            </div>
            <div className="brand-gradient w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lift">
              {initial}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 animate-fade-in-up">
        {activeTab === "health" && (
          <HealthMonitor
            records={healthRecords}
            page={healthPage}
            onPageChange={setHealthPage}
            onSave={handleHealthSave}
            onDelete={handleHealthDelete}
            isSaving={isSaving}
            isFetching={isFetchingHealth}
          />
        )}
        {activeTab === "finance" && (
          <FinanceTracker
            sources={sources}
            transactions={transactions}
            page={transPage}
            onPageChange={setTransPage}
            onAddSource={handleAddSource}
            onUpdateSource={handleUpdateSource}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleTransDelete}
            isSaving={isSaving}
            isFetching={isFetchingFinance}
          />
        )}
        {activeTab === "admin" && userProfile?.is_admin && (
          <AdminPanel
            currentUsername={userProfile.username}
            onNotify={showNotify}
            onUnauthorized={handleLogout}
          />
        )}
        {activeTab === "settings" && <Settings userProfile={userProfile} onLogout={handleLogout} />}
      </main>

      {/* Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-80 z-[100] animate-slide-in-right">
          <div
            className={`p-4 rounded-2xl shadow-glow border flex items-center gap-3 ${
              notification.type === "success"
                ? "bg-zinc-900 border-emerald-900/60"
                : "bg-zinc-900 border-rose-900/60"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <p className="text-sm font-bold text-zinc-200">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Floating mobile nav (safe-area aware) */}
      <div
        className="md:hidden fixed left-1/2 -translate-x-1/2 w-[92%] max-w-sm glass rounded-2xl shadow-glow border border-zinc-800/80 p-1.5 flex justify-around items-center z-50"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => (window.location.hash = `#${id}`)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[52px] rounded-xl transition active:scale-95 ${
              activeTab === id
                ? "brand-gradient text-white shadow-lift"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Icon className="w-[22px] h-[22px]" />
            <span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
