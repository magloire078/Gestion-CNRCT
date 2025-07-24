
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ColumnKeys } from "@/app/employees/page";

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

  const handleCheckboxChange = (key: ColumnKeys) => {
    setSelectedColumns(prev => ({ ...prev, [key]: !prev[key] }));
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
    const selected = (Object.keys(selectedColumns) as ColumnKeys[]).filter(key => selectedColumns[key]);
    if(selected.length > 0) {
        onPrint(selected);
        onClose();
    }
  };

  const areAllSelected = Object.values(selectedColumns).every(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres d'impression</DialogTitle>
          <DialogDescription>
            Sélectionnez les colonnes que vous souhaitez afficher sur la liste imprimée.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             <div className="flex items-center space-x-2">
                <Checkbox
                    id="select-all"
                    checked={areAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                />
                <Label htmlFor="select-all" className="font-bold">
                    Tout sélectionner / Désélectionner
                </Label>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
            {(Object.keys(allColumns) as ColumnKeys[]).map(key => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={selectedColumns[key]}
                  onCheckedChange={() => handleCheckboxChange(key)}
                />
                <Label htmlFor={key}>{allColumns[key]}</Label>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="button" onClick={handlePrintClick}>
            Imprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    