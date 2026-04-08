"use client";

import React, { useState } from "react";
import { FileText, Download, Loader2, Sparkles, GraduationCap } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { generateThesisWordDocument, ThesisOptions } from "@/services/thesis-service";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ThesisCard() {
  const [exporting, setExporting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ThesisOptions>({
    studentName: "",
    supervisorName: "",
    universityName: "Université Félix Houphouët-Boigny",
    academicYear: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    title: "",
  });

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.studentName || !formData.supervisorName || !formData.universityName) {
        toast({
            variant: "destructive",
            title: "Champs manquants",
            description: "Veuillez remplir les informations obligatoires pour votre mémoire.",
        });
        return;
    }

    setExporting(true);
    try {
      const blob = await generateThesisWordDocument(formData);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Memoire_Final_${formData.studentName.replace(/\s+/g, '_')}_${new Date().getFullYear()}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setOpen(false);
      toast({
        title: "Mémoire généré avec succès",
        description: "Votre document Word complet est prêt pour la rédaction.",
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
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <GraduationCap className="h-24 w-24 text-blue-600 rotate-12 translate-x-8 -translate-y-4" />
        </div>
        
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />
          Mémoire de Soutenance
        </CardTitle>
        <CardDescription>
          Générez un canevas complet de 40+ pages incluant la structure académique, les graphiques et vos informations personnelles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-xs text-blue-800 leading-relaxed font-medium">
          Format académique : Introduction, Cadre institutionnel (CNRCT), Méthodologie, Analyse des données et Recommandations.
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className={cn(
                "w-full h-12 gap-3 text-base font-bold transition-all shadow-lg active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
              )}
            >
              <FileText className="h-5 w-5" />
              Personnaliser mon Mémoire (.docx)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleExport}>
              <DialogHeader>
                <DialogTitle>Informations du Mémoire</DialogTitle>
                <DialogDescription>
                  Ces détails seront intégrés automatiquement dans la page de garde et les remerciements de votre document.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Titre du Mémoire (Optionnel)</Label>
                  <Input 
                    id="title" 
                    placeholder="La transformation numérique de..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="student">Votre Nom Complet</Label>
                    <Input 
                      id="student" 
                      placeholder="Jean Dupont" 
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="supervisor">Maître de Stage / Encadrant</Label>
                    <Input 
                      id="supervisor" 
                      placeholder="Dr. Kouassi" 
                      required
                      value={formData.supervisorName}
                      onChange={(e) => setFormData({...formData, supervisorName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="university">Université / Institut</Label>
                  <Input 
                    id="university" 
                    placeholder="Université Félix Houphouët-Boigny" 
                    required
                    value={formData.universityName}
                    onChange={(e) => setFormData({...formData, universityName: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year">Année Académique</Label>
                  <Input 
                    id="year" 
                    placeholder="2023-2024" 
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                    type="submit" 
                    disabled={exporting}
                    className="w-full bg-green-600 hover:bg-green-700"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Génération du document complexe...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Générer le Mémoire Final
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest opacity-60 italic">
          Généré selon les standards académiques LMD
        </p>
      </CardContent>
    </Card>
  );
}
