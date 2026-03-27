import React, { useState } from "react";
import { ArrowUp, ArrowDown, GripVertical } from "lucide-react";
import type { ColumnKeys } from "@/lib/constants/employee";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: ColumnKeys[]) => void;
  allColumns: Record<ColumnKeys, string>;
}

export function PrintDialog({ isOpen, onClose, onPrint, allColumns }: PrintDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Record<ColumnKeys, boolean>>(
    () => Object.keys(allColumns).reduce((acc, key) => {
      acc[key as ColumnKeys] = true;
      return acc;
    }, {} as Record<ColumnKeys, boolean>)
  );

  const [columnOrder, setColumnOrder] = useState<ColumnKeys[]>(
    () => Object.keys(allColumns) as ColumnKeys[]
  );

  const handleCheckboxChange = (key: ColumnKeys) => {
    setSelectedColumns((prev: Record<ColumnKeys, boolean>) => ({ ...prev, [key]: !prev[key] }));
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
      }, {} as Record<ColumnKeys, boolean>)
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
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres d'impression</DialogTitle>
          <DialogDescription>
            Sélectionnez et réorganisez les colonnes pour votre document imprimé.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
              />
              <Label htmlFor="select-all" className="font-bold cursor-pointer">
                Tout sélectionner
              </Label>
            </div>
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Ordre & Visibilité</span>
          </div>

          <div className="space-y-1">
            {columnOrder.map((key: ColumnKeys, index: number) => (
              <div 
                key={key} 
                className={`flex items-center justify-between p-2 rounded-lg border ${selectedColumns[key] ? 'border-primary/20 bg-primary/5 shadow-sm' : 'border-slate-100 bg-slate-50/50 opacity-60'} transition-all`}
              >
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={key}
                    checked={selectedColumns[key]}
                    onCheckedChange={() => handleCheckboxChange(key)}
                  />
                  <Label 
                    htmlFor={key} 
                    className={`text-sm font-medium cursor-pointer ${selectedColumns[key] ? 'text-slate-900' : 'text-slate-500'}`}
                  >
                    {allColumns[key as ColumnKeys]}
                  </Label>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === 0}
                    onClick={() => moveColumn(index, 'up')}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    disabled={index === columnOrder.length - 1}
                    onClick={() => moveColumn(index, 'down')}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <div className="ml-1 cursor-grab active:cursor-grabbing text-slate-300">
                    <GripVertical className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handlePrintClick} disabled={!Object.values(selectedColumns).some(Boolean)}>
            Générer l'impression
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
