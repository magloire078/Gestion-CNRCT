
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
import type { Role } from "@/lib/data";
import { addRole } from "@/services/role-service";
import { useToast } from "@/hooks/use-toast";

interface AddRoleSheetProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onAddRoleAction: (role: Role) => void;
  roles: Role[];
}

export function AddRoleSheet({ isOpen, onCloseAction, onAddRoleAction, roles }: AddRoleSheetProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onCloseAction();
  };
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Le nom du rôle est obligatoire.");
      return;
    }

    if (roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
        setError(`Le rôle "${name}" existe déjà.`);
        return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      // Initialize with basic read access to essential pages
      const initialPermissions = {
        dashboard: { read: true, create: false, update: false, delete: false },
        'my-space': { read: true, create: false, update: false, delete: false },
        intranet: { read: true, create: false, update: false, delete: false },
      };

      const newRole = await addRole({ 
        name, 
        permissions: [], 
        resourcePermissions: initialPermissions as any 
      });
      onAddRoleAction(newRole);
      toast({ title: "Rôle ajouté", description: `Le rôle ${name} a été ajouté.` });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout du rôle.");
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
                <SheetTitle className="text-3xl font-black uppercase tracking-tighter">Profil d'Accès</SheetTitle>
                <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                <SheetDescription className="text-slate-400 font-bold uppercase tracking-widest text-[9px] mt-2 opacity-80 leading-loose">
                    Définition d'un nouveau palier institutionnel et initialisation sécurisée des droits.
                </SheetDescription>
            </div>
          </SheetHeader>
          <div className="grid gap-8 p-10 flex-1 overflow-auto custom-scrollbar">
            <div className="space-y-4">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Intitulé du Rôle</Label>
              <Input 
                id="name" 
                value={name} 
                placeholder="EX: INSPECTEUR DE ZONE" 
                onChange={(e) => setName(e.target.value)} 
                className="h-14 rounded-2xl bg-white/60 border-white/40 shadow-sm focus:ring-slate-900 font-black uppercase tracking-[0.2em] text-[11px] transition-all duration-300 placeholder:text-slate-300"
              />
              <div className="p-6 rounded-[2rem] bg-slate-900/5 border border-slate-900/10 shadow-inner relative overflow-hidden group/note">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 group-hover:h-full transition-all" />
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest italic pl-2">
                  Protocole Institutionnel : Après la création, les habilitations granulaires (Lecture, Écriture, etc.) devront être configurées via la Matrice de Sécurité Globale.
                </p>
              </div>
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
                disabled={isSubmitting}
                className="bg-slate-900 hover:bg-black text-white px-10 h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-3xl shadow-slate-900/40 active:scale-95 transition-all flex-1"
            >
              {isSubmitting ? "INITIALISATION..." : "ENREGISTRER LE PROFIL"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
