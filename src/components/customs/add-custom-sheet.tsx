
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
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Custom } from "@/lib/data";

interface AddCustomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustom: (customData: Omit<Custom, "id">) => Promise<void>;
}

const formFields = [
  { id: 'ethnicGroup', label: 'Groupe Ethnique', type: 'text', required: true },
  { id: 'regions', label: 'Région(s)', type: 'text', placeholder: 'Séparées par une virgule' },
  { id: 'languages', label: 'Langue(s)', type: 'text', placeholder: 'Séparées par une virgule' },
  { id: 'historicalOrigin', label: 'Origine Historique/Légendaire', type: 'textarea' },
  { id: 'socialStructure', label: 'Structure Sociale', type: 'textarea' },
  { id: 'politicalStructure', label: 'Structure Politique', type: 'textarea' },
  { id: 'successionSystem', label: 'Système de Succession', type: 'textarea' },
  { id: 'traditionalMarriage', label: 'Mariage Traditionnel', type: 'textarea' },
  { id: 'funerals', label: 'Funérailles', type: 'textarea' },
  { id: 'initiations', label: 'Rites d\'Initiation', type: 'textarea' },
  { id: 'celebrations', label: 'Fêtes et Célébrations', type: 'textarea' },
  { id: 'beliefs', label: 'Croyances et Spiritualité', type: 'textarea' },
  { id: 'religiousPractices', label: 'Pratiques Religieuses', type: 'textarea' },
  { id: 'sacredPlaces', label: 'Lieux Sacrés', type: 'textarea' },
  { id: 'culturalSymbols', label: 'Symboles et Objets Culturels', type: 'textarea' },
  { id: 'normsAndValues', label: 'Normes et Valeurs', type: 'textarea' },
  { id: 'conflictResolutionSystem', label: 'Résolution des Conflits', type: 'textarea' },
  { id: 'modernityImpact', label: 'Impact de la Modernité', type: 'textarea' },
  { id: 'preservationInitiatives', label: 'Initiatives de Sauvegarde', type: 'textarea' },
  { id: 'intergenerationalTransmission', label: 'Transmission Intergénérationnelle', type: 'textarea' },
];

export function AddCustomSheet({ isOpen, onClose, onAddCustom }: AddCustomSheetProps) {
  const [formData, setFormData] = useState<Partial<Omit<Custom, 'id'>>>({});
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({});
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ethnicGroup) {
      setError("Le nom du groupe ethnique est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      await onAddCustom(formData as Omit<Custom, 'id'>);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'ajout de la fiche.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <SheetHeader>
            <SheetTitle>Ajouter une Fiche de Coutume</SheetTitle>
            <SheetDescription>
              Remplissez les informations pour documenter une nouvelle tradition.
            </SheetDescription>
          </SheetHeader>
          <div className="h-[calc(100vh-150px)]">
            <ScrollArea className="h-full w-full pr-6 py-4">
              <div className="space-y-4">
                {formFields.map(field => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        id={field.id}
                        name={field.id}
                        value={(formData as any)[field.id] || ''}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder={field.placeholder || ''}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        name={field.id}
                        type={field.type}
                        value={(formData as any)[field.id] || ''}
                        onChange={handleInputChange}
                        required={field.required}
                        placeholder={field.placeholder || ''}
                      />
                    )}
                  </div>
                ))}
                {error && <p className="text-sm text-destructive text-center">{error}</p>}
              </div>
            </ScrollArea>
          </div>
          <SheetFooter className="border-t pt-4">
            <SheetClose asChild>
              <Button type="button" variant="outline">Annuler</Button>
            </SheetClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Enregistrer la Fiche"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
