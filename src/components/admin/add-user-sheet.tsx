
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
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
import { getRoles } from "@/services/role-service";
import { useToast } from "@/hooks/use-toast";

interface AddUserSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
}

export function AddUserSheet({ isOpen, onClose, onAddUser }: AddUserSheetProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (isOpen) {
        async function fetchRoles() {
            try {
                const fetchedRoles = await getRoles();
                setRoles(fetchedRoles);
            } catch(err) {
                console.error("Failed to fetch roles:", err);
                setError("Impossible de charger les rôles.");
            }
        }
        fetchRoles();
    }
  }, [isOpen]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setRoleId("");
    setError("");
    setRoles([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
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
      const newUser = await addUser({ name, email, roleId });
      onAddUser(newUser);
      toast({ title: "Utilisateur ajouté", description: `${name} a été ajouté avec succès. Il doit maintenant être invité ou créer un mot de passe.` });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de l'utilisateur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter un nouvel utilisateur</SheetTitle>
            <SheetDescription>
              Remplissez les détails pour ajouter un nouvel utilisateur au système. L'utilisateur devra ensuite s'inscrire avec le même email pour se connecter.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nom</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">Rôle</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive col-span-4 text-center">{error}</p>}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting || roles.length === 0}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
