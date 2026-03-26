
"use client";

import { useState, useEffect } from "react";
import type { Conflict, Employe, ConflictType } from "@/lib/data";
import { conflictTypes, conflictStatuses } from "@/lib/data";
import { getEmployees } from "@/services/employee-service";
import { IVORIAN_REGIONS } from "@/constants/regions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, History, User, MessageSquarePlus } from "lucide-react";
import { LocationPicker } from "@/components/common/location-picker";
import { Switch } from "@/components/ui/switch";
import { auth } from "@/lib/firebase";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

interface EditConflictSheetProps {
    isOpen: boolean;
    onCloseAction: () => void;
    onUpdateConflictAction: (id: string, data: Partial<Omit<Conflict, 'id'>>) => Promise<void>;
    conflict: Conflict | null;
    availableTypes?: readonly string[];
}

export function EditConflictSheet({ isOpen, onCloseAction, onUpdateConflictAction, conflict, availableTypes = conflictTypes }: EditConflictSheetProps) {
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<Conflict>>({});
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { hasPermission } = useAuth();
    const canAssignMediator = hasPermission('page:conflicts:view') || hasPermission('group:personnel:view');

    useEffect(() => {
        async function fetchEmployees() {
            if (!canAssignMediator) return;
            try {
                const employeesData = await getEmployees();
                setEmployees(employeesData.filter(e => e.status === 'Actif'));
            } catch (error) {
                console.error("Failed to fetch employees", error);
                // Non-blocking error for UI
            }
        }

        if (isOpen) {
            setLoading(true);
            if (conflict) {
                setFormData(conflict);
            }
            fetchEmployees().finally(() => setLoading(false));
        }
    }, [conflict, isOpen, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: keyof Conflict, value: string) => {
        const finalValue = value === 'none' ? undefined : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!conflict) return;

        if (!formData.village || !formData.type || !formData.description) {
            setError("Le village, le type et la description sont obligatoires.");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await onUpdateConflictAction(conflict.id, formData);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Une erreur est survenue.");
            console.error("Failed to save conflict", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!conflict) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onCloseAction}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <DialogTitle className="text-2xl">Modifier le Conflit</DialogTitle>
                            {conflict.trackingId && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-black tracking-tighter">
                                    {conflict.trackingId}
                                </Badge>
                            )}
                        </div>
                        <DialogDescription>Mettez à jour les détails du conflit à <span className="font-semibold text-primary">{conflict.village}</span>.</DialogDescription>
                    </DialogHeader>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Chargement des détails...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6">
                            {/* Colonne Gauche */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Village / Localité</Label>
                                    <Input value={formData.village || ''} disabled className="bg-slate-50 font-semibold" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Typologie du Conflit</Label>
                                    <Select value={formData.type || ''} onValueChange={(v) => handleSelectChange('type', v)}>
                                        <SelectTrigger id="type"><SelectValue placeholder="Sélectionnez une typologie..." /></SelectTrigger>
                                        <SelectContent>
                                            {availableTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Statut actuel</Label>
                                    <Select value={formData.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                                        <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {conflictStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                 </div>
                                 <div className="space-y-2">
                                     <Label htmlFor="incidentDate">Date de l'incident</Label>
                                     <Input 
                                         id="incidentDate" 
                                         name="incidentDate"
                                         type="date" 
                                         value={formData.incidentDate || ''} 
                                         onChange={handleInputChange} 
                                     />
                                 </div>
                                 <div className="space-y-2">
                                     <Label htmlFor="reportedDate">Date du signalement</Label>
                                     <Input 
                                         id="reportedDate" 
                                         name="reportedDate"
                                         type="date" 
                                         value={formData.reportedDate || ''} 
                                         onChange={handleInputChange} 
                                     />
                                 </div>
                                <div className="space-y-2">
                                    <Label htmlFor="district">District</Label>
                                    <Input 
                                        id="district" 
                                        name="district"
                                        value={formData.district || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Ex: District Autonome d'Abidjan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="region">Région</Label>
                                    <Select value={formData.region || ''} onValueChange={(v) => handleSelectChange('region', v)}>
                                        <SelectTrigger id="region">
                                            <SelectValue placeholder="Sélectionnez une région..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {IVORIAN_REGIONS.map(r => (
                                                <SelectItem key={r} value={r}>{r}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Colonne Droite */}
                            <div className="space-y-4">
                                {canAssignMediator && (
                                    <div className="space-y-2">
                                        <Label htmlFor="mediatorName">Médiateur / Responsable assigné</Label>
                                        <Select value={formData.mediatorName || 'none'} onValueChange={(v) => handleSelectChange('mediatorName', v)}>
                                            <SelectTrigger id="mediatorName"><SelectValue placeholder="Non assigné" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Non assigné</SelectItem>
                                                {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="parties">Parties impliquées</Label>
                                    <Input 
                                        id="parties" 
                                        name="parties"
                                        value={formData.parties || ''} 
                                        onChange={handleInputChange} 
                                        placeholder="Ex: Famille A vs Famille B"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Résumé des faits</Label>
                                    <Textarea 
                                        id="description" 
                                        name="description" 
                                        value={formData.description || ''} 
                                        onChange={handleInputChange} 
                                        rows={3} 
                                        className="resize-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="impact">Impact / Suites du conflit</Label>
                                     <Textarea 
                                         id="impact" 
                                         name="impact" 
                                         value={formData.impact || ''} 
                                         onChange={handleInputChange} 
                                         rows={3} 
                                         className="resize-none"
                                     />
                                 </div>
                                 <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-bold">Anonymat du plaignant</Label>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Standard MGP : Confidentialité</p>
                                    </div>
                                    <Switch 
                                        checked={formData.isAnonymous || false}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: checked }))}
                                    />
                                 </div>
                             </div>

                             {/* Resolution Section - Conditional */}
                             {formData.status === 'Résolu' && (
                                <div className="md:col-span-2 p-6 rounded-2xl bg-green-50/50 border border-green-100 space-y-4">
                                    <h3 className="text-lg font-bold text-green-900">Détails de la Résolution</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="resolutionDate">Date de clôture</Label>
                                            <Input 
                                                id="resolutionDate" 
                                                name="resolutionDate" 
                                                type="date" 
                                                value={formData.resolutionDate || ''} 
                                                onChange={handleInputChange} 
                                            />
                                        </div>
                                        <div className="md:col-span-2 space-y-2">
                                            <Label htmlFor="resolutionDetails">Synthèse de la résolution</Label>
                                            <Textarea 
                                                id="resolutionDetails" 
                                                name="resolutionDetails" 
                                                value={formData.resolutionDetails || ''} 
                                                onChange={handleInputChange} 
                                                rows={4}
                                                placeholder="Décrivez comment le conflit a été résolu, les accords conclus..."
                                            />
                                        </div>
                                    </div>
                                </div>
                             )}

                            <div className="md:col-span-2 pt-4 border-t border-primary/5 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-bold flex items-center gap-2">
                                        <History className="h-5 w-5 text-slate-400" /> Journal des Étapes (Timeline)
                                    </Label>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold font-black">
                                        Standard MGP : Suivi Chronologique des Médiations
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Comments List */}
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                                        {formData.comments && formData.comments.length > 0 ? (
                                            formData.comments.map((comment, i) => (
                                                <div key={comment.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                                                    <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                                                        <User className="h-5 w-5 text-slate-400" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-bold text-sm">{comment.author}</span>
                                                            <span className="text-[10px] text-slate-400">{new Date(comment.date).toLocaleDateString()} à {new Date(comment.date).toLocaleTimeString()}</span>
                                                        </div>
                                                        <p className="text-sm text-slate-600 leading-relaxed">{comment.content}</p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                                <p className="text-sm text-slate-400">Aucune étape enregistrée pour le moment.</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Add Comment Input */}
                                    <div className="p-6 rounded-[2rem] bg-slate-900 text-white space-y-4">
                                        <div className="flex items-center gap-2">
                                            <MessageSquarePlus className="h-5 w-5 text-blue-400" />
                                            <span className="font-bold">Ajouter une observation</span>
                                        </div>
                                        <div className="space-y-3">
                                            <Textarea 
                                                id="newComment" 
                                                placeholder="Décrivez l'avancée de la médiation, les points bloquants..."
                                                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 rounded-xl resize-none"
                                                rows={2}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && !e.shiftKey) {
                                                        e.preventDefault();
                                                        const content = e.currentTarget.value.trim();
                                                        if (content) {
                                                            const newComment = {
                                                                id: Math.random().toString(36).substr(2, 9),
                                                                date: new Date().toISOString(),
                                                                author: auth.currentUser?.displayName || auth.currentUser?.email || "Utilisateur",
                                                                content
                                                            };
                                                            setFormData(prev => ({ 
                                                                ...prev, 
                                                                comments: [...(prev.comments || []), newComment]
                                                            }));
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <p className="text-[9px] text-slate-400 italic">Appuyez sur Entrée pour enregistrer l'observation.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator className="md:col-span-2 my-2" />

                            {/* Section Localisation - Pleine largeur */}
                            <div className="md:col-span-2 pt-4 space-y-4">
                                <div className="space-y-1">
                                    <Label className="text-base font-bold">Localisation Géographique</Label>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Précision requise pour analyse IA et SIG</div>
                                </div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                    <div className="lg:col-span-2">
                                        <LocationPicker 
                                            onLocationSelectAction={(lat, lng) => {
                                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
                                            }}
                                            initialLat={formData.latitude}
                                            initialLng={formData.longitude}
                                            className="border shadow-sm rounded-2xl bg-slate-50/50"
                                        />
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="latitude" className="text-xs font-bold uppercase text-muted-foreground">Latitude</Label>
                                                <Input 
                                                    id="latitude" 
                                                    type="number" 
                                                    step="any" 
                                                    value={formData.latitude || ''} 
                                                    onChange={handleInputChange}
                                                    name="latitude"
                                                    placeholder="0.000000"
                                                    className="bg-white border-primary/10 focus-visible:ring-primary/20"
                                                />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="longitude" className="text-xs font-bold uppercase text-muted-foreground">Longitude</Label>
                                                <Input 
                                                    id="longitude" 
                                                    type="number" 
                                                    step="any" 
                                                    value={formData.longitude || ''} 
                                                    onChange={handleInputChange}
                                                    name="longitude"
                                                    placeholder="0.000000"
                                                    className="bg-white border-primary/10 focus-visible:ring-primary/20"
                                                />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                                            Déplacez le marqueur sur la carte pour affiner la position précise du conflit.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 mb-4 rounded-lg bg-destructive/5 border border-destructive/10 text-center text-sm text-destructive font-medium">
                            {error}
                        </div>
                    )}

                    <DialogFooter className="gap-2 pt-2 border-t border-primary/5">
                        <DialogClose asChild>
                            <Button type="button" variant="ghost">Annuler</Button>
                        </DialogClose>
                        <Button type="submit" className="min-w-[150px]" disabled={isSaving || loading}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer les modifications
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
