
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { AssetColumnKeys } from "@/lib/constants/asset";
import { 
  Printer, 
  Settings2, 
  Hash, 
  Tag, 
  Building2, 
  Monitor, 
  Barcode, 
  Globe, 
  User, 
  Activity,
  CheckCircle2,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PrintAssetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: AssetColumnKeys[]) => void;
  allColumns: Record<AssetColumnKeys, string>;
}

const columnIcons: Record<AssetColumnKeys, any> = {
  tag: Hash,
  type: Tag,
  fabricant: Building2,
  modele: Monitor,
  numeroDeSerie: Barcode,
  ipAddress: Globe,
  assignedTo: User,
  status: Activity,
};

export function PrintAssetsDialog({ isOpen, onClose, onPrint, allColumns }: PrintAssetsDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Record<AssetColumnKeys, boolean>>(
    () => Object.keys(allColumns).reduce((acc, key) => {
      acc[key as AssetColumnKeys] = true;
      return acc;
    }, {} as Record<AssetColumnKeys, boolean>)
  );

  const handleCheckboxChange = (key: AssetColumnKeys) => {
    setSelectedColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedColumns(
      Object.keys(allColumns).reduce((acc, key) => {
        acc[key as AssetColumnKeys] = checked;
        return acc;
      }, {} as Record<AssetColumnKeys, boolean>)
    )
  }

  const handlePrintClick = () => {
    const selected = (Object.keys(selectedColumns) as AssetColumnKeys[]).filter(key => selectedColumns[key]);
    if (selected.length > 0) {
      onPrint(selected);
    }
  };

  const areAllSelected = Object.values(selectedColumns).every(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-none bg-white/80 backdrop-blur-xl shadow-2xl rounded-[2.5rem]">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 to-slate-800 -z-10" />
        
        <DialogHeader className="p-8 pb-4 text-white relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl shadow-black/20">
              <Settings2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic leading-none">
                Configuration d'Impression
              </DialogTitle>
              <DialogDescription className="text-slate-300 font-medium mt-1 text-sm uppercase tracking-widest opacity-80">
                Personnalisez les colonnes de votre inventaire
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 pt-6 space-y-8 bg-white/50 backdrop-blur-sm">
          {/* Select All Toggle */}
          <div 
            className={cn(
              "flex items-center justify-between p-5 rounded-[1.5rem] transition-all duration-500 cursor-pointer border",
              areAllSelected 
                ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20" 
                : "bg-white text-slate-900 border-slate-100 hover:border-slate-300 shadow-sm"
            )}
            onClick={() => handleSelectAll(!areAllSelected)}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                areAllSelected ? "bg-white/20" : "bg-slate-100"
              )}>
                <CheckCircle2 className={cn("h-5 w-5", areAllSelected ? "text-white" : "text-slate-400")} />
              </div>
              <Label 
                htmlFor="select-all-assets" 
                className="font-black uppercase tracking-widest text-xs cursor-pointer"
              >
                Tout sélectionner / Désélectionner
              </Label>
            </div>
            <Checkbox
              id="select-all-assets"
              checked={areAllSelected}
              onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              className={cn(
                "border-2 transition-all",
                areAllSelected ? "border-white bg-white text-slate-900" : "border-slate-200"
              )}
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
              Colonnes Disponibles
              <div className="h-px flex-1 bg-slate-100" />
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(allColumns) as AssetColumnKeys[]).map(key => {
                const Icon = columnIcons[key];
                const isSelected = selectedColumns[key];
                
                return (
                  <div 
                    key={key} 
                    className={cn(
                      "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none",
                      isSelected 
                        ? "bg-white border-slate-900 shadow-lg shadow-slate-900/5 ring-1 ring-slate-900/5" 
                        : "bg-slate-50/50 border-slate-100 opacity-60 hover:opacity-100 hover:border-slate-200"
                    )}
                    onClick={() => handleCheckboxChange(key)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={cn(
                        "p-2 rounded-xl transition-all duration-300 shrink-0",
                        isSelected ? "bg-slate-900 text-white" : "bg-white text-slate-400 shadow-sm"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <Label 
                        htmlFor={`asset-col-${key}`} 
                        className={cn(
                          "text-xs font-bold uppercase tracking-tight cursor-pointer truncate",
                          isSelected ? "text-slate-900" : "text-slate-500"
                        )}
                      >
                        {allColumns[key]}
                      </Label>
                    </div>
                    <Checkbox
                      id={`asset-col-${key}`}
                      checked={isSelected}
                      onCheckedChange={() => handleCheckboxChange(key)}
                      className={cn(
                        "border-2",
                        isSelected ? "border-slate-900 bg-slate-900" : "border-slate-200"
                      )}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="p-8 pt-4 bg-slate-50/80 backdrop-blur-sm border-t border-slate-100 sm:justify-between gap-4">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="rounded-2xl px-6 h-12 font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 hover:bg-white transition-all"
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handlePrintClick}
            className="rounded-2xl px-8 h-12 bg-slate-900 text-white hover:bg-slate-800 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-slate-900/20 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <Printer className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
            Lancer l'impression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
