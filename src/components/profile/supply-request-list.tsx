"use client";

import { useState, useEffect } from "react";
import { subscribeToSupplyRequests } from "@/services/supply-request-service";
import type { SupplyRequest, SupplyRequestStatus } from "@/types/supply";
import { useAuth } from "@/hooks/use-auth";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    Clock, CheckCircle2, XCircle, Package, ArrowRight, Calendar, User, 
    MessageSquare, ChevronDown, ChevronUp, History
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Collapsible, CollapsibleContent, CollapsibleTrigger 
} from "@/components/ui/collapsible";

const statusConfig: Record<SupplyRequestStatus, { label: string, color: string, icon: any }> = {
    'Draft': { label: 'Brouillon', color: 'bg-slate-100 text-slate-600', icon: Clock },
    'Pending_Supervisor': { label: 'Attente Supérieur', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: History },
    'Pending_Stock': { label: 'Attente Stock', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Package },
    'Served': { label: 'Livré', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    'Rejected': { label: 'Rejeté', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
};

export function SupplyRequestList() {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToSupplyRequests(
            { employeeId: user.id },
            (data) => {
                setRequests(data);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
            </div>
        );
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
                <Package className="h-12 w-12 text-slate-200 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Aucune demande</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                    Vous n'avez pas encore effectué de demande de fournitures.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {requests.map((request) => {
                const config = statusConfig[request.status];
                const StatusIcon = config.icon;
                const isExpanded = expandedRequest === request.id;

                return (
                    <Card key={request.id} className={cn(
                        "overflow-hidden transition-all duration-300 border-slate-100 shadow-sm hover:shadow-md",
                        isExpanded ? "ring-2 ring-blue-500/20" : ""
                    )}>
                        <div className="flex flex-col">
                            {/* Header / Summary */}
                            <div 
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                                onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shadow-inner", config.color)}>
                                        <StatusIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-black text-slate-900">Demande #{request.id.slice(-5).toUpperCase()}</p>
                                            <Badge variant="outline" className={cn("rounded-full font-bold px-2 text-[10px]", config.color)}>
                                                {config.label}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {format(new Date(request.createdAt), "d MMMM yyyy", { locale: fr })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="h-3 w-3" />
                                                {request.items.length} article(s)
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="hidden sm:block text-right">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Dernière MAJ</p>
                                        <p className="text-xs font-bold text-slate-600">
                                            {format(new Date(request.updatedAt), "HH:mm", { locale: fr })}
                                        </p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-slate-100">
                                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {/* Details (Collapsible) */}
                            {isExpanded && (
                                <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                                    <div className="grid md:grid-cols-2 gap-6 mt-4">
                                        {/* Items Column */}
                                        <div className="space-y-3">
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Articles demandés</p>
                                            <div className="space-y-2">
                                                {request.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 font-bold border border-slate-100">
                                                                {item.photoUrl ? (
                                                                    <img src={item.photoUrl} alt="" crossOrigin="anonymous" className="w-full h-full object-cover rounded-lg" />
                                                                ) : (
                                                                    <Package className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700">{item.supplyName}</span>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-slate-900 text-white rounded-lg h-6 px-2 font-black">
                                                            x{item.quantity}
                                                        </Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Timeline / Info Column */}
                                        <div className="space-y-4">
                                             {request.status === 'Rejected' && (
                                                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-2">
                                                    <p className="text-xs font-black uppercase tracking-widest text-red-600 flex items-center gap-2">
                                                        <XCircle className="h-3 w-3" /> Motif du refus
                                                    </p>
                                                    <p className="text-sm font-medium text-red-800 italic">
                                                        "{request.rejectionReason || "Aucun motif précisé"}"
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-200/50">
                                                        <div className="h-6 w-6 rounded-full bg-red-200 flex items-center justify-center text-[10px] font-bold text-red-700 uppercase">
                                                            {request.rejectedBy?.charAt(0) || 'A'}
                                                        </div>
                                                        <p className="text-[10px] font-bold text-red-600">Rejeté par {request.rejectedBy}</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Workflow</p>
                                                <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 ml-2">
                                                    {/* Validation Manager */}
                                                    <div className="relative">
                                                        <div className={cn(
                                                            "absolute -left-[31px] top-0 h-[14px] w-[14px] rounded-full border-2 bg-white",
                                                            request.validatedBySupervisorAt ? "border-emerald-500" : "border-slate-200"
                                                        )} />
                                                        <p className="text-xs font-bold text-slate-700">Validation Supérieur</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {request.validatedBySupervisorAt 
                                                                ? `Validé par ${request.supervisorName} le ${format(new Date(request.validatedBySupervisorAt), "d/MM à HH:mm")}` 
                                                                : "En attente de signature..."}
                                                        </p>
                                                        {request.supervisorComment && (
                                                             <div className="mt-1 flex items-start gap-1 p-2 bg-amber-50/50 rounded-lg text-[10px] text-amber-800 italic border border-amber-100/50">
                                                                <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                                "{request.supervisorComment}"
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Fulfillment Stock */}
                                                    <div className="relative">
                                                        <div className={cn(
                                                            "absolute -left-[31px] top-0 h-[14px] w-[14px] rounded-full border-2 bg-white",
                                                            request.servedAt ? "border-emerald-500" : "border-slate-200"
                                                        )} />
                                                        <p className="text-xs font-bold text-slate-700">Sortie de Stock</p>
                                                        <p className="text-[10px] text-slate-400 font-medium">
                                                            {request.servedAt 
                                                                ? `Livré par ${request.stockManagerName} le ${format(new Date(request.servedAt), "d/MM à HH:mm")}` 
                                                                : "En attente de livraison..."}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
