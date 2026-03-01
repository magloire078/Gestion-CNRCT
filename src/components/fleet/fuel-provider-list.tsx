
"use client";

import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { FuelProvider } from "@/types/fuel";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProviderListProps {
    providers: FuelProvider[];
    onEdit?: (provider: FuelProvider) => void;
    onDelete?: (id: string) => void;
}

export function FuelProviderList({ providers, onEdit, onDelete }: ProviderListProps) {
    if (providers.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucun prestataire enregistré.
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nom du Prestataire</TableHead>
                    <TableHead>Contact / Contrat</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'ajout</TableHead>
                    <TableHead className="w-10"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {providers.map((p) => (
                    <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell>
                            <div className="text-sm font-medium">{p.contactPerson || "-"}</div>
                            <div className="text-xs text-muted-foreground truncate">
                                {p.contractNumber || "Sans contrat"}
                            </div>
                        </TableCell>
                        <TableCell>
                            <Badge variant={p.status === 'active' ? 'default' : 'secondary'}>
                                {p.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                            {p.createdAt ? format(new Date(p.createdAt), 'dd MMM yyyy', { locale: fr }) : '-'}
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit?.(p)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Modifier
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete?.(p.id)}>
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
