"use client";

import { useState } from "react";
import { Printer, X, LayoutList, Filter, SortAsc, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplyCategories } from "@/lib/constants/supply";

interface PrintSuppliesDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onPrintAction: (options: PrintOptions) => void;
}

export interface PrintOptions {
  includeOutOfStock: boolean;
  category: string;
  sortBy: 'name' | 'quantity' | 'category';
}

export function PrintSuppliesDialog({ isOpen, onCloseAction, onPrintAction }: PrintSuppliesDialogProps) {
  const [options, setOptions] = useState<PrintOptions>({
    includeOutOfStock: true,
    category: 'all',
    sortBy: 'name',
  });

  const handlePrint = () => {
    onPrintAction(options);
    onCloseAction();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="sm:max-w-[450px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
             <Printer size={120} strokeWidth={1} />
          </div>
          <DialogHeader>
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 backdrop-blur-xl border border-white/10">
               <LayoutList className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">Options d'impression</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-none">
              Personnalisez votre inventaire avant génération
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-8 bg-white">
          {/* Include Out of Stock */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-slate-100/50">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="stock" className="text-sm font-black text-slate-900">Articles en rupture</Label>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Inclure les stocks à 0</span>
            </div>
            <Switch 
              id="stock" 
              checked={options.includeOutOfStock} 
              onCheckedChange={(val) => setOptions(prev => ({ ...prev, includeOutOfStock: val }))}
              className="data-[state=checked]:bg-slate-900"
            />
          </div>

          <div className="space-y-6">
             {/* Category Filter */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                 <Filter className="h-3.5 w-3.5" />
                 <Label className="text-[10px] font-black uppercase tracking-widest">Filtrer par Catégorie</Label>
              </div>
              <Select value={options.category} onValueChange={(v) => setOptions(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:ring-slate-900">
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {supplyCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-400">
                 <SortAsc className="h-3.5 w-3.5" />
                 <Label className="text-[10px] font-black uppercase tracking-widest">Trier le document par</Label>
              </div>
              <Select value={options.sortBy} onValueChange={(v: any) => setOptions(prev => ({ ...prev, sortBy: v }))}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-slate-900 focus:ring-slate-900">
                  <SelectValue placeholder="Nom de l'article" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                  <SelectItem value="name">📋 Nom de l'article</SelectItem>
                  <SelectItem value="quantity">📊 Quantité disponible</SelectItem>
                  <SelectItem value="category">🏷️ Catégorie</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="bg-slate-50/50 border-t border-slate-100 p-6">
          <Button variant="ghost" onClick={onCloseAction} className="rounded-xl font-bold text-slate-500 h-12 px-6">
            Annuler
          </Button>
          <Button onClick={handlePrint} className="bg-slate-900 text-white rounded-xl font-black h-12 px-8 shadow-xl hover:bg-slate-800 transition-all border-none uppercase tracking-widest text-[11px] gap-2">
            <CheckCircle2 className="h-4 w-4" /> Générer l'impression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
