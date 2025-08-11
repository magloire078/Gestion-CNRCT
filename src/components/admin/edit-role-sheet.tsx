
"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/hooks/use-toast";

interface EditRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (roleId: string, permissions: string[]) => Promise<void>;
  role: Role;
}

export function EditRoleSheet({ isOpen, onClose, onUpdateRole, role }: EditRoleSheetProps) {
  const [permissions, setPermissions] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (role) {
      setPermissions(role.permissions.join(', '));
    }
  }, [role]);

  const resetForm = () => {
    setPermissions("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permissions) {
      setError("Les permissions ne peuvent pas être vides.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const permissionArray = permissions.split(',').map(p => p.trim()).filter(Boolean);
      await onUpdateRole(role.id, permissionArray);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour du rôle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Modifier le rôle : {role.name}</SheetTitle>
            <SheetDescription>
              Modifiez la liste des permissions pour ce rôle.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom du Rôle</Label>
              <Input id="name" value={role.name} className="col-span-3" disabled />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="permissions" className="text-right pt-2">Permissions</Label>
              <Textarea
                id="permissions"
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                className="col-span-3"
                rows={6}
                placeholder="Séparez les permissions par une virgule. Ex: page:dashboard:view, page:employees:view"
              />
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer les Permissions"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
