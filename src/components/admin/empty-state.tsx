import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  message: string;
}

export function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center bg-card/40 backdrop-blur-md rounded-3xl border border-white/10 shadow-xl overflow-hidden group">
      <div className="h-16 w-16 rounded-2xl bg-slate-900/5 flex items-center justify-center border border-slate-900/10 shadow-inner group-hover:scale-105 transition-transform">
        <Icon className="h-8 w-8 text-slate-400 group-hover:text-slate-900 transition-colors" />
      </div>
      <p className="text-sm font-black uppercase tracking-widest text-slate-400 max-w-[250px] leading-relaxed">{message}</p>
    </div>
  );
}
