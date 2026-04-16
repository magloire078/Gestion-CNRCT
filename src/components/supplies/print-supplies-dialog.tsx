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
      <DialogContent className="sm:max-w-3xl rounded-[2rem] border-none shadow-3xl p-0 overflow-hidden bg-white/95 backdrop-blur-3xl">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-5 md:p-7 text-white relative">
          <div className="absolute top-0 right-10 p-2 opacity-5 h-full flex items-center">
             <Printer size={120} strokeWidth={0.5} />
          </div>
          <DialogHeader className="relative z-10">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-xl">
                   <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                    <DialogTitle className="text-2xl font-black tracking-tight uppercase italic leading-none">
                        Configuration <span className="text-emerald-400">Audit</span>
                    </DialogTitle>
                    <DialogDescription className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.2em] leading-none mt-1.5">
                      Génération du PV d'Inventaire CNRCT
                    </DialogDescription>
                </div>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Section 1: Report Template Selection */}
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                  <LayoutList className="h-3.5 w-3.5" />
                  <Label className="text-[9px] font-black uppercase tracking-[0.15em]">Modèle de Document</Label>
                  <div className="h-px flex-grow bg-slate-100 ml-2 text-transparent">_</div>
              </div>

              <RadioGroup 
                value={options.reportTemplate} 
                onValueChange={(v: any) => setOptions(prev => ({ ...prev, reportTemplate: v }))}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                  <div>
                      <RadioGroupItem value="standard" id="standard" className="sr-only" />
                      <Label 
                        htmlFor="standard"
                        className={cn(
                            "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 gap-4 relative group",
                            options.reportTemplate === 'standard' 
                                ? "border-emerald-500 bg-emerald-50/30 shadow-lg shadow-emerald-500/5" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                              options.reportTemplate === 'standard' ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30" : "bg-slate-100 text-slate-400"
                          )}>
                              <LayoutList className="h-5 w-5" />
                          </div>
                          <div className="flex-grow">
                              <p className="font-black text-[10px] uppercase tracking-tight text-slate-900">Standard</p>
                              <p className="text-[8px] text-slate-400 font-bold uppercase leading-tight mt-0.5">Tableau Simple</p>
                          </div>
                          {options.reportTemplate === 'standard' && <Check className="h-3 w-3 text-emerald-500" />}
                      </Label>
                  </div>

                  <div>
                      <RadioGroupItem value="official" id="official" className="sr-only" />
                      <Label 
                        htmlFor="official"
                        className={cn(
                            "flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 gap-4 relative group",
                            options.reportTemplate === 'official' 
                                ? "border-slate-900 bg-slate-900 text-white shadow-xl shadow-slate-900/30" 
                                : "border-slate-100 bg-white hover:border-slate-200"
                        )}
                      >
                          <div className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                              options.reportTemplate === 'official' ? "bg-white text-slate-900 shadow-sm" : "bg-slate-100 text-slate-400"
                          )}>
                              <Package className="h-5 w-5" />
                          </div>
                          <div className="flex-grow">
                              <p className="font-black text-[10px] uppercase tracking-tight">Officiel CNRCT</p>
                              <p className={cn("text-[8px] font-bold uppercase leading-tight mt-0.5", options.reportTemplate === 'official' ? "text-slate-400 font-medium" : "text-slate-400")}>PV d'Audit complet</p>
                          </div>
                          {options.reportTemplate === 'official' && <Check className="h-3 w-3 text-emerald-400" />}
                      </Label>
                  </div>
              </RadioGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Visual Options */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Settings2 className="h-3.5 w-3.5" />
                    <Label className="text-[9px] font-black uppercase tracking-[0.15em]">Rendu visuel</Label>
                    <div className="h-px flex-grow bg-slate-100 ml-2 text-transparent">_</div>
                </div>

                <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <Label htmlFor="photos" className="text-[10px] font-black uppercase tracking-tight text-slate-900">Photos</Label>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Catalogue visuel</span>
                        </div>
                        <Switch 
                            id="photos" 
                            checked={options.includePhotos} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, includePhotos: val }))}
                            className="scale-75 data-[state=checked]:bg-emerald-500"
                        />
                    </div>
                    <div className="h-px bg-slate-200/50" />
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <Label htmlFor="health" className="text-[10px] font-black uppercase tracking-tight text-slate-900">Santé Stock</Label>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Alertes & Jauges</span>
                        </div>
                        <Switch 
                            id="health" 
                            checked={options.showHealthStatus} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, showHealthStatus: val }))}
                            className="scale-75 data-[state=checked]:bg-emerald-500"
                        />
                    </div>
                    <div className="h-px bg-slate-200/50" />
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <Label htmlFor="stock" className="text-[10px] font-black uppercase tracking-tight text-slate-900">Ruptures</Label>
                            <span className="text-[8px] text-slate-400 font-bold uppercase italic">Inclure historique</span>
                        </div>
                        <Switch 
                            id="stock" 
                            checked={options.includeOutOfStock} 
                            onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeOutOfStock: val }))}
                            className="scale-75 data-[state=checked]:bg-red-500"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Parameters */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-400">
                    <Filter className="h-3.5 w-3.5" />
                    <Label className="text-[9px] font-black uppercase tracking-[0.15em]">Analyse</Label>
                    <div className="h-px flex-grow bg-slate-100 ml-2 text-transparent">_</div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Catégorie</Label>
                        <Select value={options.category} onValueChange={(v) => setOptions(prev => ({ ...prev, category: v }))}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm text-xs">
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

                    <div className="space-y-1.5">
                        <Label className="text-[8px] font-black uppercase tracking-widest text-slate-400 ml-1">Tri</Label>
                        <Select value={options.sortBy} onValueChange={(v: any) => setOptions(prev => ({ ...prev, sortBy: v }))}>
                            <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm text-xs">
                                <SelectValue placeholder="Désignation" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-2xl text-xs">
                                <SelectItem value="name">Désignation (A-Z)</SelectItem>
                                <SelectItem value="quantity">Quantité (Critique)</SelectItem>
                                <SelectItem value="category">Par Catégorie</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
          </div>

          {/* Section 4: Period Management */}
          <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <Label className="text-[9px] font-black uppercase tracking-[0.15em]">Période de Référence</Label>
                  <div className="h-px flex-grow bg-slate-100 ml-2 text-transparent">_</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <div className="space-y-1.5">
                    <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Mois</Label>
                    <Select 
                        value={options.periodMonth.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodMonth: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-[10px] font-black uppercase">
                            <SelectValue placeholder="Mois" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[8px] font-black uppercase tracking-wider text-slate-400">Année</Label>
                    <Select 
                        value={options.periodYear.toString()} 
                        onValueChange={(v) => setOptions(prev => ({ ...prev, periodYear: parseInt(v) }))}
                    >
                        <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-[10px] font-black uppercase">
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

        <DialogFooter className="bg-slate-50/80 border-t border-slate-100 p-6 md:p-8 flex flex-col sm:flex-row gap-3 items-center">
          <Button 
            variant="ghost" 
            onClick={onCloseAction} 
            className="w-full sm:w-auto rounded-xl font-black text-slate-400 h-14 px-8 hover:bg-slate-100 transition-all uppercase text-[10px] tracking-widest"
          >
            Annuler
          </Button>
          <Button 
            onClick={handlePrint} 
            className="w-full sm:flex-grow bg-slate-900 text-white rounded-2xl font-black h-14 px-10 shadow-3xl hover:bg-emerald-600 transition-all border-none uppercase tracking-[0.2em] text-[10px] gap-3 relative group overflow-hidden"
          >
            <Printer className="h-4 w-4 transition-transform group-hover:scale-110" /> 
            Générer le Document Officiel
            <ChevronRight className="h-4 w-4 ml-1 opacity-30 group-hover:translate-x-1.5 transition-transform" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
