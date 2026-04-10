"use client";

import { useState, useEffect } from "react";
import { 
    subscribeToSupplyRequests, 
    validateBySupervisor, 
    rejectRequest, 
    fulfillSupplyRequest 
} from "@/services/supply-request-service";
import type { SupplyRequest, SupplyRequestStatus } from "@/types/supply";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
    Card, CardContent, CardHeader, CardTitle, CardDescription 
} from "@/components/ui/card";
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    CheckCircle2, XCircle, Package, User, Calendar, 
    ArrowRight, MessageSquare, Loader2, AlertCircle, ShoppingCart
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogFooter, DialogDescription, DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface PendingRequestsManagerProps {
    mode: 'supervisor' | 'stock';
}

export function PendingRequestsManager({ mode }: PendingRequestsManagerProps) {
    const [requests, setRequests] = useState<SupplyRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectionRequestId, setRejectionRequestId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        const status: SupplyRequestStatus = mode === 'supervisor' ? 'Pending_Supervisor' : 'Pending_Stock';
        const unsubscribe = subscribeToSupplyRequests(
            { status },
            (data) => {
                setRequests(data);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, [mode]);

    const handleValidateSupervisor = async (requestId: string) => {
        if (!user) return;
        setActionLoading(requestId);
        try {
            await validateBySupervisor(requestId, user.id, user.name || user.email);
            toast({ title: "Demande validée", description: "La demande a été transmise au service stock." });
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Action impossible." });
        } finally {
            setActionLoading(null);
        }
    };

    const handleServeRequest = async (requestId: string) => {
        if (!user) return;
        setActionLoading(requestId);
        try {
            await fulfillSupplyRequest(requestId, user.id, user.name || user.email);
            toast({ title: "Livraison validée", description: "Le stock a été mis à jour et l'employé notifié." });
        } catch (error: any) {
            toast({ 
                variant: "destructive", 
                title: "Erreur", 
                description: error.message || "Impossible de finaliser la livraison." 
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async () => {
        if (!rejectionRequestId || !user || !rejectionReason.trim()) return;
        setActionLoading(rejectionRequestId);
        try {
            await rejectRequest(rejectionRequestId, rejectionReason, user.name || user.email);
            toast({ title: "Demande rejetée", description: "L'employé a été informé du refus." });
            setRejectionRequestId(null);
            setRejectionReason("");
        } catch (error) {
            toast({ variant: "destructive", title: "Erreur", description: "Action impossible." });
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>;
    }

    if (requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                <div className="h-16 w-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Tout est à jour !</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                    Il n'y a aucune demande en attente de votre approbation pour le moment.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                {requests.map((request) => (
                    <Card key={request.id} className="rounded-2xl border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                        <CardHeader className="bg-slate-50/50 pb-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400">
                                        <User className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-black text-slate-900">{request.employeeName}</CardTitle>
                                        <div className="flex items-center gap-3 mt-0.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            <span>Le {format(new Date(request.createdAt), "d MMMM à HH:mm", { locale: fr })}</span>
                                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                                            <span>ID: #{request.id.slice(-5).toUpperCase()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button 
                                        variant="ghost" 
                                        className="text-red-600 font-bold hover:bg-red-50 hover:text-red-700 rounded-xl"
                                        onClick={() => setRejectionRequestId(request.id)}
                                        disabled={!!actionLoading}
                                    >
                                        <XCircle className="mr-2 h-4 w-4" /> Rejeter
                                    </Button>
                                    
                                    {mode === 'supervisor' ? (
                                        <Button 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl px-6 shadow-lg shadow-emerald-100"
                                            onClick={() => handleValidateSupervisor(request.id)}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                            Valider
                                        </Button>
                                    ) : (
                                        <Button 
                                            className="bg-slate-900 hover:bg-black text-white font-black rounded-xl px-6 shadow-lg shadow-slate-200"
                                            onClick={() => handleServeRequest(request.id)}
                                            disabled={!!actionLoading}
                                        >
                                            {actionLoading === request.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                            Confirmer Livraison
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Articles demandés</Label>
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {request.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                            <div className="h-10 w-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 overflow-hidden border border-slate-100">
                                                {item.photoUrl ? (
                                                    <img src={item.photoUrl} alt="" crossOrigin="anonymous" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Package className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-slate-800 truncate">{item.supplyName}</p>
                                                <p className="text-[10px] font-black text-blue-600">Quantité: {item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Rejection Dialog */}
            <Dialog open={!!rejectionRequestId} onOpenChange={(open) => !open && setRejectionRequestId(null)}>
                <DialogContent className="rounded-2xl sm:max-w-md border-none shadow-2xl overflow-hidden p-0">
                    <div className="bg-red-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-black flex items-center gap-3">
                                <AlertCircle className="h-6 w-6" />
                                Rejeter la demande
                            </DialogTitle>
                            <DialogDescription className="text-red-100">
                                Veuillez indiquer le motif du refus pour informer l'employé.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Motif du rejet</Label>
                            <Textarea 
                                placeholder="Ex: Stock réservé pour urgence, Quantité excessive..." 
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                className="min-h-[100px] rounded-xl border-slate-200 focus:ring-red-500"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100">
                        <Button variant="ghost" onClick={() => setRejectionRequestId(null)} className="rounded-xl font-bold">Annuler</Button>
                        <Button 
                            variant="destructive" 
                            disabled={!rejectionReason.trim() || actionLoading === rejectionRequestId}
                            onClick={handleReject}
                            className="bg-red-600 hover:bg-red-700 rounded-xl px-8 font-black shadow-lg shadow-red-100"
                        >
                            {actionLoading === rejectionRequestId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Confirmer Rejet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
