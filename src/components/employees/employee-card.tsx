"use client";

import Link from "next/link";
import { MoreHorizontal, Eye, Pencil, Trash2, ShieldCheck } from "lucide-react";
import type { Employe } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Status = "Actif" | "En congé" | "Licencié" | "Retraité" | "Décédé";

const statusVariantMap: Record<Status, "default" | "secondary" | "destructive" | "outline"> = {
  Actif: "default",
  "En congé": "secondary",
  Licencié: "destructive",
  Retraité: "outline",
  Décédé: "outline",
};

type EmployeeCardProps = {
  employee: Employe;
  index: number;
  isGeoTab: boolean;
  orgUnit?: string;
  avatarBgClass: string;
  onClick: () => void;
  onDelete: () => void;
};

export function EmployeeCard({
  employee,
  index,
  isGeoTab,
  orgUnit,
  avatarBgClass,
  onClick,
  onDelete,
}: EmployeeCardProps) {
  const fullName = `${employee.lastName || ""} ${employee.firstName || ""}`.trim();

  return (
    <div
      onClick={onClick}
      className="group relative flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all active:scale-[0.98] active:bg-slate-50 cursor-pointer"
    >
      <span className="absolute top-2 right-2 text-[10px] font-black text-slate-300 tabular-nums">
        #{index}
      </span>

      <Avatar className="h-14 w-14 border-2 border-white shadow-sm shrink-0">
        <AvatarImage src={employee.photoUrl || ""} alt={fullName} className="object-cover" />
        <AvatarFallback className={cn("font-black text-xs", avatarBgClass)}>
          {(employee.lastName || "").charAt(0)}
          {(employee.firstName || "").charAt(0)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-black text-slate-900 uppercase tracking-tight text-sm truncate">
              {fullName}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
              {employee.poste}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {employee.matricule && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 tracking-wider">
              {employee.matricule}
            </span>
          )}
          {!isGeoTab && employee.status && (
            <Badge
              variant={statusVariantMap[employee.status as Status] || "default"}
              className="font-black text-[9px] uppercase tracking-widest rounded-md px-2 py-0.5 border-none shadow-sm"
            >
              {employee.status}
            </Badge>
          )}
          {!isGeoTab && employee.CNPS && (
            <ShieldCheck className="h-4 w-4 text-emerald-500" aria-label="CNPS" />
          )}
        </div>

        {isGeoTab ? (
          <p className="mt-1.5 text-xs font-medium text-slate-600 truncate">
            {[employee.Region, employee.Departement, employee.subPrefecture]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : (
          orgUnit && (
            <p className="mt-1.5 text-xs font-medium text-slate-600 truncate">{orgUnit}</p>
          )
        )}
      </div>

      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-11 w-11 rounded-xl hover:bg-slate-100"
              aria-label="Actions"
            >
              <MoreHorizontal className="h-5 w-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-2 rounded-2xl border-white/20 bg-white/95 backdrop-blur-xl shadow-2xl"
          >
            <DropdownMenuLabel className="px-3 py-2 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">
              Actions Dossier
            </DropdownMenuLabel>
            <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 px-3 cursor-pointer">
              <Link href={`/employees/${employee.id}`}>
                <Eye className="mr-2 h-4 w-4 text-blue-500" /> Profil Complet
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="rounded-xl font-bold py-2.5 px-3 cursor-pointer">
              <Link href={`/employees/${employee.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4 text-amber-500" /> Modifier Données
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => setTimeout(onDelete, 50)}
              className="rounded-xl text-rose-600 font-bold py-2.5 px-3 focus:bg-rose-50 focus:text-rose-600 cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Radiation Agent
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
