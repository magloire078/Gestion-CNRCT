"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, RefreshCcw, Sparkles, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncDefaultRoles } from "@/services/role-service";

export function SyncRolesCard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncDefaultRoles();
      setLastSynced(new Date());
      toast({
        title: "Synchronisation réussie",
        description: "Les profils et permissions institutionnels par défaut ont été réalignés avec succès.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la synchronisation des rôles.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-white/20 shadow-md transition-all hover:border-emerald-500/30 bg-white/40 backdrop-blur-xl rounded-lg overflow-hidden relative group">
      {/* Decorative institutional glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
      
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm text-emerald-600 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold uppercase tracking-tight text-slate-900">
                Sécurité & Intégrité des Profils
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Conforme
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Réaligne automatiquement les habilitations avec les protocoles de sécurité institutionnels par défaut.
              {lastSynced && (
                <span className="block text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Dernière synchronisation effectuée aujourd'hui à {lastSynced.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="h-10 px-5 rounded-md bg-slate-900 hover:bg-black text-white transition-all font-bold uppercase tracking-wider text-xs shadow-md active:scale-95 group/btn flex items-center gap-2"
          >
            {isSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
            ) : (
              <RefreshCcw className="h-4 w-4 group-hover/btn:rotate-180 transition-transform duration-700 text-emerald-400" />
            )}
            <span>{isSyncing ? "Synchronisation en cours..." : "Synchroniser les Profils"}</span>
          </Button>
        </div>
      </div>
    </Card>
  );
}

