
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
  onClose: () => void;
  onConfirm: (userId: string, newRoleId: string) => Promise<void>;
  user: User | null;
  roles: Role[];
}

export function EditUserRoleDialog({ isOpen, onClose, onConfirm, user, roles }: EditUserRoleDialogProps) {
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
    onClose();
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
      await onConfirm(user.id, selectedRoleId);
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Modifier le Rôle de l'Utilisateur</DialogTitle>
            <DialogDescription>
              Changez le rôle pour <span className="font-semibold">{user.name}</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
             <div>
                <Label>Utilisateur</Label>
                <p className="text-sm text-muted-foreground">{user.name} ({user.email})</p>
             </div>
             <div>
                <Label htmlFor="role">Nouveau Rôle</Label>
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="role"><SelectValue placeholder="Sélectionnez un rôle" /></SelectTrigger>
                    <SelectContent>
                        {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
             </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>Annuler</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
