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
  ChevronRight,
  Settings2
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
      <DialogContent className="sm:max-w-3xl rounded-[2.5rem] border-none shadow-3xl p-0 overflow-hidden bg-white/95 backdrop-blur-3xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 md:p-10 text-white relative">
          <div className="absolute top-0 right-10 p-4 opacity-5 h-full flex items-center">
             <Printer size={160} strokeWidth={0.5} />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                   <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                    <DialogTitle className="text-3xl font-black tracking-tight uppercase italic leading-none">
                        Configuration <span className="text-emerald-400">Audit</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[11px] tracking-[0.2em] leading-none mt-2">
                      Génération du PV d'Inventaire Institutionnel
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-8 md:p-10 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Report Template Selection */}
          <div className="space-y-6">
              <div className="flex items-center gap-3 text-slate-400">
                  <LayoutList className="h-4 w-4" />
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em]">Choix du Modèle de Document</Label>
                  <div className="h-px flex-grow bg-slate-100 ml-2" />
              </div>

              <RadioGroup 
                value={options.reportTemplate} 
                onValueChange={(v: any) => setOptions(prev => ({ ...prev, reportTemplate: v }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                  <div>
                      <RadioGroupItem value="standard" id="standard" className="sr-only" />
                      <Label 
                        htmlFor="standard"
                        className={cn(
                            "flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 gap-5 relative group",
                            options.reportTemplate === 'standard' 
                                ? "border-emerald-500 bg-emerald-50/30 shadow-xl shadow-emerald-500/5" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center box-shadow transition-colors",
                              options.reportTemplate === 'standard' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-100 text-slate-400"
                          )}>
                              <LayoutList className="h-6 w-6" />
                          </div>
                          <div className="flex-grow">
                              <p className="font-black text-xs uppercase tracking-tight text-slate-900">Modèle Standard</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight mt-1">Liste d'inventaire rapide</p>
                          </div>
                          {options.reportTemplate === 'standard' && <div className="bg-emerald-500 p-1 rounded-full"><Check className="h-3 w-3 text-white" /></div>}
                      </Label>
                  </div>

                  <div>
                      <RadioGroupItem value="official" id="official" className="sr-only" />
                      <Label 
                        htmlFor="official"
                        className={cn(
                            "flex items-center p-6 rounded-3xl border-2 cursor-pointer transition-all duration-300 gap-5 relative group",
                            options.reportTemplate === 'official' 
                                ? "border-slate-900 bg-slate-900 text-white shadow-2xl shadow-slate-900/30" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                              options.reportTemplate === 'official' ? "bg-white text-slate-900 shadow-lg" : "bg-slate-100 text-slate-400"
                          )}>
                              <Package className="h-6 w-6" />
                          </div>
                          <div className="flex-grow">
                              <p className="font-black text-xs uppercase tracking-tight">Officiel CNRCT</p>
                              <p className={cn("text-[10px] font-bold uppercase leading-tight mt-1", options.reportTemplate === 'official' ? "text-slate-400 font-medium" : "text-slate-400")}>PV d'Audit avec page de garde</p>
                          </div>
                          {options.reportTemplate === 'official' && <div className="bg-emerald-400 p-1 rounded-full"><Check className="h-3 w-3 text-slate-900 font-black" /></div>}
                      </Label>
                  </div>
              </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Left Column: Visual Options */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Settings2 className="h-4 w-4" />
                    <Label className="text-[11px] font-black uppercase tracking-[0.15em]">Paramètres de Rendu</Label>
                </div>

                <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <Label htmlFor="photos" className="text-[11px] font-black uppercase tracking-tight text-slate-900">Photos Articles</Label>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Catalogue visuel</span>
                        </div>
                        <Switch 
                            id="photos" 
                            checked={options.includePhotos} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, includePhotos: val }))}
                            className="data-[state=checked]:bg-emerald-500 shadow-sm"
                        />
                    </div>
                    <div className="h-px bg-slate-200/50" />
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <Label htmlFor="health" className="text-[11px] font-black uppercase tracking-tight text-slate-900">Santé du Stock</Label>
                            <span className="text-[9px] text-slate-400 font-bold uppercase">Alertes & Jauges</span>
                        </div>
                        <Switch 
                            id="health" 
                            checked={options.showHealthStatus} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showHealthStatus: val }))}
                            className="data-[state=checked]:bg-emerald-500 shadow-sm"
                        />
                    </div>
                    <div className="h-px bg-slate-200/50" />
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-0.5">
                            <Label htmlFor="stock" className="text-[11px] font-black uppercase tracking-tight text-slate-900">Ruptures (0)</Label>
                            <span className="text-[9px] text-slate-400 font-bold uppercase italic">Inclure historique</span>
                        </div>
                        <Switch 
                            id="stock" 
                            checked={options.includeOutOfStock} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeOutOfStock: val }))}
                            className="data-[state=checked]:bg-red-500 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Parameters */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 text-slate-400">
                    <Filter className="h-4 w-4" />
                    <Label className="text-[11px] font-black uppercase tracking-[0.15em]">Périmètre & Analyse</Label>
                </div>

                <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie</Label>
                        <Select value={options.category} onValueChange={(v) => setOptions(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm focus:ring-emerald-500 transition-all hover:bg-slate-50">
                                <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-3xl">
                                <SelectItem value="all">Fonds Global (Tous les articles)</SelectItem>
                                {availableCategories.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Ordre de tri</Label>
                        <Select value={options.sortBy} onValueChange={(v: any) => setOptions(prev => ({ ...prev, sortBy: v }))}>
                            <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm focus:ring-emerald-500 transition-all hover:bg-slate-50">
                                <SelectValue placeholder="Désignation" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-slate-100 shadow-3xl">
                                <SelectItem value="name">Désignation (A-Z)</SelectItem>
                                <SelectItem value="quantity">Quantité (Stock Critique)</SelectItem>
                                <SelectItem value="category">Groupe / Catégorie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
          </div>

          {/* Section 4: Period Management */}
          <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <Label className="text-[11px] font-black uppercase tracking-[0.15em]">Période de Référence du Rapport</Label>
                  <div className="h-px flex-grow bg-slate-100 ml-2" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-slate-50 border border-slate-100 rounded-[2rem] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 text-slate-900">
                    <Calendar size={80} />
                </div>
                <div className="space-y-3 relative z-10">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mois d'Audit</Label>
                    <Select 
                        value={options.periodMonth.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodMonth: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tighter shadow-sm">
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-3 relative z-10">
                    <Label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Année Fiscale</Label>
                    <Select 
                        value={options.periodYear.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodYear: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-12 bg-white border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-tighter shadow-sm">
                            <SelectValue placeholder="Année" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            {[2024, 2025, 2026].map(y => (
                                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50/80 border-t border-slate-100 p-8 md:p-10 flex flex-col sm:flex-row gap-4 items-center">
          <Button 
            variant="ghost" 
            onClick={onCloseAction} 
            className="w-full sm:w-auto rounded-2xl font-black text-slate-400 h-16 px-10 hover:bg-slate-100 transition-all uppercase text-[11px] tracking-widest"
          >
            Annuler
          </Button>
          <Button 
            onClick={handlePrint} 
            className="w-full sm:flex-grow bg-slate-900 text-white rounded-[1.5rem] font-black h-16 px-12 shadow-3xl hover:bg-emerald-600 transition-all border-none uppercase tracking-[0.2em] text-[12px] gap-4 relative group overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform translate-y-full group-hover:translate-y-0 transition-transform" />
            <Printer className="h-5 w-5 transition-transform group-hover:scale-110" /> 
            Générer le Document Officiel
            <ChevronRight className="h-5 w-5 ml-2 opacity-30 group-hover:translate-x-2 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
