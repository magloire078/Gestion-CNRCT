
"use client";
import React, { useMemo } from "react";

import { Briefcase, TrendingUp, UserCheck, UserX, Pencil, Trash2, Calendar, History, ArrowRightLeft, ShieldCheck, Wallet, ChevronRight } from "lucide-react";
import type { EmployeeEvent, Employe } from "@/lib/data";
import { format, parseISO, differenceInYears, isValid, differenceInMonths, addYears, addMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmployeeHistoryTimelineProps {
  events: EmployeeEvent[];
  onEdit: (event: EmployeeEvent) => void;
  onDelete: (event: EmployeeEvent) => void;
}

const eventTypeConfig = {
  'Promotion': { icon: TrendingUp, color: "bg-green-500" },
  'Augmentation au Mérite': { icon: TrendingUp, color: "bg-blue-500" },
  'Ajustement de Marché': { icon: TrendingUp, color: "bg-sky-500" },
  'Revalorisation Salariale': { icon: TrendingUp, color: "bg-indigo-500" },
  "Changement de poste": { icon: Briefcase, color: "bg-purple-500" },
  'Départ': { icon: UserX, color: "bg-red-500" },
  'Autre': { icon: Briefcase, color: "bg-gray-500" },
};

const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null || isNaN(value)) return '-';
    return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

const indemnityLabels: Record<string, string> = {
    baseSalary: 'Salaire de Base',
    primeAnciennete: 'Prime Ancienneté',
    indemniteTransportImposable: 'Ind. Transport (Imp.)',
    indemniteSujetion: 'Ind. Sujétion',
    indemniteCommunication: 'Ind. Communication',
    indemniteRepresentation: 'Ind. Représentation',
    indemniteResponsabilite: 'Ind. Responsabilité',
    indemniteLogement: 'Ind. Logement',
    transportNonImposable: 'Transport (Non Imp.)',
};

const indemnityFields = Object.keys(indemnityLabels);
const salaryEventTypes: EmployeeEvent['eventType'][] = ['Augmentation au Mérite', 'Promotion', 'Ajustement de Marché', 'Revalorisation Salariale', 'Changement de poste', 'Autre'];

const calculateTotals = (details: Record<string, any>, prefix = '') => {
    const base = Number(details[`${prefix}baseSalary`] || 0);

    const hireDateStr = details.employeeHireDate;
    const eventDateStr = details.eventEffectiveDate;
    
    let primeAnciennete = 0;
    let yearsOfServiceText = 'N/A';

    if(hireDateStr && eventDateStr) {
        const hireDate = parseISO(hireDateStr);
        const eventDate = parseISO(eventDateStr);
        if(isValid(hireDate) && isValid(eventDate)) {
            const yearsOfService = differenceInYears(eventDate, hireDate);
            yearsOfServiceText = `${yearsOfService} an(s)`;
            if (yearsOfService >= 2) {
                const bonusRate = Math.min(25, yearsOfService);
                primeAnciennete = base * (bonusRate / 100);
            }
        }
    }
    
    const otherIndemnities = [
        'indemniteTransportImposable', 'indemniteSujetion', 'indemniteCommunication',
        'indemniteRepresentation', 'indemniteResponsabilite', 'indemniteLogement'
    ].reduce((sum, key) => sum + Number(details[`${prefix}${key}`] || 0), 0);

    const brutImposable = base + primeAnciennete + otherIndemnities;
    const transportNonImposable = Number(details[`${prefix}transportNonImposable`] || 0);
    const cnps = (details.cnpsEnabled === false) ? 0 : brutImposable * 0.063;
    const net = brutImposable + transportNonImposable - cnps;
    
    return { brut: Math.round(brutImposable), net: Math.round(net), anciennete: yearsOfServiceText };
}

