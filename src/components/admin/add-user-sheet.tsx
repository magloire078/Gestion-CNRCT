
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, Role } from "@/lib/data";
import { addUser } from "@/services/user-service";
import { useToast } from "@/hooks/use-toast";

interface AddUserSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddUserAction: () => void;
  roles: Role[];
}

export function AddUserSheet({ isOpen, onCloseAction, onAddUserAction, roles }: AddUserSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setEmail("");
    setRoleId("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onCloseAction();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !roleId) {
      setError("Le nom, l'email et le rôle sont obligatoires.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      // Note: This only creates the user in Firestore. The auth user must be created separately.
      // In a real app, this might be a Cloud Function that does both.
      await addUser({ name, email, roleId });
      onAddUserAction();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg border-white/20 p-0 overflow-hidden bg-white/40 backdrop-blur-3xl shadow-3xl rounded-l-[3rem]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full relative">
          <SheetHeader className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
            {/* Institutional Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative z-10 space-y-2">
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter">Accréditation</SheetTitle>
                <div className="h-1 w-12 bg-blue-500 rounded-full" />
                <SheetDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                    Renseignement des accès institutionnels pour un nouveau collaborateur du CNRCT.
                </SheetDescription>
            </div>
          </SheetHeader>
          <div className="grid gap-8 p-10 flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Identité Complète</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="EX: M. JEAN-BAPTISTE KOUAMÉ"
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-widest text-[11px] transition-all duration-300 placeholder:text-slate-300 placeholder:font-bold"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Courriel Institutionnel</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="COLLABORATEUR@CNR-CT.CI"
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-widest text-[11px] transition-all duration-300 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Assignation du Grade d'Accès</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="role" className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-widest text-[11px] transition-all duration-300">
                  <SelectValue placeholder="SÉLECTIONNER UN PROFIL" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/20 shadow-3xl bg-white/95 backdrop-blur-xl p-2">
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id} className="font-black py-4 uppercase tracking-[0.2em] text-[9px] rounded-xl focus:bg-slate-900 focus:text-white transition-colors">
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
          <SheetFooter className="p-10 bg-white/20 backdrop-blur-md border-t border-white/40 flex-row gap-4">
            <SheetClose asChild>
              <Button type="button" variant="ghost" className="h-14 px-8 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-slate-400 hover:text-slate-900 transition-all">
                  Annuler
              </Button>
            </SheetClose>
            <Button 
                type="submit" 
                disabled={isSubmitting || roles.length === 0}
                className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-3xl shadow-slate-900/40 active:scale-95 transition-all flex-1"
            >
              {isSubmitting ? "ACCRÉDITATION..." : "ACTIVER LE COMPTE"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
