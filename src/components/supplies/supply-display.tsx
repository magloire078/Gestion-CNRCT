"use client";

import { memo } from "react";
import {
    AlertTriangle, CheckCircle2, Package, MoreHorizontal,
    ShoppingCart, PlusCircle, RefreshCw, Settings, Trash2,
    ChevronRight, TrendingUp
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
    DropdownMenuItem, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import type { Supply } from "@/lib/data";
import { cn } from "@/lib/utils";

export const getStockStatus = (quantity: number, reorderLevel: number) => {
    if (quantity <= 0) return { text: "Rupture", color: "destructive", variant: "destructive" as any, value: 5, className: "bg-red-500", icon: AlertTriangle };
    if (quantity <= reorderLevel) return { text: "Stock Bas", color: "warning", variant: "secondary" as any, value: (quantity / (reorderLevel * 2)) * 100, className: "bg-amber-500", icon: AlertTriangle };
    const percentage = Math.min(100, (quantity / (reorderLevel * 2)) * 100);
    return { text: "Optimal", color: "success", variant: "default" as any, value: percentage, className: "bg-emerald-500", icon: CheckCircle2 };
};

interface SupplyRowProps {
    supply: Supply;
    index: number;
    openDistributeDialog: (s: Supply) => void;
    openRestockDialog: (s: Supply) => void;
    openEditSheet: (s: Supply) => void;
    openAdjustDialog: (s: Supply) => void;
    setDeleteTarget: (s: Supply) => void;
    hasRecentActivity: boolean;
}

export const SupplyRow = memo(function SupplyRow({
    supply, index, openDistributeDialog, openRestockDialog,
    openEditSheet, openAdjustDialog, setDeleteTarget, hasRecentActivity
}: SupplyRowProps) {
    const status = getStockStatus(supply.quantity, supply.reorderLevel);

    return (
        <TableRow key={supply.id} className={cn(
            "group hover:bg-primary/5 transition-colors duration-200 border-border/40",
            hasRecentActivity && "bg-blue-50/10"
        )}>
            <TableCell className="text-center font-bold text-muted-foreground opacity-50 py-2">
                {index + 1}
            </TableCell>
            <TableCell className="font-mono text-[9px] font-black text-muted-foreground py-2">
                <div className="flex flex-col gap-1 items-start">
                    <span className="bg-muted px-1 py-0.5 rounded text-foreground/70">{supply.code || 'NO-CODE'}</span>
                    {hasRecentActivity && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-[8px] px-1 py-0 border-none uppercase font-black w-fit">
                            Actif
                        </Badge>
                    )}
                </div>
            </TableCell>
            <TableCell className="py-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-card/40 backdrop-blur-md border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm relative group">
                        {supply.photoUrl ? (
                            <img src={supply.photoUrl} alt={supply.name} className="w-full h-full object-cover" />
                        ) : (
                            <Package className="h-4 w-4 text-slate-400" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold tracking-tight">{supply.name}</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest leading-none mt-0.5">{supply.category}</span>
                    </div>
                </div>
            </TableCell>
            <TableCell className="text-center font-black text-foreground text-base py-2">{supply.quantity}</TableCell>
            <TableCell className="text-center text-muted-foreground font-bold text-[9px] uppercase tracking-widest py-2">{supply.reorderLevel}</TableCell>
            <TableCell className="py-2">
                <div className="flex flex-col gap-1 min-w-[100px]">
                    <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                        <span className={cn(
                            status.color === 'destructive' ? "text-red-500" :
                            status.color === 'warning' ? "text-amber-500" : "text-emerald-500"
                        )}>
                            {status.text}
                        </span>
                    </div>
                    <Progress
                        value={status.value}
                        className="h-1 rounded-full bg-muted border border-border/50"
                        indicatorClassName={cn("transition-all duration-1000", status.className)}
                    />
                </div>
            </TableCell>
            <TableCell className="text-right py-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full hover:bg-primary/10 transition-colors duration-150">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                        <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50 px-2 py-1.5">Gestion d'Inventaire</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openDistributeDialog(supply)} className="cursor-pointer font-bold text-foreground focus:bg-primary/10 rounded-lg mx-1 my-0.5">
                            <ShoppingCart className="mr-2 h-4 w-4 text-blue-600" /> Distribuer Article
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openRestockDialog(supply)} className="cursor-pointer font-bold text-emerald-600 focus:bg-emerald-50 rounded-lg mx-1 my-0.5">
                            <PlusCircle className="mr-2 h-4 w-4" /> Réapprovisionner
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openAdjustDialog(supply)} className="cursor-pointer font-bold text-amber-600 focus:bg-amber-50 rounded-lg mx-1 my-0.5">
                            <RefreshCw className="mr-2 h-4 w-4" /> Régulariser le Stock
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditSheet(supply)} className="cursor-pointer font-bold mx-1 my-0.5 rounded-lg">
                            <Settings className="mr-2 h-4 w-4 text-slate-400" /> Paramètres Article
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeleteTarget(supply)} className="text-destructive font-bold focus:bg-destructive/10 cursor-pointer mx-1 my-0.5 rounded-lg">
                            <Trash2 className="mr-2 h-4 w-4" /> Supprimer Définitivement
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
});

interface SupplyCardProps {
    supply: Supply;
    hasRecentActivity: boolean;
    openDistributeDialog: (s: Supply) => void;
    openEditSheet: (s: Supply) => void;
    openAdjustDialog: (s: Supply) => void;
    setDeleteTarget: (s: Supply) => void;
}

