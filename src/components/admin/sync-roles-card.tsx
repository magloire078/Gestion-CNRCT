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
    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-emerald-500/10">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <CardTitle className="font-bold">Sécurité des Profils</CardTitle>
        </div>
        <CardDescription>
          Synchronisez les rôles et permissions par défaut avec le code source pour garantir la sécurité.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Cette action écrasera les permissions des rôles standards par les définitions sécurisées du système.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSync} 
          disabled={isSyncing}
          variant="outline"
          className="w-full border-emerald-500/20 hover:bg-emerald-500/5 hover:text-emerald-700 transition-all font-bold"
        >
          {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
          {isSyncing ? "Synchronisation..." : "Synchroniser les Profils"}
        </Button>
      </CardFooter>
    </Card>
  );
}
