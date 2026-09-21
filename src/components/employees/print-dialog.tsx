"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ArrowUp, 
  ArrowDown, 
  GripVertical, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Download, 
  ListChecks, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Check 
} from "lucide-react";
import type { ColumnKeys } from "@/lib/constants/employee";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PrintDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPrint: (selectedColumns: ColumnKeys[], orientation: 'portrait' | 'landscape') => void;
  onExportPdf?: (selectedColumns: ColumnKeys[], orientation: 'portrait' | 'landscape') => void;
  allColumns: Partial<Record<ColumnKeys, string>>;
}

export function PrintDialog({ isOpen, onClose, onPrint, onExportPdf, allColumns }: PrintDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<Partial<Record<ColumnKeys, boolean>>>({});
  const [columnOrder, setColumnOrder] = useState<ColumnKeys[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  const STORAGE_KEY = 'cnrct_print_preferences';

  // Load state when dialog opens or columns change
  useEffect(() => {
    if (!isOpen) return;

    const keys = Object.keys(allColumns) as ColumnKeys[];
    let initialOrder = [...keys];
    let initialSelected = keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Partial<Record<ColumnKeys, boolean>>);
    let initialOrientation: 'portrait' | 'landscape' = 'landscape';

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orientation) {
          initialOrientation = parsed.orientation;
        }
        if (parsed.columnOrder && Array.isArray(parsed.columnOrder)) {
          const validSavedKeys = parsed.columnOrder.filter((k: any) => keys.includes(k));
          const newKeys = keys.filter(k => !validSavedKeys.includes(k as any));
          initialOrder = [...validSavedKeys, ...newKeys];
        }
        if (parsed.selectedColumns) {
          initialSelected = { ...initialSelected, ...parsed.selectedColumns };
        }
      }
    } catch (e) {
      console.error('Failed to load print preferences', e);
    }

    setColumnOrder(initialOrder);
    setSelectedColumns(initialSelected);
    setOrientation(initialOrientation);
    setFocusedIndex(0);
  }, [isOpen, allColumns]);

  const handleCheckboxChange = (key: ColumnKeys) => {
    setSelectedColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const moveColumn = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...columnOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
      setColumnOrder(newOrder);
      setFocusedIndex(targetIndex);
      setTimeout(() => {
        rowRefs.current[targetIndex]?.focus();
      }, 50);
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

  const savePreferences = (selected: ColumnKeys[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        columnOrder,
        selectedColumns,
        orientation
      }));
    } catch (e) {
      console.error('Failed to save print preferences', e);
    }
  };

  const handlePrintClick = () => {
    const selected = columnOrder.filter((key) => selectedColumns[key]);
    if (selected.length > 0) {
      savePreferences(selected);
      React.startTransition(() => {
        setTimeout(() => {
          onPrint(selected, orientation);
        }, 16);
      });
    }
  };

  const handleExportPdfClick = () => {
    const selected = columnOrder.filter((key) => selectedColumns[key]);
    if (selected.length > 0) {
      savePreferences(selected);
      React.startTransition(() => {
        setTimeout(() => {
          if (onExportPdf) {
            onExportPdf(selected, orientation);
          } else {
            onPrint(selected, orientation);
          }
        }, 16);
      });
    }
  };

  // Keyboard navigation inside list
  const handleKeyDownList = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = Math.min(columnOrder.length - 1, focusedIndex + 1);
      setFocusedIndex(next);
      rowRefs.current[next]?.focus();
      rowRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = Math.max(0, focusedIndex - 1);
      setFocusedIndex(prev);
      rowRefs.current[prev]?.focus();
      rowRefs.current[prev]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "PageDown") {
      e.preventDefault();
      const next = Math.min(columnOrder.length - 1, focusedIndex + 5);
      setFocusedIndex(next);
      rowRefs.current[next]?.focus();
      rowRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "PageUp") {
      e.preventDefault();
      const prev = Math.max(0, focusedIndex - 5);
      setFocusedIndex(prev);
      rowRefs.current[prev]?.focus();
      rowRefs.current[prev]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocusedIndex(0);
      rowRefs.current[0]?.focus();
      rowRefs.current[0]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (e.key === "End") {
      e.preventDefault();
      const last = columnOrder.length - 1;
      setFocusedIndex(last);
      rowRefs.current[last]?.focus();
      rowRefs.current[last]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, key: ColumnKeys, index: number) => {
    if (e.key === " " || e.key === "Enter") {
      // Toggle selection if pressing Space or Enter on the row
      if (e.target === e.currentTarget || (e.target as HTMLElement).tagName !== "BUTTON") {
        e.preventDefault();
        handleCheckboxChange(key);
      }
    } else if ((e.ctrlKey || e.altKey) && e.key === "ArrowUp") {
      e.preventDefault();
      moveColumn(index, "up");
    } else if ((e.ctrlKey || e.altKey) && e.key === "ArrowDown") {
      e.preventDefault();
      moveColumn(index, "down");
    }
  };

  const areAllSelected = columnOrder.length > 0 && columnOrder.every(key => selectedColumns[key]);
  const selectedCount = columnOrder.filter(k => selectedColumns[k]).length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-2xl w-[95vw] max-h-[90vh] h-[85vh] sm:h-[80vh] flex flex-col overflow-hidden p-0 border-none bg-white shadow-3xl rounded-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white pointer-events-none" />
        
        {/* Modal Header */}
        <DialogHeader className="p-5 sm:p-6 pb-3 relative z-10 shrink-0 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/10 shrink-0">
                <Printer className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none mb-1">
                  Rapport Institutionnel
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Configuration de la mise en page et des données
                </DialogDescription>
              </div>
            </div>
            
            {/* Orientation Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0 self-end sm:self-center">
                <Button 
                    variant={orientation === 'portrait' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setOrientation('portrait')}
                    className={cn(
                        "h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                        orientation === 'portrait' ? "bg-white shadow-sm text-slate-900" : "text-slate-400"
                    )}
                >
                    <Minimize2 className="h-3 w-3 mr-1.5" /> Portrait
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
                    <Maximize2 className="h-3 w-3 mr-1.5" /> Paysage
                </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Body Content */}
        <div className="px-5 sm:px-6 py-3 flex-1 flex flex-col min-h-0 relative z-10 overflow-hidden">
          {/* Select All Banner */}
          <div className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-xl border border-slate-200/80 mb-3 shrink-0">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="select-all"
                checked={areAllSelected}
                onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-slate-900"
              />
              <Label htmlFor="select-all" className="text-xs font-black uppercase tracking-wider text-slate-900 cursor-pointer select-none">
                Toutes les colonnes ({selectedCount} / {columnOrder.length})
              </Label>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <ListChecks className="h-4 w-4" />
              <span className="text-[9px] font-black uppercase tracking-widest hidden sm:inline">
                Navigation Clavier Active (↑ / ↓ / Espace)
              </span>
            </div>
          </div>

          {/* Scrollable Column List with Keyboard Navigation */}
          <div 
            ref={scrollContainerRef}
            tabIndex={0}
            onKeyDown={handleKeyDownList}
            className="flex-1 overflow-y-auto space-y-2 pr-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20 rounded-xl"
            role="listbox"
            aria-label="Sélection des colonnes"
          >
            {columnOrder.map((key, index) => {
              const isSelected = selectedColumns[key] ?? false;
              const isFocused = focusedIndex === index;

              return (
                <div 
                  key={key}
                  ref={(el) => { rowRefs.current[index] = el; }}
                  tabIndex={0}
                  role="option"
                  aria-selected={isSelected}
                  onFocus={() => setFocusedIndex(index)}
                  onClick={() => handleCheckboxChange(key)}
                  onKeyDown={(e) => handleRowKeyDown(e, key, index)}
                  className={cn(
                    "group flex items-center justify-between p-3 px-4 rounded-xl border cursor-pointer select-none transition-all duration-150 focus:outline-none",
                    isSelected 
                      ? "border-slate-300 bg-white shadow-sm" 
                      : "border-slate-100 bg-slate-50/60 opacity-60 hover:opacity-90",
                    isFocused && "ring-2 ring-slate-900 border-slate-900 bg-slate-50/90 shadow-md"
                  )}
                >
                  <div className="flex items-center space-x-3.5">
                    <Checkbox
                      id={`col-${key}`}
                      checked={isSelected}
                      onCheckedChange={() => handleCheckboxChange(key)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-slate-900"
                    />
                    <Label 
                      htmlFor={`col-${key}`} 
                      onClick={(e) => e.stopPropagation()}
                      className={cn(
                        "text-xs font-black uppercase tracking-tight cursor-pointer",
                        isSelected ? "text-slate-900" : "text-slate-400"
                      )}
                    >
                      {allColumns[key]}
                    </Label>
                  </div>

                  {/* Ordering Controls */}
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                      disabled={index === 0}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumn(index, 'up');
                      }}
                      title="Monter (Ctrl+↑)"
                      aria-label="Monter"
                    >
                      <ArrowUpCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                      disabled={index === columnOrder.length - 1}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveColumn(index, 'down');
                      }}
                      title="Descendre (Ctrl+↓)"
                      aria-label="Descendre"
                    >
                      <ArrowDownCircle className="h-4 w-4" />
                    </Button>
                    <div className="ml-1 text-slate-300 hidden sm:block">
                      <GripVertical className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-white border-t border-slate-100 relative z-30 flex flex-row items-center justify-between gap-3 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={onClose}
            className="h-11 px-4 rounded-xl font-bold uppercase tracking-wider text-[10px] text-slate-500 hover:text-slate-900 hover:bg-slate-100"
          >
            Fermer
          </Button>
          <div className="flex items-center justify-end gap-2 sm:gap-3">
            <Button 
              type="button" 
              onClick={handleExportPdfClick} 
              disabled={selectedCount === 0}
              className="h-11 px-4 sm:px-5 rounded-xl bg-emerald-700 text-white font-black uppercase tracking-wider text-[10px] sm:text-[11px] hover:bg-emerald-800 shadow-lg shadow-emerald-900/10 group transition-all"
            >
              <Download className="mr-1.5 sm:mr-2 h-4 w-4 text-white group-hover:scale-110 transition-transform" />
              Télécharger PDF
            </Button>
            <Button 
              type="button" 
              onClick={handlePrintClick} 
              disabled={selectedCount === 0}
              className="h-11 px-4 sm:px-5 rounded-xl bg-slate-900 text-white font-black uppercase tracking-wider text-[10px] sm:text-[11px] hover:bg-black shadow-xl shadow-slate-900/20 group transition-all"
            >
              <Printer className="mr-1.5 sm:mr-2 h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              Imprimer le rapport
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
