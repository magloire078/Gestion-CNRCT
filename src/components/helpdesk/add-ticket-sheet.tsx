
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Ticket, TicketCategory, TicketPriority } from "@/lib/data";

interface AddTicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>;
  currentUser: { id: string; name: string };
}

const ticketCategories: TicketCategory[] = ['Technique', 'Facturation', 'Général'];
const ticketPriorities: TicketPriority[] = ['Basse', 'Moyenne', 'Haute'];

export function AddTicketSheet({ isOpen, onClose, onAddTicket, currentUser }: AddTicketSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Général");
  const [priority, setPriority] = useState<TicketPriority>("Basse");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Général");
    setPriority("Basse");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) {
      setError("Le titre et la description sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const newTicketData: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "status"> = {
        title,
        description,
        category,
        priority,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        messages: []
      };

      await onAddTicket(newTicketData);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de la création du ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Créer un Nouveau Ticket</SheetTitle>
            <SheetDescription>
              Décrivez votre problème ou votre demande d'assistance.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Problème de connexion" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Décrivez le problème en détail..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={(value: TicketCategory) => setCategory(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ticketCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité</Label>
                <Select value={priority} onValueChange={(value: TicketPriority) => setPriority(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ticketPriorities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error && (
              <p className="text-center text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Annuler
              </Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Création en cours..." : "Créer le Ticket"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