export const SupplyCard = memo(function SupplyCard({
    supply, hasRecentActivity, openDistributeDialog,
    openEditSheet, openAdjustDialog, setDeleteTarget
}: SupplyCardProps) {
    const status = getStockStatus(supply.quantity, supply.reorderLevel);

    return (
        <Card key={supply.id} className="group overflow-hidden rounded-xl border-white/10 shadow-lg bg-card/40 backdrop-blur-md transition-[transform,shadow] duration-200 hover:shadow-xl hover:-translate-y-1 relative contain-layout">
            <div className={cn("h-1 w-full", status.className)} />
            <CardHeader className="p-3 pb-2">
                <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="bg-card/60 backdrop-blur-sm border-white/10 rounded-md text-[8px] font-black uppercase tracking-widest px-1.5 py-0">
                            {supply.category}
                        </Badge>
                        {supply.code && (
                            <Badge variant="secondary" className="bg-slate-900/10 text-slate-600 border-none rounded-md text-[8px] font-black px-1.5 py-0">
                                {supply.code}
                            </Badge>
                        )}
                        {hasRecentActivity && (
                            <Badge variant="secondary" className="bg-blue-100/50 text-blue-700 border-none rounded-md text-[8px] font-black px-1.5 py-0 uppercase">
                                Actif
                            </Badge>
                        )}
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-primary/10 transition-colors duration-150"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-white/10 bg-card/90 backdrop-blur-xl">
                            <DropdownMenuLabel className="font-black uppercase text-[10px] tracking-widest opacity-50 px-2 py-1.5">Options Article</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditSheet(supply)} className="font-bold rounded-lg mx-1 my-0.5"><Settings className="mr-2 h-4 w-4 text-slate-400" /> Modifier Détails</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAdjustDialog(supply)} className="font-bold text-amber-600 rounded-lg mx-1 my-0.5"><RefreshCw className="mr-2 h-4 w-4" /> Régulariser Stock</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteTarget(supply)} className="text-destructive font-bold focus:bg-destructive/10 rounded-lg mx-1 my-0.5"><Trash2 className="mr-2 h-4 w-4" /> Supprimer</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <CardTitle className="text-sm font-black text-slate-900 tracking-tight leading-snug mt-1.5 line-clamp-2 min-h-[2.5rem]">{supply.name}</CardTitle>
            </CardHeader>
            <div className="px-3 pb-1.5">
                <div className="w-full aspect-video rounded-xl bg-card/40 backdrop-blur-md border border-white/10 overflow-hidden flex items-center justify-center relative group shadow-inner">
                    {supply.photoUrl ? (
                        <img src={supply.photoUrl} alt={supply.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    ) : (
                        <div className="flex flex-col items-center gap-1.5">
                            <Package className="h-6 w-6 text-slate-300" />
                            <span className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Institutionnel</span>
                        </div>
                    )}
                    {supply.quantity <= supply.reorderLevel && (
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase rounded shadow-xl z-10 animate-pulse border border-white/20">
                            Stock Bas
                        </div>
                    )}
                </div>
            </div>
            <CardContent className="px-3 pb-3">
                <div className="space-y-2.5">
                    <div className="flex justify-between items-end">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Stock</p>
                            <p className="text-xl font-black text-slate-900 leading-none">{supply.quantity}</p>
                        </div>
                        <div className="text-right space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Seuil</p>
                            <p className="text-[10px] font-black text-slate-600 bg-muted px-1 py-0 rounded inline-block leading-none">{supply.reorderLevel}</p>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black uppercase tracking-widest">
                            <span className={cn(
                                "flex items-center gap-1",
                                status.color === 'destructive' ? "text-red-500" :
                                status.color === 'warning' ? "text-amber-500" : "text-emerald-500"
                            )}>
                                <div className={cn("h-1 w-1 rounded-full", status.className)} />
                                {status.text}
                            </span>
                            <span className="text-slate-400">{Math.round(status.value)}%</span>
                        </div>
                        <Progress value={status.value} className="h-1 rounded-full bg-muted border border-border/10 overflow-hidden" indicatorClassName={cn("transition-all duration-1000", status.className)} />
                    </div>
                    <div className="pt-1">
                        <Button
                            onClick={() => openDistributeDialog(supply)}
                            disabled={supply.quantity <= 0}
                            className="w-full bg-slate-900 rounded-lg h-8 text-[9px] font-black uppercase tracking-widest shadow-lg hover:shadow-xl transition-all active:scale-95"
                        >
                            <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Distribuer
                        </Button>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="bg-card/20 py-1.5 border-t border-white/5 flex justify-between items-center px-3.5">
                <div className="flex items-center gap-1 text-[8px] text-slate-400 font-black uppercase tracking-tighter">
                    <TrendingUp className="h-2.5 w-2.5 text-primary/50" /> {supply.lastRestockDate ? `MAJ: ${supply.lastRestockDate}` : 'Aucun mouvement'}
                </div>
                <Button variant="ghost" size="sm" onClick={() => openEditSheet(supply)} className="h-6 text-[8px] uppercase font-black tracking-widest text-slate-400 hover:text-slate-900 p-0 hover:bg-transparent transition-colors">
                    Gérer <ChevronRight className="ml-1 h-2.5 w-2.5" />
                </Button>
            </CardFooter>
        </Card>
    );
});
