import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, GripVertical, Monitor, Layout, Maximize2, Minimize2, Printer, Settings, ListChecks, ArrowUpCircle, ArrowDownCircle, Info } from "lucide-react";
import type { ColumnKeys } from "@/lib/constants/employee";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";


interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: ColumnKeys[], orientation: 'portrait' | 'landscape') => void;
  allColumns: Partial<Record<ColumnKeys, string>>;
}

export function PrintDialog({ isOpen, onClose, onPrint, allColumns }: PrintDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Partial<Record<ColumnKeys, boolean>>>({});
  const [columnOrder, setColumnOrder] = useState<ColumnKeys[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Sync state when allColumns changes (e.g. tab switch)
  useEffect(() => {
    const keys = Object.keys(allColumns) as ColumnKeys[];
    setColumnOrder(keys);
    setSelectedColumns(
      keys.reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Partial<Record<ColumnKeys, boolean>>)
    );
  }, [allColumns]);

  const handleCheckboxChange = (key: ColumnKeys) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...columnOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setColumnOrder(newOrder);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedColumns(
      columnOrder.reduce((acc, key) => {
        acc[key] = checked;
        return acc;
      }, {} as Partial<Record<ColumnKeys, boolean>>)
    );
  };

  const handlePrintClick = () => {
    const selected = columnOrder.filter((key) => selectedColumns[key]);
    if (selected.length > 0) {
      onPrint(selected, orientation);
    }
  };

  const areAllSelected = columnOrder.length > 0 && columnOrder.every(key => selectedColumns[key]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl w-[95vw] h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden p-0 border-none bg-white shadow-3xl rounded-[2rem] sm:rounded-[2.5rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
        
        <DialogHeader className="p-5 sm:p-6 pb-2 relative z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xl shadow-slate-200">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none mb-1">
                  Rapport Institutionnel
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Configuration de la mise en page et des données
                </DialogDescription>
              </div>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <Button 
                    variant={orientation === 'portrait' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setOrientation('portrait')}
                    className={cn(
                        "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        orientation === 'portrait' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                    )}
                >
                    <Minimize2 className="h-3 w-3 mr-2" /> Portrait
                </Button>
                <Button 
                    variant={orientation === 'landscape' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setOrientation('landscape')}
                    className={cn(
                        "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        orientation === 'landscape' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                    )}
                >
                    <Maximize2 className="h-3 w-3 mr-2" /> Paysage
                </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="px-6 sm:px-8 flex-1 flex flex-col min-h-0 relative z-10">
          <div className="flex items-center justify-between p-3 bg-slate-900/5 rounded-xl border border-slate-900/10 mb-3 shrink-0">
            <div className="flex items-center space-x-4">
              <Checkbox
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                className="h-6 w-6 rounded-lg border-slate-300 data-[state=checked]:bg-slate-900"
              />
              <Label htmlFor="select-all" className="text-[11px] font-black uppercase tracking-widest text-slate-900 cursor-pointer">
                Toutes les colonnes ({columnOrder.filter(k => selectedColumns[k]).length} / {columnOrder.length})
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-400" />
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Ordre Personnalisé</span>
            </div>
          </div>

          <ScrollArea className="flex-1 -mx-8 px-8">
            <div className="space-y-2 pb-10">
              {columnOrder.map((key, index) => (
                <div 
                  key={key} 
                  className={cn(
                    "group flex items-center justify-between p-2.5 px-4 rounded-xl border transition-all duration-300",
                    selectedColumns[key] 
                      ? "border-slate-900/10 bg-white shadow-sm" 
                      : "border-transparent bg-slate-50/50 opacity-60"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      id={`col-${key}`}
                      checked={selectedColumns[key]}
                      onCheckedChange={() => handleCheckboxChange(key)}
                      className="h-5 w-5 rounded-lg border-slate-200 data-[state=checked]:bg-slate-900"
                    />
                    <Label 
                      htmlFor={`col-${key}`} 
                      className={cn(
                        "text-xs font-bold uppercase tracking-tight cursor-pointer",
                        selectedColumns[key] ? "text-slate-900" : "text-slate-400"
                      )}
                    >
                      {allColumns[key]}
                    </Label>
                  </div>

                  <div className="flex items-center gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-slate-100"
                      disabled={index === 0}
                      onClick={() => moveColumn(index, 'up')}
                    >
                      <ArrowUpCircle className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-lg hover:bg-slate-100"
                      disabled={index === columnOrder.length - 1}
                      onClick={() => moveColumn(index, 'down')}
                    >
                      <ArrowDownCircle className="h-4 w-4 text-slate-600" />
                    </Button>
                    <div className="ml-2 text-slate-200">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-5 sm:p-6 bg-white border-t border-slate-100 relative z-30 flex flex-row gap-3 sm:gap-4 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-100"
          >
            Fermer
          </Button>
          <Button 
            type="button" 
            onClick={handlePrintClick} 
            disabled={!Object.values(selectedColumns).some(Boolean)}
            className="h-12 flex-[2] rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] sm:text-[11px] hover:bg-black shadow-2xl shadow-slate-900/20 group transition-all"
          >
            <Printer className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            Générer le rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
