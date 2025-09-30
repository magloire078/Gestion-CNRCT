
"use client";

import { Briefcase, TrendingUp, UserCheck, UserX, Pencil, Trash2 } from "lucide-react";
import type { EmployeeEvent } from "@/lib/data";
import { format, parseISO, differenceInYears, isValid } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";

interface EmployeeHistoryTimelineProps {
  events: EmployeeEvent[];
  onEdit: (event: EmployeeEvent) => void;
  onDelete: (event: EmployeeEvent) => void;
}

const eventTypeConfig = {
  Promotion: { icon: TrendingUp, color: "bg-green-500" },
  Augmentation: { icon: TrendingUp, color: "bg-blue-500" },
  "Changement de poste": { icon: Briefcase, color: "bg-purple-500" },
  Départ: { icon: UserX, color: "bg-red-500" },
  Autre: { icon: Briefcase, color: "bg-gray-500" },
};

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || isNaN(value)) return '-';
    return new Intl.NumberFormat('fr-FR').format(value);
}

const indemnityLabels: Record<string, string> = {
    baseSalary: 'Salaire de Base',
    indemniteTransportImposable: 'Ind. Transport (Imp.)',
    indemniteSujetion: 'Ind. Sujétion',
    indemniteCommunication: 'Ind. Communication',
    indemniteRepresentation: 'Ind. Représentation',
    indemniteResponsabilite: 'Ind. Responsabilité',
    indemniteLogement: 'Ind. Logement',
    transportNonImposable: 'Transport (Non Imp.)',
};

const calculateTotals = (details: Record<string, any>, prefix = '') => {
    const base = Number(details[`${prefix}baseSalary`] || 0);
    const transport = Number(details[`${prefix}indemniteTransportImposable`] || 0);
    const sujetion = Number(details[`${prefix}indemniteSujetion`] || 0);
    const communication = Number(details[`${prefix}indemniteCommunication`] || 0);
    const representation = Number(details[`${prefix}indemniteRepresentation`] || 0);
    const responsabilite = Number(details[`${prefix}indemniteResponsabilite`] || 0);
    const logement = Number(details[`${prefix}indemniteLogement`] || 0);
    const transportNonImp = Number(details[`${prefix}transportNonImposable`] || 0);
    
    // Simplistic prime calculation for display
    const hireDate = details.employeeHireDate ? parseISO(details.employeeHireDate) : new Date();
    const eventDate = details.eventEffectiveDate ? parseISO(details.eventEffectiveDate) : new Date();
    const yearsOfService = isValid(hireDate) && isValid(eventDate) ? differenceInYears(eventDate, hireDate) : 0;
    const primeAnciennete = yearsOfService >= 2 ? base * (Math.min(25, yearsOfService) / 100) : 0;

    const brutImposable = base + primeAnciennete + transport + sujetion + communication + representation + responsabilite + logement;
    const cnps = brutImposable * 0.063; // Simplified CNPS calculation for display
    const net = brutImposable + transportNonImp - cnps;
    
    return { brut: Math.round(brutImposable), net: Math.round(net) };
}

export function EmployeeHistoryTimeline({ events, onEdit, onDelete }: EmployeeHistoryTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-lg">
        <p className="mt-4 text-muted-foreground">Aucun événement historique n'a été enregistré pour cet employé.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
      <ul className="space-y-8">
        {events.map((event) => {
          const config = eventTypeConfig[event.eventType] || eventTypeConfig.Autre;
          const isAugmentation = event.eventType === 'Augmentation' && event.details;
          const { brut: newBrut, net: newNet } = isAugmentation ? calculateTotals(event.details) : { brut: 0, net: 0 };
          const { brut: oldBrut, net: oldNet } = isAugmentation ? calculateTotals(event.details, 'previous_') : { brut: 0, net: 0 };
          
          return (
            <li key={event.id} className="relative group">
              <span className={`absolute -left-[38px] top-1 flex h-6 w-6 items-center justify-center rounded-full ${config.color}`}>
                <config.icon className="h-4 w-4 text-white" />
              </span>
              <div className="ml-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-base">{event.eventType}</p>
                        <p className="text-sm text-muted-foreground">
                            {format(parseISO(event.effectiveDate), "dd MMMM yyyy", { locale: fr })}
                        </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(event)}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                        </Button>
                         <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(event)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                             <span className="sr-only">Supprimer</span>
                        </Button>
                    </div>
                </div>
                <p className="mt-1 text-sm">{event.description}</p>
                 <div className="mt-2 text-xs space-y-2">
                    {event.details?.newPoste && (
                        <p className="font-medium">Nouveau poste : <span className="text-purple-600">{event.details.newPoste}</span></p>
                    )}
                    {isAugmentation && (
                      <div className="p-3 border rounded-md bg-muted/50 space-y-2">
                        <div className="grid grid-cols-3 gap-2 font-medium">
                            <span>Élément</span>
                            <span className="text-right">Ancienne Valeur</span>
                            <span className="text-right">Nouvelle Valeur</span>
                        </div>
                        {Object.keys(indemnityLabels).map(key => {
                            const oldValue = event.details![`previous_${key}`];
                            const newValue = event.details![key];
                            if(newValue !== undefined && oldValue !== newValue) {
                                return (
                                     <div key={key} className="grid grid-cols-3 gap-2 items-center">
                                        <span className="text-muted-foreground">{indemnityLabels[key]}</span>
                                        <span className="text-right text-muted-foreground line-through font-mono">{formatCurrency(oldValue)}</span>
                                        <span className="text-right font-mono">{formatCurrency(newValue)}</span>
                                    </div>
                                )
                            }
                            return null;
                        })}
                         <div className="grid grid-cols-3 gap-2 pt-2 border-t font-semibold">
                            <span className="text-muted-foreground">Brut</span>
                            <span className="text-right text-muted-foreground line-through font-mono">{formatCurrency(oldBrut)}</span>
                            <span className="text-right font-mono">{formatCurrency(newBrut)}</span>
                        </div>
                         <div className="grid grid-cols-3 gap-2 font-semibold">
                            <span className="text-muted-foreground">Net</span>
                            <span className="text-right text-muted-foreground line-through font-mono">{formatCurrency(oldNet)}</span>
                            <span className="text-right font-mono">{formatCurrency(newNet)}</span>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
