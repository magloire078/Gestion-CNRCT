
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, Role } from "@/lib/data";

interface EditUserRoleDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onConfirmAction: (userId: string, newRoleId: string) => Promise<void>;
  user: User | null;
  roles: Role[];
}

export function EditUserRoleDialog({ isOpen, onCloseAction, onConfirmAction, user, roles }: EditUserRoleDialogProps) {
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.roleId) {
      setSelectedRoleId(user.roleId);
    }
  }, [user]);

  const handleClose = () => {
    setError("");
    onCloseAction();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRoleId) {
      setError("Le rôle est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await onConfirmAction(user.id, selectedRoleId);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg border-white/20 p-0 overflow-hidden bg-white/40 backdrop-blur-3xl shadow-3xl rounded-[3rem]">
        <form onSubmit={handleSubmit} className="flex flex-col relative">
          <DialogHeader className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
            {/* Institutional Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative z-10 space-y-2">
                <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Réaffectation</DialogTitle>
                <div className="h-1 w-12 bg-indigo-500 rounded-full" />
                <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                    Modification du profil d'accès institutionnel pour garantir l'intégrité des permissions.
                </DialogDescription>
            </div>
          </DialogHeader>
          <div className="p-10 space-y-8 flex-1">
             <div className="space-y-3 p-6 rounded-[2rem] bg-slate-900/10 border border-white/40 shadow-xl backdrop-blur-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Agent Concerné</Label>
                <div className="space-y-1 relative z-10">
                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{user.name}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-70">{user.email}</p>
                </div>
             </div>
             <div className="space-y-3">
                <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Nouveau Grade de Droits</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="role" className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm font-black uppercase tracking-[0.2em] text-[11px] text-slate-900 focus:ring-slate-900 transition-all duration-300">
                        <SelectValue placeholder="SÉLECTIONNER UN PROFIL..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/20 shadow-3xl bg-white/95 backdrop-blur-xl p-2 mt-2">
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id} className="font-black uppercase tracking-[0.2em] text-[9px] py-4 rounded-xl focus:bg-slate-900 focus:text-white transition-colors">
                                {role.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
            {error && (
                <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-black uppercase tracking-widest text-center shadow-inner">
                    {error}
                </div>
            )}
          </div>
          <DialogFooter className="p-10 bg-white/20 backdrop-blur-md border-t border-white/40 flex-row gap-4">
            <Button type="button" variant="ghost" onClick={handleClose} className="h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900 transition-all">
                Annuler
            </Button>
            <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-3xl shadow-slate-900/40 active:scale-95 transition-all flex-1"
            >
              {isSubmitting ? "TRAITEMENT..." : "METTRE À JOUR LE PROFIL"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
