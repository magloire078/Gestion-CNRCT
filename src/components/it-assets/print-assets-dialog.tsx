
"use client";

import { useState } from "react";
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
import type { AssetColumnKeys } from "@/app/it-assets/page";

interface PrintAssetsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: AssetColumnKeys[]) => void;
  allColumns: Record<AssetColumnKeys, string>;
}

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
    if(selected.length > 0) {
        onPrint(selected);
    }
  };

  const areAllSelected = Object.values(selectedColumns).every(Boolean);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Paramètres d'impression</DialogTitle>
          <DialogDescription>
            Sélectionnez les colonnes à inclure dans l'inventaire imprimé.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
             <div className="flex items-center space-x-2">
                <Checkbox
                    id="select-all-assets"
                    checked={areAllSelected}
                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                    aria-label="Tout sélectionner"
                />
                <Label htmlFor="select-all-assets" className="font-bold">
                    Tout sélectionner / Désélectionner
                </Label>
            </div>
            <hr />
            <div className="grid grid-cols-2 gap-4">
            {(Object.keys(allColumns) as AssetColumnKeys[]).map(key => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`asset-col-${key}`}
                  checked={selectedColumns[key]}
                  onCheckedChange={() => handleCheckboxChange(key)}
                />
                <Label htmlFor={`asset-col-${key}`}>{allColumns[key]}</Label>
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
