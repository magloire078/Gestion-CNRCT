
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
import type { Ticket, TicketCategory, TicketPriority, TicketUrgency, TicketImpact } from "@/lib/data";

interface AddTicketSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTicket: (ticket: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "status">) => Promise<void>;
  currentUser: { id: string; name: string };
}

const ticketCategories: TicketCategory[] = ['Matériel', 'Logiciel', 'Réseau', 'Accès/Comptes', 'Foncier', 'Autre'];
const ticketUrgencies: TicketUrgency[] = ['Basse', 'Moyenne', 'Haute'];
const ticketImpacts: TicketImpact[] = ['Bas', 'Moyen', 'Élevé'];
const ticketPriorities: TicketPriority[] = ['Basse', 'Moyenne', 'Haute'];

export function AddTicketSheet({ isOpen, onClose, onAddTicket, currentUser }: AddTicketSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Autre");
  const [urgency, setUrgency] = useState<TicketUrgency>("Moyenne");
  const [impact, setImpact] = useState<TicketImpact>("Moyen");
  const [priority, setPriority] = useState<TicketPriority>("Moyenne");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("Autre");
    setUrgency("Moyenne");
    setImpact("Moyen");
    setPriority("Moyenne");
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
        urgency,
        impact,
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
                <Label htmlFor="urgency">Urgence</Label>
                <Select value={urgency} onValueChange={(value: TicketUrgency) => setUrgency(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ticketUrgencies.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="impact">Impact</Label>
                <Select value={impact} onValueChange={(value: TicketImpact) => setImpact(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ticketImpacts.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priorité souhaitée</Label>
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