const TimelineItem = React.memo(({ 
    event, 
    index, 
    events, 
    onEdit, 
    onDelete 
}: { 
    event: EmployeeEvent; 
    index: number; 
    events: EmployeeEvent[]; 
    onEdit: (e: EmployeeEvent) => void; 
    onDelete: (e: EmployeeEvent) => void;
}) => {
    const config = eventTypeConfig[event.eventType] || eventTypeConfig.Autre;
    const isSalaryEvent = salaryEventTypes.includes(event.eventType as any) && event.details;
    
    const eventDetailsWithContext = useMemo(() => ({
      ...event.details,
      eventEffectiveDate: event.effectiveDate,
    }), [event.details, event.effectiveDate]);
    
    const { brut: newBrut, net: newNet, anciennete } = useMemo(() => 
        isSalaryEvent ? calculateTotals(eventDetailsWithContext, '') : { brut: 0, net: 0, anciennete: '' }
    , [isSalaryEvent, eventDetailsWithContext]);
    
    const { brut: oldBrut, net: oldNet } = useMemo(() => 
        isSalaryEvent ? calculateTotals(eventDetailsWithContext, 'previous_') : { brut: 0, net: 0 }
    , [isSalaryEvent, eventDetailsWithContext]);
    
    const oldPeriod = useMemo(() => {
        if(!isSalaryEvent) return null;
        
        const currentEventDate = parseISO(event.effectiveDate);
        const previousEvent = events[index + 1];
        const employeeHireDate = event.details?.employeeHireDate ? parseISO(event.details.employeeHireDate) : null;
        
        const startDate = previousEvent ? parseISO(previousEvent.effectiveDate) : employeeHireDate;
        
        if (!startDate || !isValid(startDate)) return null;

        return `(du ${format(startDate, 'dd/MM/yy')} au ${format(currentEventDate, 'dd/MM/yy')})`;
    }, [isSalaryEvent, event.effectiveDate, event.details?.employeeHireDate, events, index]);

    return (
      <li className="relative group animate-in slide-in-from-left duration-500">
        <span className={cn(
          "absolute -left-[45px] top-0.5 flex h-8 w-8 items-center justify-center rounded-sm border-2 border-white shadow-lg z-10 transition-transform group-hover:scale-110",
          config.color
        )}>
          <config.icon className="h-4 w-4 text-white" />
        </span>
        
        <div className="relative">
          <div className="flex justify-between items-start mb-1.5">
              <div className="bg-white p-2.5 rounded-sm shadow-sm border border-slate-100 flex-1 group-hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">{event.eventType}</h4>
                      <div className="h-1 w-1 rounded-sm bg-slate-300" />
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                        <Calendar className="h-3 w-3" />
                        {format(parseISO(event.effectiveDate), "dd MMMM yyyy", { locale: fr })}
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-slate-100" onClick={() => onEdit(event)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-sm hover:bg-rose-50" onClick={() => onDelete(event)}>
                          <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>

                  <p className="mt-1.5 text-sm font-medium text-slate-600 leading-relaxed border-l-2 border-slate-100 pl-3">{event.description}</p>
                  
                  {event.details?.newPoste && (
                    <div className="mt-1.5 flex items-center gap-2 p-1.5 bg-indigo-50/50 rounded-sm border border-indigo-100 w-fit">
                      <Briefcase className="h-4 w-4 text-indigo-500" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Mutation : {event.details.newPoste}</span>
                    </div>
                  )}
              </div>
          </div>

          {isSalaryEvent && (
            <div className="mt-1.5 ml-4 animate-in fade-in slide-in-from-top-4 duration-500 delay-200">
              <div className="bg-slate-900 rounded-sm p-3 shadow-2xl relative overflow-hidden group/card max-w-2xl">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent)] opacity-50" />
                  
                  <div className="relative z-10 space-y-4">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                              <Wallet className="h-4 w-4 text-blue-400" />
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Revalorisation Salariale</h5>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-tighter text-slate-500 italic">{oldPeriod}</span>
                      </div>

                      <div className="space-y-2">
                          {indemnityFields.map(key => {
                              const oldValue = event.details![`previous_${key}`];
                              const newValue = event.details![key];
                              if (newValue !== undefined && oldValue !== undefined && Math.round(oldValue) !== Math.round(newValue)) {
                                  return (
                                       <div key={key} className="grid grid-cols-4 gap-4 items-center">
                                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 col-span-1">{indemnityLabels[key]}</span>
                                          <div className="flex items-center gap-3 col-span-3">
                                            <span className="text-right text-slate-600 line-through font-mono text-[10px]">{formatCurrency(oldValue)}</span>
                                            <ArrowRightLeft className="h-3 w-3 text-slate-700" />
                                            <span className="text-right font-black font-mono text-white tracking-widest text-xs">{formatCurrency(newValue)} <span className="text-[8px] opacity-40">FCFA</span></span>
                                          </div>
                                      </div>
                                  )
                              }
                              return null;
                          })}
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/10">
                          <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Impact Brut</p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold text-white tracking-widest">{formatCurrency(newBrut)}</span>
                                <span className={cn(
                                  "text-[8px] font-black px-1.5 py-0.5 rounded-sm",
                                  newBrut > oldBrut ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                )}>
                                  {newBrut > oldBrut ? '+' : ''}{oldBrut > 0 ? Math.round(((newBrut - oldBrut)/oldBrut)*100) : 100}%
                                </span>
                              </div>
                          </div>
                          <div className="space-y-1">
                              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500">Salaire Net Final</p>
                              <p className="text-lg font-black text-emerald-400 tracking-widest">{formatCurrency(newNet)} <span className="text-xs opacity-40">FCFA</span></p>
                          </div>
                      </div>

                      <div className="flex items-center gap-2 p-1.5 bg-white/5 rounded-sm border border-white/10 w-fit">
                          <ShieldCheck className="h-3 w-3 text-blue-400" />
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Ancienneté lors de l'acte: {anciennete}</span>
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>
      </li>
    );
});

export const EmployeeHistoryTimeline = React.memo(function EmployeeHistoryTimeline({ events, onEdit, onDelete }: EmployeeHistoryTimelineProps) {
  const memoizedEvents = useMemo(() => events, [events]);

  if (memoizedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-6 bg-slate-50/50 rounded-sm border-2 border-dashed border-slate-200">
        <div className="h-10 w-10 bg-white rounded-sm flex items-center justify-center shadow-sm mb-3">
          <History className="h-6 w-6 text-slate-300" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parcours collaborateur vierge</p>
        <p className="text-xs text-slate-500 mt-2">Aucune mutation ou revalorisation enregistrée</p>
      </div>
    );
  }

  return (
    <div className="relative pl-10 py-2">
      <div className="absolute left-[15px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />
      
      <ul className="space-y-4">
        {memoizedEvents.map((event, index) => (
          <TimelineItem 
            key={event.id} 
            event={event} 
            index={index} 
            events={memoizedEvents} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </ul>
    </div>
  );
});
