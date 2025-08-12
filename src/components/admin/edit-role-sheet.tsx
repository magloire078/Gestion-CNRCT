
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { allPermissions, type PermissionValue } from "@/lib/permissions";
import { ScrollArea } from "../ui/scroll-area";

interface EditRoleSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateRole: (roleId: string, permissions: string[]) => Promise<void>;
  role: Role;
}

export function EditRoleSheet({ isOpen, onClose, onUpdateRole, role }: EditRoleSheetProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<PermissionValue[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (role) {
      setSelectedPermissions(role.permissions as PermissionValue[]);
    }
  }, [role]);

  const handleClose = () => {
    setError("");
    onClose();
  };

  const handlePermissionChange = (permission: PermissionValue, checked: boolean) => {
    setSelectedPermissions(prev => 
      checked ? [...prev, permission] : prev.filter(p => p !== permission)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPermissions.length === 0) {
      setError("Un rôle doit avoir au moins une permission.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    try {
      await onUpdateRole(role.id, selectedPermissions);
      toast({ title: "Rôle mis à jour", description: "Les permissions ont été modifiées avec succès." });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la mise à jour du rôle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader>
            <SheetTitle>Modifier le rôle : {role.name}</SheetTitle>
            <SheetDescription>
              Ajustez les permissions pour ce rôle.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 py-4 space-y-4 overflow-hidden">
            <div className="px-1">
              <Label htmlFor="name">Nom du Rôle</Label>
              <Input id="name" value={role.name} className="mt-2" disabled />
            </div>
             <div className="px-1">
              <Label>Permissions</Label>
            </div>
             <ScrollArea className="h-[calc(100%-120px)] border rounded-md p-4">
                <div className="space-y-4">
                    {Object.entries(allPermissions).map(([label, value]) => (
                        <div key={value} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`edit-${value}`}
                                checked={selectedPermissions.includes(value)}
                                onCheckedChange={(checked) => handlePermissionChange(value, !!checked)}
                            />
                            <Label htmlFor={`edit-${value}`} className="font-normal">{label}</Label>
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
              {isSubmitting ? "Enregistrement..." : "Enregistrer les Permissions"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
