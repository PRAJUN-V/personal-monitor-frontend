"use client";

import { LogOut, ShieldCheck, UserCircle2 } from "lucide-react";
import type { UserProfile } from "@/lib/types";

interface SettingsProps {
  userProfile: UserProfile | null;
  onLogout: () => void;
}

export default function Settings({ userProfile, onLogout }: SettingsProps) {
  const initial = userProfile?.username?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-md mx-auto animate-fade-in-up">
      <div className="text-center mb-8">
        <div className="surface p-6 mb-5 inline-flex text-zinc-300">
          <UserCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-zinc-50">Settings</h2>
        <p className="text-zinc-400 mt-1.5">Manage your account and preferences.</p>
      </div>

      <div className="surface overflow-hidden">
        <div className="brand-gradient p-6 text-white flex items-center gap-4">
          <div className="bg-white/10 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl border border-white/10">
            {initial}
          </div>
          <div>
            <p className="font-bold text-lg leading-tight">{userProfile?.username}</p>
            <div className="flex items-center gap-1.5 text-white/70 text-xs mt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-semibold">Personal Monitor Member</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-zinc-500">Username</span>
            <span className="text-sm font-bold text-zinc-100">{userProfile?.username}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-zinc-800">
            <span className="text-sm font-semibold text-zinc-500">Plan</span>
            <span className="text-sm font-bold text-zinc-100">Personal</span>
          </div>

          <button
            onClick={onLogout}
            className="w-full mt-2 bg-rose-950/50 text-rose-400 font-bold py-3 rounded-2xl hover:bg-rose-950/80 border border-rose-900/50 transition flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
