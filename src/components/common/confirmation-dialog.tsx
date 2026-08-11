"use client";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, HelpCircle } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void;
  title: string;
  description: string;
  confirmText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function ConfirmationDialog({
  isOpen,
  onCloseAction,
  onConfirmAction,
  title,
  description,
  confirmText = "Confirmer",
  variant = "destructive",
}: ConfirmationDialogProps) {

  const handleConfirmClick = () => {
    onConfirmAction();
    onCloseAction();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
      <DialogContent className="w-[95vw] max-w-[400px] p-6 rounded-3xl border-none bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Icon Circle */}
          <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
            variant === 'destructive' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'
          }`}>
            {variant === 'destructive' ? (
              <Trash2 className="h-6 w-6" />
            ) : (
              <HelpCircle className="h-6 w-6" />
            )}
          </div>
          
          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 leading-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 font-medium leading-relaxed px-2">
              {description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={onCloseAction}
              className="h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 order-2 sm:order-1"
            >
              Annuler
            </Button>
            <Button
              type="button"
              onClick={handleConfirmClick}
              className={`h-12 flex-1 rounded-xl font-black uppercase tracking-widest text-[10px] text-white order-1 sm:order-2 ${
                variant === 'destructive' 
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-600/20' 
                  : 'bg-slate-900 hover:bg-black shadow-lg shadow-slate-900/20'
              }`}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
