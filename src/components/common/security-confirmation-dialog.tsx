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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2 } from "lucide-react";
import { verifyPassword } from "@/services/auth-service";

interface SecurityConfirmationDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

export function SecurityConfirmationDialog({
  isOpen,
  onCloseAction,
  onConfirmAction,
  title,
  description,
  confirmText = "Confirmer",
  variant = "destructive",
}: SecurityConfirmationDialogProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const handleClose = () => {
    setPassword("");
    setError("");
    setIsVerifying(false);
    onCloseAction();
  };

  const handleConfirmClick = async () => {
    if (!password) {
      setError("Veuillez entrer votre mot de passe.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const isValid = await verifyPassword(password);
      if (!isValid) {
        setError("Mot de passe incorrect.");
        setIsVerifying(false);
        return;
      }
      
      await onConfirmAction();
      handleClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-white border border-slate-100 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-slate-800">{title}</DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 pt-4 space-y-4">
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-100/50">
                <Label htmlFor="security-password" className="text-slate-700 font-semibold mb-2 block">
                    Authentification requise
                </Label>
                <Input
                    id="security-password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                    }}
                    placeholder="Entrez votre mot de passe pour confirmer"
                    className="h-11 rounded-lg border-rose-200 bg-white focus-visible:ring-rose-500/50 text-sm shadow-sm"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            handleConfirmClick();
                        }
                    }}
                />
                {error && (
                    <p className="text-sm font-medium text-rose-600 mt-2">{error}</p>
                )}
            </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <div className="flex gap-3 w-full justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isVerifying}
                className="h-10 px-6 border-slate-200 text-slate-700 font-medium rounded-lg"
              >
                Annuler
              </Button>
              <Button 
                type="button" 
                variant={variant}
                onClick={handleConfirmClick}
                disabled={isVerifying || !password}
                className="h-10 px-6 shadow-sm font-medium rounded-lg"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  confirmText
                )}
              </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
