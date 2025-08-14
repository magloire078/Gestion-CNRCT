
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvaluation, updateEvaluation } from "@/services/evaluation-service";
import type { Evaluation } from "@/lib/data";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, User, Star, Briefcase, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

export default function EvaluationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchEvaluation() {
            try {
                const data = await getEvaluation(id);
                setEvaluation(data);
            } catch (error) {
                console.error("Failed to fetch evaluation", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de l'évaluation." });
            } finally {
                setLoading(false);
            }
        }
        fetchEvaluation();
    }, [id, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEvaluation(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleSave = async () => {
        if (!evaluation || typeof id !== 'string') return;
        setIsSaving(true);
        try {
            // We only pass the fields that can be updated from this form
            const { strengths, areasForImprovement, managerComments } = evaluation;
            await updateEvaluation(id, { strengths, areasForImprovement, managerComments });
            toast({ title: "Succès", description: "L'évaluation a été mise à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save evaluation", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return <EvaluationDetailSkeleton />;
    }

    if (!evaluation) {
        return <div className="text-center py-10">Évaluation non trouvée.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Détails de l'Évaluation</h1>
                    <p className="text-muted-foreground">Période : {evaluation.reviewPeriod}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <Label>Employé</Label>
                        <p className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> {evaluation.employeeName}</p>
                    </div>
                     <div className="space-y-1">
                        <Label>Manager</Label>
                        <p className="font-medium flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/> {evaluation.managerName}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Évaluation des Compétences</CardTitle>
                    <CardDescription>Notez l'employé sur les compétences clés.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Placeholder for skills rating */}
                    <div className="text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg">
                        <p>La notation des compétences sera bientôt disponible ici.</p>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Commentaires Généraux</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="strengths">Points Forts</Label>
                        <Textarea id="strengths" name="strengths" value={evaluation.strengths} onChange={handleInputChange} rows={5} placeholder="Décrire les points forts de l'employé..."/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="areasForImprovement">Axes d'Amélioration</Label>
                        <Textarea id="areasForImprovement" name="areasForImprovement" value={evaluation.areasForImprovement} onChange={handleInputChange} rows={5} placeholder="Identifier les domaines à améliorer..."/>
                    </div>
                     <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="managerComments">Commentaires du Manager</Label>
                        <Textarea id="managerComments" name="managerComments" value={evaluation.managerComments} onChange={handleInputChange} rows={5} placeholder="Ajouter des commentaires généraux..."/>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


function EvaluationDetailSkeleton() {
    return (
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Skeleton className="h-10 w-10" />
                 <div className="space-y-2">
                    <Skeleton className="h-6 w-56" />
                    <Skeleton className="h-4 w-32" />
                 </div>
                 <Skeleton className="h-10 w-28 ml-auto" />
            </div>
            
            <Card>
                <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>

             <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full md:col-span-2" />
                </CardContent>
            </Card>
        </div>
    )
}
