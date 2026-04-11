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
      const base64Data = await generateThesisWordDocument(formData);
      
      // Convert Base64 back to Blob on client
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

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
    <Card className="border-white/20 shadow-3xl transition-all hover:border-blue-500/40 bg-white/40 backdrop-blur-xl overflow-hidden rounded-[2.5rem] group relative">
      {/* Background Institutional Seal (Subtle) */}
      <div className="absolute -top-12 -right-12 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-1000 pointer-events-none">
          <GraduationCap className="h-64 w-64 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
      </div>

      <CardHeader className="p-10 pb-6 relative z-10">
        <div className="flex items-center gap-5">
            <div className="p-4 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-700">
                <Sparkles className="h-7 w-7 text-blue-600 fill-blue-600/10 animate-pulse" />
            </div>
            <div className="space-y-1">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-slate-900 transition-colors">Excellence Académique</CardTitle>
                <CardDescription className="text-xl font-black uppercase tracking-tighter text-slate-900">Génération de Mémoire</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="px-10 pb-10 space-y-8 relative z-10">
        <div className="p-6 rounded-2xl bg-white/30 border border-white/40 shadow-inner backdrop-blur-sm">
            <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-wide opacity-80">
                Structure de 40+ pages incluant Introduction, Cadre CNRCT, Méthodologie et Analyse Automatisée au standard LMD.
            </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              className={cn(
                "w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white px-8 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-slate-900/40 active:scale-95 transition-all gap-4"
              )}
            >
              <FileText className="h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
              Initialiser mon Manuscrit (.docx)
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] border-white/10 p-0 overflow-hidden bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl">
            <form onSubmit={handleExport} className="flex flex-col">
              <DialogHeader className="bg-slate-900 p-8 text-white text-left">
                <DialogTitle className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3">
                    <GraduationCap className="h-7 w-7 text-blue-400" />
                    Manuscrit Académique
                </DialogTitle>
                <DialogDescription className="text-slate-300 font-medium pl-10">
                  Définition des paramètres institutionnels pour l'édition de votre mémoire final.
                </DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Intitulé Officiel du Mémoire</Label>
                  <Input 
                    id="title" 
                    placeholder="Sujet de soutenance..." 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="student" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Étudiant / Candidat</Label>
                    <Input 
                      id="student" 
                      placeholder="Jean Dupont" 
                      required
                      value={formData.studentName}
                      onChange={(e) => setFormData({...formData, studentName: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supervisor" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Maître de Stage</Label>
                    <Input 
                      id="supervisor" 
                      placeholder="Expert CNRCT" 
                      required
                      value={formData.supervisorName}
                      onChange={(e) => setFormData({...formData, supervisorName: e.target.value})}
                      className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="university" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Établissement</Label>
                        <Input 
                            id="university" 
                            placeholder="UFHB, INPHB..." 
                            required
                            value={formData.universityName}
                            onChange={(e) => setFormData({...formData, universityName: e.target.value})}
                            className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="year" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année Académique</Label>
                        <Input 
                            id="year" 
                            placeholder="2023-2024" 
                            required
                            value={formData.academicYear}
                            onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                            className="h-11 rounded-xl border-slate-200 focus:ring-slate-900 font-bold"
                        />
                    </div>
                </div>
              </div>
              <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 sm:flex-row flex-col gap-3">
                <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl font-bold uppercase tracking-widest text-[10px] h-11">Fermer</Button>
                <Button 
                    type="submit" 
                    disabled={exporting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 h-11 rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all gap-2"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Générer le Manuscrit (.docx)
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        
        <p className="text-[8px] text-center text-slate-400 uppercase font-black tracking-[0.3em] opacity-60">
          Validation Instituée • Standard LMD
        </p>
      </CardContent>
    </Card>
  );
}
