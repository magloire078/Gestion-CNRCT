
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, Fuel, User, Car } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FuelCard, FuelProvider } from "@/types/fuel";
import type { Employe, Fleet } from "@/lib/data";

interface CardListProps {
    cards: FuelCard[];
    providers: FuelProvider[];
    onEdit?: (card: FuelCard) => void;
    onDelete?: (id: string) => void;
    onRecharge?: (card: FuelCard) => void;
    employees?: Employe[];
    vehicles?: Fleet[];
}

export function FuelCardList({ cards, providers, onEdit, onDelete, onRecharge, employees = [], vehicles = [] }: CardListProps) {
    if (cards.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune carte enregistrée.
            </div>
        );
    }

    const getProviderName = (id: string) => providers.find(p => p.id === id)?.name || "N/A";

    const getAssignmentLabel = (card: FuelCard) => {
        if (card.assignmentType === 'vehicle') {
            const vehicle = vehicles.find(v => v.plate === card.assignmentId);
            return (
                <div className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {vehicle ? `${vehicle.makeModel} (${vehicle.plate})` : card.assignmentId}
                </div>
            );
        }
        if (card.assignmentType === 'employee') {
            const employee = employees.find(e => e.id === card.assignmentId);
            return (
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {employee ? employee.name : "Personnel"}
                </div>
            );
        }
        return <div className="flex items-center gap-2 text-muted-foreground italic">{card.assignmentId || "Générique"}</div>;
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>N° Carte</TableHead>
                    <TableHead>Prestataire</TableHead>
                    <TableHead>Affectation</TableHead>
                    <TableHead className="text-right">Solde Actuel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {cards.map((c) => (
                    <TableRow key={c.id}>
                        <TableCell className="font-mono font-medium">{c.cardNumber}</TableCell>
                        <TableCell>{getProviderName(c.providerId)}</TableCell>
                        <TableCell>{getAssignmentLabel(c)}</TableCell>
                        <TableCell className="text-right font-bold text-emerald-600">
                            {c.currentBalance.toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                            <Badge variant={c.status === 'active' ? 'outline' : 'destructive'} className={c.status === 'active' ? 'border-emerald-500 text-emerald-600' : ''}>
                                {c.status === 'active' ? 'Active' : c.status === 'blocked' ? 'Bloquée' : 'Expirée'}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onRecharge?.(c)}>
                                        <Fuel className="mr-2 h-4 w-4" /> Recharger
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onEdit?.(c)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(c.id)}>
                                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
