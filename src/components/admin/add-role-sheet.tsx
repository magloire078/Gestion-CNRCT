
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
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouveau rôle</SheetTitle>
            <SheetDescription>
              Définissez un nouveau rôle et ses permissions associées.
            </SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nom du Rôle</Label>
              <Input id="name" value={name} placeholder="ex: Chargé de logistique" onChange={(e) => setName(e.target.value)} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2 italic">
                Note : Après la création, vous pourrez configurer les droits d&apos;accès détaillés (Lecture, Création, etc.) dans l&apos;onglet Sécurité de la page d&apos;administration.
              </p>
            </div>
            {error && <p className="text-sm text-destructive px-1 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer le Rôle"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
