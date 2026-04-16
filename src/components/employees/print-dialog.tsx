import React, { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import type { ColumnKeys } from "@/lib/constants/employee";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Printer, Settings, ListChecks, ArrowUpCircle, ArrowDownCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";


interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: ColumnKeys[]) => void;
  allColumns: Partial<Record<ColumnKeys, string>>;
}

export function PrintDialog({ isOpen, onClose, onPrint, allColumns }: PrintDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Partial<Record<ColumnKeys, boolean>>>(
    () => Object.keys(allColumns).reduce((acc, key) => {
      acc[key as ColumnKeys] = true;
      return acc;
    }, {} as Partial<Record<ColumnKeys, boolean>>)
  );

  const [columnOrder, setColumnOrder] = useState<ColumnKeys[]>(
    () => Object.keys(allColumns) as ColumnKeys[]
  );

  const handleCheckboxChange = (key: ColumnKeys) => {
    setSelectedColumns((prev: Partial<Record<ColumnKeys, boolean>>) => ({ ...prev, [key]: !prev[key] }));
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
      Object.keys(allColumns).reduce((acc, key) => {
        acc[key as ColumnKeys] = checked;
        return acc;
      }, {} as Partial<Record<ColumnKeys, boolean>>)
    )
  }

  const handlePrintClick = () => {
    // Return selected columns in the user-defined order
    const selected = columnOrder.filter((key: ColumnKeys) => selectedColumns[key]);
    if (selected.length > 0) {
      onPrint(selected);
    }
  };

  const areAllSelected = Object.values(selectedColumns).every(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-hidden p-0 border-none bg-white/40 backdrop-blur-3xl shadow-3xl rounded-[3rem]">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/20 to-transparent pointer-events-none" />
        
        <DialogHeader className="p-10 pb-6 relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg">
              <Printer className="h-6 w-6 text-white" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">
              Paramètres d'impression
            </DialogTitle>
          </div>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Sélectionnez et réorganisez les colonnes du rapport institutionnel
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-10 py-2 relative z-10">
          <div className="flex items-center justify-between p-4 bg-slate-900/5 rounded-2xl border border-slate-900/10 mb-6">
            <div className="flex items-center space-x-4">
              <Checkbox
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                className="h-6 w-6 rounded-lg border-slate-300 data-[state=checked]:bg-slate-900"
              />
              <Label htmlFor="select-all" className="text-[11px] font-black uppercase tracking-widest text-slate-900 cursor-pointer">
                Tout sélectionner
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-slate-400" />
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Flux Global</span>
            </div>
          </div>

          <ScrollArea className="h-[400px] -mx-2 px-2">
            <div className="space-y-3 pb-8">
              {columnOrder.map((key: ColumnKeys, index: number) => (
                <div 
                  key={key} 
                  className={cn(
                    "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                    selectedColumns[key] 
                      ? "border-blue-200 bg-white/60 shadow-xl shadow-blue-500/5 opacity-100" 
                      : "border-slate-100 bg-slate-50/30 opacity-60 grayscale"
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <Checkbox
                      id={key}
                      checked={selectedColumns[key]}
                      onCheckedChange={() => handleCheckboxChange(key)}
                      className="h-5 w-5 rounded-lg border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-sm"
                    />
                    <div className="flex flex-col">
                      <Label 
                        htmlFor={key} 
                        className={cn(
                          "text-[10px] font-black uppercase tracking-widest cursor-pointer",
                          selectedColumns[key] ? "text-slate-900" : "text-slate-500"
                        )}
                      >
                        {allColumns[key as ColumnKeys]}
                      </Label>
                      {selectedColumns[key] && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className={cn("h-1 w-8 rounded-full", index < 2 ? "bg-emerald-400" : "bg-blue-400")} />
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Pos: {index + 1}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl hover:bg-slate-100"
                      disabled={index === 0}
                      onClick={() => moveColumn(index, 'up')}
                    >
                      <ArrowUpCircle className="h-4 w-4 text-slate-600" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-xl hover:bg-slate-100"
                      disabled={index === columnOrder.length - 1}
                      onClick={() => moveColumn(index, 'down')}
                    >
                      <ArrowDownCircle className="h-4 w-4 text-slate-600" />
                    </Button>
                    <div className="ml-2 px-1 cursor-grab active:cursor-grabbing text-slate-200">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="p-10 bg-white/40 border-t border-white/20 backdrop-blur-md relative z-10 flex gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
            className="h-14 flex-1 rounded-2xl border-slate-200 bg-white font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 shadow-lg"
          >
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handlePrintClick} 
            disabled={!Object.values(selectedColumns).some(Boolean)}
            className="h-14 flex-[2] rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-[11px] hover:bg-black shadow-2xl shadow-black/20 group"
          >
            <Printer className="mr-3 h-5 w-5 text-blue-400 group-hover:scale-110 transition-transform" />
            Générer le rapport agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
