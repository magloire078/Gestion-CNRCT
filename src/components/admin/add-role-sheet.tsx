
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Role } from "@/lib/data";
import { addRole } from "@/services/role-service";
import { useToast } from "@/hooks/use-toast";

interface AddRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: Role) => void;
  roles: Role[];
}

export function AddRoleSheet({ isOpen, onClose, onAddRole, roles }: AddRoleSheetProps) {
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setPermissions("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !permissions) {
      setError("Le nom du rôle et les permissions sont obligatoires.");
      return;
    }

    if (roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
        setError(`Le rôle "${name}" existe déjà.`);
        return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const permissionArray = permissions.split(',').map(p => p.trim());
      // The role name cannot be one of the pre-defined ones for the type
      const newRole = await addRole({ name: name as any, permissions: permissionArray });
      onAddRole(newRole);
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
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom du Rôle</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="permissions" className="text-right pt-2">Permissions</Label>
              <Textarea
                id="permissions"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="col-span-3"
                placeholder="Séparez les permissions par une virgule. Ex: Gérer les utilisateurs, Approuver les congés"
              />
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
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
