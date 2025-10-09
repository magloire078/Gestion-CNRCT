
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getConflict, updateConflict } from "@/services/conflict-service";
import { getEmployees } from "@/services/employee-service";
import type { Conflict, Employe, ConflictType } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const conflictTypes: ConflictType[] = ["Foncier", "Succession", "Intercommunautaire", "Politique", "Autre"];
const conflictStatuses: Conflict['status'][] = ["En cours", "Résolu", "En médiation"];

export default function ConflictEditPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const { toast } = useToast();

    const [conflict, setConflict] = useState<Partial<Conflict> | null>(null);
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        
        async function fetchConflictData() {
            try {
                const [conflictData, employeesData] = await Promise.all([
                    getConflict(id),
                    getEmployees()
                ]);

                if (!conflictData) {
                    toast({ variant: "destructive", title: "Erreur", description: "Conflit non trouvé." });
                    router.push('/conflicts');
                    return;
                }
                
                setConflict(conflictData);
                setEmployees(employeesData.filter(e => e.status === 'Actif'));

            } catch (error) {
                console.error("Failed to fetch data", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données du conflit." });
            } finally {
                setLoading(false);
            }
        }
        fetchConflictData();
    }, [id, toast, router]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setConflict(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSelectChange = (name: keyof Conflict, value: string) => {
        setConflict(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSave = async () => {
        if (!conflict || !id) return;
        setIsSaving(true);
        
        try {
            await updateConflict(id, conflict);
            toast({ title: "Succès", description: "Les informations du conflit ont été mises à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save conflict", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-xl mx-auto flex flex-col gap-6">
                <Skeleton className="h-10 w-48" />
                <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (!conflict) {
        return <div className="text-center py-10">Conflit non trouvé.</div>;
    }

    return (
         <div className="max-w-xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier le Conflit</h1>
                    <p className="text-muted-foreground">{conflict.village}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader><CardTitle>Détails du Conflit</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label>Village / Localité</Label>
                        <Input value={conflict.village || ''} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Type de Conflit</Label>
                         <Select value={conflict.type} onValueChange={(v: ConflictType) => handleSelectChange('type', v)}>
                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {conflictTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" value={conflict.description || ''} onChange={handleInputChange} rows={5}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="status">Statut</Label>
                        <Select value={conflict.status} onValueChange={(v: Conflict['status']) => handleSelectChange('status', v)}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {conflictStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="mediatorName">Médiateur / Gestionnaire</Label>
                        <Select value={conflict.mediatorName || ''} onValueChange={(v) => handleSelectChange('mediatorName', v)}>
                            <SelectTrigger id="mediatorName"><SelectValue placeholder="Non assigné"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Non assigné</SelectItem>
                                {employees.map(e => <SelectItem key={e.id} value={e.name}>{e.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
