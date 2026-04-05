"use client";

import React, { useState } from "react";
import { FileText, Download, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { generateThesisWordDocument } from "@/services/thesis-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ThesisCard() {
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await generateThesisWordDocument();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Memoire_Gestion_Conflits_${new Date().getFullYear()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Exportation réussie",
        description: "Votre mémoire Word a été généré avec les dernières données système.",
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        variant: "destructive",
        title: "Erreur d'exportation",
        description: "Une erreur est survenue lors de la génération du document.",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md bg-card/50 backdrop-blur-sm overflow-hidden group">
      <CardHeader className="relative">
        {/* Effet visuel Premium */}
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <FileText className="h-24 w-24 text-blue-600 rotate-12 translate-x-8 -translate-y-4" />
        </div>
        
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
          Support au Mémoire
        </CardTitle>
        <CardDescription>
          Générez une base structurée incluant l'analyse géographique et les détails des résolutions de médiation au format Microsoft Word.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 leading-relaxed uppercase tracking-wider font-semibold">
          Données dynamiques : Les statistiques et graphiques du document se mettent à jour automatiquement en fonction de l'état actuel de la base de données.
        </div>
        
        <Button 
          onClick={handleExport} 
          disabled={exporting}
          className={cn(
            "w-full h-12 gap-3 text-base font-bold transition-all shadow-lg active:scale-95",
            exporting 
              ? "bg-muted cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700 text-white"
          )}
        >
          {exporting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Génération en cours...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Télécharger mon Mémoire (.docx)
            </>
          )}
        </Button>
        <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest opacity-60">
          Inspiré du standard MGP & CNRCT
        </p>
      </CardContent>
    </Card>
  );
}
