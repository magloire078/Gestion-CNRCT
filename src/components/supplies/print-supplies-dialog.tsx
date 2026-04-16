"use client";

import { useState, memo } from "react";
import { 
  Printer, 
  LayoutList, 
  Filter, 
  SortAsc, 
  CheckCircle2, 
  FileText, 
  Eye, 
  Calendar, 
  Package,
  Check,
  ChevronRight
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

export interface PrintOptions {
  includeOutOfStock: boolean;
  includePhotos: boolean;
  showHealthStatus: boolean;
  category: string;
  sortBy: 'name' | 'quantity' | 'category';
  reportTemplate: 'standard' | 'official';
  periodMonth: number;
  periodYear: number;
}

interface PrintSuppliesDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onPrintAction: (options: PrintOptions) => void;
  availableCategories?: string[];
}

export const PrintSuppliesDialog = memo(function PrintSuppliesDialog({ 
  isOpen, 
  onCloseAction, 
  onPrintAction,
  availableCategories = []
}: PrintSuppliesDialogProps) {
  const now = new Date();
  const [options, setOptions] = useState<PrintOptions>({
    includeOutOfStock: true,
    includePhotos: false,
    showHealthStatus: true,
    category: 'all',
    sortBy: 'name',
    reportTemplate: 'official',
    periodMonth: now.getMonth(),
    periodYear: now.getFullYear(),
  });

  const handlePrint = () => {
    onPrintAction(options);
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[520px] rounded-[2rem] border-none shadow-3xl p-0 overflow-hidden bg-white/95 backdrop-blur-2xl">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Printer size={140} strokeWidth={1} />
          </div>
          <DialogHeader className="relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center mb-5 backdrop-blur-xl border border-white/20 shadow-2xl">
               <FileText className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tight uppercase italic leading-none">
                Configuration <span className="text-emerald-400">Audit</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none mt-2">
              Génération du Procès-Verbal d'Inventaire Institutionnel
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Report Template Selection */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <LayoutList className="h-4 w-4" />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Modèle de Rapport</Label>
                </div>
                <div className="h-px flex-grow mx-4 bg-slate-100" />
              </div>

              <RadioGroup 
                value={options.reportTemplate} 
                onValueChange={(v: any) => setOptions(prev => ({ ...prev, reportTemplate: v }))}
                className="grid grid-cols-2 gap-4"
              >
                  <div>
                      <RadioGroupItem value="standard" id="standard" className="sr-only" />
                      <Label 
                        htmlFor="standard"
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 gap-3",
                            options.reportTemplate === 'standard' 
                                ? "border-emerald-500 bg-emerald-50/50 shadow-lg shadow-emerald-500/10" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                              options.reportTemplate === 'standard' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                          )}>
                              <LayoutList className="h-5 w-5" />
                          </div>
                          <div className="text-center">
                              <p className="font-black text-[11px] uppercase tracking-tight">Standard</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase leading-tight mt-1">Tableau Simple</p>
                          </div>
                          {options.reportTemplate === 'standard' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      </Label>
                  </div>

                  <div>
                      <RadioGroupItem value="official" id="official" className="sr-only" />
                      <Label 
                        htmlFor="official"
                        className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border-2 cursor-pointer transition-all duration-300 gap-3",
                            options.reportTemplate === 'official' 
                                ? "border-slate-900 bg-slate-900 text-white shadow-lg shadow-slate-900/20" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
                              options.reportTemplate === 'official' ? "bg-white text-slate-900" : "bg-slate-100 text-slate-400"
                          )}>
                              <Package className="h-5 w-5" />
                          </div>
                          <div className="text-center">
                              <p className="font-black text-[11px] uppercase tracking-tight">Officiel CNRCT</p>
                              <p className={cn("text-[9px] font-bold uppercase leading-tight mt-1", options.reportTemplate === 'official' ? "text-slate-400" : "text-slate-400")}>PV d'Audit complet</p>
                          </div>
                          {options.reportTemplate === 'official' && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </Label>
                  </div>
              </RadioGroup>
          </div>

          {/* Section 2: Visual Options */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <Eye className="h-4 w-4" />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Options d'Affichage</Label>
                </div>
                <div className="h-px flex-grow mx-4 bg-slate-100" />
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 divide-y divide-slate-100">
                <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="photos" className="text-xs font-black uppercase tracking-tight text-slate-900">Photos des Articles</Label>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Générer un catalogue visuel</span>
                    </div>
                    <Switch 
                        id="photos" 
                        checked={options.includePhotos} 
                        onCheckedChange={(val) => setOptions(prev => ({ ...prev, includePhotos: val }))}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="health" className="text-xs font-black uppercase tracking-tight text-slate-900">Indicateurs de Santé</Label>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Calcul automatique des alertes</span>
                    </div>
                    <Switch 
                        id="health" 
                        checked={options.showHealthStatus} 
                        onCheckedChange={(val) => setOptions(prev => ({ ...prev, showHealthStatus: val }))}
                        className="data-[state=checked]:bg-emerald-600"
                    />
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50/10">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="stock" className="text-xs font-black uppercase tracking-tight text-slate-900">Historique des Ruptures</Label>
                        <span className="text-[9px] text-red-400/70 font-bold uppercase tracking-widest italic">Inclure les stocks épuisés</span>
                    </div>
                    <Switch 
                        id="stock" 
                        checked={options.includeOutOfStock} 
                        onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeOutOfStock: val }))}
                        className="data-[state=checked]:bg-red-600"
                    />
                </div>
              </div>
          </div>

          {/* Section 3: Parameters */}
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="h-4 w-4" />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Périmètre & Tri</Label>
                </div>
                <div className="h-px flex-grow mx-4 bg-slate-100" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie</Label>
                    <Select value={options.category} onValueChange={(v) => setOptions(prev => ({ ...prev, category: v }))}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm focus:ring-emerald-500">
                            <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="all">Fonds Global</SelectItem>
                            {availableCategories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3">
                    <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Tri des articles</Label>
                    <Select value={options.sortBy} onValueChange={(v: any) => setOptions(prev => ({ ...prev, sortBy: v }))}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm focus:ring-emerald-500">
                            <SelectValue placeholder="Désignation" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                            <SelectItem value="name">Désignation A-Z</SelectItem>
                            <SelectItem value="quantity">Quantité (Décroissant)</SelectItem>
                            <SelectItem value="category">Groupe / Catégorie</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <Label className="text-[10px] font-black uppercase tracking-widest">Période d'Audit</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <Select 
                        value={options.periodMonth.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodMonth: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-black uppercase">
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select 
                        value={options.periodYear.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodYear: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-10 bg-white border-slate-200 rounded-lg text-xs font-black uppercase">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {[2024, 2025, 2026].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
              </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50/80 border-t border-slate-100 p-8 flex flex-col sm:flex-row gap-4 items-center">
          <Button 
            variant="ghost" 
            onClick={onCloseAction} 
            className="w-full sm:w-auto rounded-xl font-bold text-slate-500 h-14 px-8 hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
          >
            Annuler
          </Button>
          <Button 
            onClick={handlePrint} 
            className="w-full sm:flex-grow bg-slate-900 text-white rounded-[1.2rem] font-black h-14 px-10 shadow-2xl hover:bg-emerald-600 transition-all border-none uppercase tracking-[0.2em] text-[11px] gap-3 relative group"
          >
            <Check className="h-4 w-4 transition-transform group-hover:scale-125" /> 
            Générer le Rapport Officiel
            <ChevronRight className="h-4 w-4 ml-2 opacity-30 group-hover:translate-x-1 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
