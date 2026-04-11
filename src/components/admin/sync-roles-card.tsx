"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, RefreshCcw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { syncDefaultRoles } from "@/services/role-service";

export function SyncRolesCard() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncDefaultRoles();
      toast({
        title: "Synchronisation réussie",
        description: "Les profils et permissions par défaut ont été mis à jour dans la base de données.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erreur de synchronisation",
        description: "Une erreur est survenue lors de la mise à jour des rôles.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-white/20 shadow-3xl transition-all hover:border-emerald-500/40 bg-white/40 backdrop-blur-xl group rounded-[2.5rem] overflow-hidden relative">
      {/* Decorative institutional glow */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700" />
      
      <CardHeader className="p-10 pb-6 relative z-10">
        <div className="flex items-center gap-5">
          <div className="p-4 rounded-[1.5rem] bg-emerald-500/10 border border-emerald-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
            <ShieldCheck className="h-7 w-7 text-emerald-600" />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black uppercase tracking-tighter text-slate-900">Sécurité des Profils</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600/60 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Intégrité du Système Géo-Tactique
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-10 pb-8 relative z-10">
        <div className="p-6 rounded-2xl bg-white/30 border border-white/40 shadow-inner backdrop-blur-sm">
            <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-wide opacity-80">
            Cette opération de synchronisation réaligne les habilitations avec les protocoles de sécurité institutionnels par défaut. Toute exception sera conservée.
            </p>
        </div>
      </CardContent>
      
      <CardFooter className="p-10 pt-0 relative z-10">
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          variant="outline"
          className="w-full h-14 rounded-2xl border-emerald-600/30 bg-white/50 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-500 font-black uppercase tracking-[0.25em] text-xs shadow-xl active:scale-95 group/btn"
        >
          {isSyncing ? (
            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
          ) : (
            <RefreshCcw className="mr-3 h-5 w-5 group-hover/btn:rotate-180 transition-transform duration-700" />
          )}
          {isSyncing ? "Transmission..." : "Synchroniser les Profils"}
        </Button>
      </CardFooter>
    </Card>
  );
}
