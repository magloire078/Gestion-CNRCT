"use client";

import { useState, memo } from "react";
import { Printer, LayoutList, Filter, SortAsc, CheckCircle2, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplyCategories } from "@/lib/constants/supply";

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
}

export const PrintSuppliesDialog = memo(function PrintSuppliesDialog({ 
  isOpen, 
  onCloseAction, 
  onPrintAction 
}: PrintSuppliesDialogProps) {
  const now = new Date();
  const [options, setOptions] = useState<PrintOptions>({
    includeOutOfStock: true,
    includePhotos: false,
    showHealthStatus: true,
    category: 'all',
    sortBy: 'name',
    reportTemplate: 'standard',
    periodMonth: now.getMonth(),
    periodYear: now.getFullYear(),
  });

  const handlePrint = () => {
    onPrintAction(options);
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[480px] rounded-xl border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Printer size={120} strokeWidth={1} />
          </div>
          <DialogHeader>
            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-xl border border-white/10">
               <LayoutList className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Options d'impression</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">
              Modèle & Filtres Administratifs
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 bg-white max-h-[60vh] overflow-y-auto custom-scrollbar">
          {/* Report Template Selection */}
          <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                 <FileText className="h-3.5 w-3.5" />
                 <Label className="text-[10px] font-black uppercase tracking-widest">Modèle de Rapport</Label>
              </div>
              <Select value={options.reportTemplate} onValueChange={(v: any) => setOptions(prev => ({ ...prev, reportTemplate: v }))}>
                <SelectTrigger className="h-14 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:ring-slate-900 transition-all hover:bg-slate-100/50">
                  <SelectValue placeholder="Standard (Tableau)" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="standard" className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                          <span className="font-bold underline">📋 Modèle Standard</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase">Liste d'inventaire rapide</span>
                      </div>
                  </SelectItem>
                  <SelectItem value="official" className="py-3 px-4">
                      <div className="flex flex-col gap-0.5">
                          <span className="font-bold underline">🏛️ Modèle Officiel CNRCT</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Page de garde + Style PV d'Inventaire</span>
                      </div>
                  </SelectItem>
                </SelectContent>
              </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Include Photos */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/50">
                <div className="flex items-center justify-between">
                    <Label htmlFor="photos" className="text-xs font-black text-slate-900 uppercase">Photos</Label>
                    <Switch 
                    id="photos" 
                    checked={options.includePhotos} 
                    onCheckedChange={(val) => setOptions(prev => ({ ...prev, includePhotos: val }))}
                    className="data-[state=checked]:bg-slate-900"
                    />
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Inclure catalogue visuel</span>
              </div>

              {/* Show Health Status */}
              <div className="flex flex-col gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 transition-all hover:bg-slate-100/50">
                <div className="flex items-center justify-between">
                    <Label htmlFor="health" className="text-xs font-black text-slate-900 uppercase">Santé Stock</Label>
                    <Switch 
                    id="health" 
                    checked={options.showHealthStatus} 
                    onCheckedChange={(val) => setOptions(prev => ({ ...prev, showHealthStatus: val }))}
                    className="data-[state=checked]:bg-slate-900"
                    />
                </div>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Indicateurs & alertes</span>
              </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="stock" className="text-sm font-black text-slate-900">Articles en rupture</Label>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic leading-none">Inclure les stocks à 0</span>
            </div>
            <Switch 
              id="stock" 
              checked={options.includeOutOfStock} 
              onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeOutOfStock: val }))}
              className="data-[state=checked]:bg-slate-900 scale-75"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             {/* Category Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                 <Filter className="h-3.5 w-3.5" />
                 <Label className="text-[10px] font-black uppercase tracking-widest">Périmètre</Label>
              </div>
              <Select value={options.category} onValueChange={(v) => setOptions(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:ring-slate-900">
                  <SelectValue placeholder="Tout" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="all">Tout</SelectItem>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                 <SortAsc className="h-3.5 w-3.5" />
                 <Label className="text-[10px] font-black uppercase tracking-widest">Tri</Label>
              </div>
              <Select value={options.sortBy} onValueChange={(v: any) => setOptions(prev => ({ ...prev, sortBy: v }))}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:ring-slate-900">
                  <SelectValue placeholder="Nom" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="name">Désignation</SelectItem>
                  <SelectItem value="quantity">Quantité</SelectItem>
                  <SelectItem value="category">Catégorie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
             {/* Month Selection */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mois du Rapport</Label>
              <Select 
                value={options.periodMonth.toString()} 
                onValueChange={(v) => setOptions(prev => ({ ...prev, periodMonth: parseInt(v) }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Selection */}
            <div className="space-y-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Année du Rapport</Label>
              <Select 
                value={options.periodYear.toString()} 
                onValueChange={(v) => setOptions(prev => ({ ...prev, periodYear: parseInt(v) }))}
              >
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900">
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

        <DialogFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
          <Button variant="ghost" onClick={onCloseAction} className="rounded-xl font-bold text-slate-500 h-14 px-6 overflow-hidden transition-all hover:bg-slate-100">
            Annuler
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-black h-14 px-8 shadow-xl hover:bg-stone-800 transition-all border-none uppercase tracking-[0.15em] text-[10px] gap-3">
            <CheckCircle2 className="h-4 w-4" /> Générer le Rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
