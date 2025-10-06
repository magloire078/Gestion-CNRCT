
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { allPermissions, type PermissionValue } from "@/lib/permissions";
import { ScrollArea } from "../ui/scroll-area";

interface AddRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRole: (role: Role) => void;
  roles: Role[];
}

export function AddRoleSheet({ isOpen, onClose, onAddRole, roles }: AddRoleSheetProps) {
  const [name, setName] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionValue[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName("");
    setSelectedPermissions([]);
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };
  
  const handlePermissionChange = (permission: PermissionValue, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked ? [...prev, permission] : prev.filter(p => p !== permission)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      setError("Le nom du rôle est obligatoire.");
      return;
    }
    if (selectedPermissions.length === 0) {
        setError("Veuillez sélectionner au moins une permission.");
        return;
    }

    if (roles.some(role => role.name.toLowerCase() === name.toLowerCase())) {
        setError(`Le rôle "${name}" existe déjà.`);
        return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      const newRole = await addRole({ name, permissions: selectedPermissions });
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
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="name">Nom du Rôle</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Permissions</Label>
            </div>
             <ScrollArea className="h-64 border rounded-md p-4">
                <div className="space-y-4">
                    {Object.entries(allPermissions).map(([label, value]) => (
                        <div key={value} className="flex items-center space-x-2">
                             <Checkbox 
                                id={`add-${value}`}
                                checked={selectedPermissions.includes(value)}
                                onCheckedChange={(checked) => handlePermissionChange(value, !!checked)}
                            />
                            <Label htmlFor={`add-${value}`} className="font-normal">{label}</Label>
                        </div>
                    ))}
                </div>
            </ScrollArea>
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
