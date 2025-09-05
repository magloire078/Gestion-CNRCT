
"use client";

import { Briefcase, TrendingUp, UserCheck, UserX } from "lucide-react";
import type { EmployeeEvent } from "@/lib/data";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface EmployeeHistoryTimelineProps {
  events: EmployeeEvent[];
}

const eventTypeConfig = {
  Promotion: { icon: TrendingUp, color: "bg-green-500" },
  Augmentation: { icon: TrendingUp, color: "bg-blue-500" },
  "Changement de poste": { icon: Briefcase, color: "bg-purple-500" },
  Départ: { icon: UserX, color: "bg-red-500" },
  Autre: { icon: Briefcase, color: "bg-gray-500" },
};

export function EmployeeHistoryTimeline({ events }: EmployeeHistoryTimelineProps) {
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
          return (
            <li key={event.id} className="relative">
              <span className={`absolute -left-[38px] top-1 flex h-6 w-6 items-center justify-center rounded-full ${config.color}`}>
                <config.icon className="h-4 w-4 text-white" />
              </span>
              <div className="ml-4">
                <p className="font-semibold text-base">{event.eventType}</p>
                <p className="text-sm text-muted-foreground">
                  {format(parseISO(event.effectiveDate), "dd MMMM yyyy", { locale: fr })}
                </p>
                <p className="mt-1 text-sm">{event.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
