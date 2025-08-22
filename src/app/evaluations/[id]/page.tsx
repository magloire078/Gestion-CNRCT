

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvaluation, updateEvaluation } from "@/services/evaluation-service";
import type { Evaluation, Goal } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, User, Star, Briefcase, PlusCircle, Trash2, Shield, Circle, CheckCircle, Goal as GoalIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';


const competencyList = [
    { id: 'communication', label: 'Communication' },
    { id: 'teamwork', label: 'Travail d\'équipe' },
    { id: 'problemSolving', label: 'Résolution de problèmes' },
    { id: 'qualityOfWork', label: 'Qualité du travail' },
    { id: 'initiative', label: 'Initiative et Autonomie' },
    { id: 'technicalSkills', label: 'Compétences Techniques' },
];

const goalStatuses: Goal['status'][] = ['Not Started', 'In Progress', 'Completed'];

const statusIcons: Record<Goal['status'], React.ElementType> = {
    'Not Started': Shield,
    'In Progress': Circle,
    'Completed': CheckCircle,
};

function StarRating({ rating, onRate, disabled }: { rating: number, onRate: (rating: number) => void, disabled?: boolean }) {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-6 w-6 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                    onClick={() => !disabled && onRate(star)}
                />
            ))}
        </div>
    );
}

export default function EvaluationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();
    const { user } = useAuth();

    const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchEvaluation() {
            try {
                const data = await getEvaluation(id);
                if (data && data.goals) {
                    data.goals = data.goals.map(g => ({ ...g, id: g.id || uuidv4() }));
                } else if (data) {
                    data.goals = [];
                }
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
    
    const isManager = user?.id === evaluation?.managerId;
    const isEmployee = user?.id === evaluation?.employeeId;
    const isCompleted = evaluation?.status === 'Completed';
    
    const canEditManagerFields = isManager && !isCompleted;
    const canEditEmployeeFields = isEmployee && evaluation?.status === 'Pending Employee Sign-off';
    const canSave = canEditManagerFields || canEditEmployeeFields;


    const handleRatingChange = (skillId: string, rating: number) => {
        setEvaluation(prev => {
            if (!prev) return null;
            const newScores = { ...prev.scores, [skillId]: rating };
            return { ...prev, scores: newScores };
        })
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>, field: 'managerComments' | 'employeeComments' | 'strengths' | 'areasForImprovement') => {
        setEvaluation(prev => prev ? { ...prev, [field]: e.target.value } : null);
    };

    const handleGoalChange = (goalId: string, field: 'title' | 'description' | 'status', value: string) => {
        setEvaluation(prev => {
            if (!prev) return null;
            const newGoals = prev.goals.map(g => g.id === goalId ? { ...g, [field]: value } : g);
            return { ...prev, goals: newGoals };
        });
    };

    const addGoal = () => {
        setEvaluation(prev => {
            if (!prev) return null;
            const newGoal: Goal = {
                id: uuidv4(),
                title: '',
                description: '',
                status: 'Not Started'
            };
            return { ...prev, goals: [...(prev.goals || []), newGoal] };
        });
    };
    
    const removeGoal = (goalId: string) => {
        setEvaluation(prev => {
            if (!prev) return null;
            const newGoals = prev.goals.filter(g => g.id !== goalId);
            return { ...prev, goals: newGoals };
        });
    };

    const handleSave = async () => {
        if (!evaluation || typeof id !== 'string') return;
        setIsSaving(true);
        try {
            const { strengths, areasForImprovement, managerComments, employeeComments, scores, goals, status } = evaluation;
            await updateEvaluation(id, { strengths, areasForImprovement, managerComments, employeeComments, scores, goals, status });
            toast({ title: "Succès", description: "L'évaluation a été mise à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save evaluation", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleStatusChange = (status: Evaluation['status']) => {
        setEvaluation(prev => prev ? { ...prev, status } : null);
    }

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
                 <Button onClick={handleSave} disabled={isSaving || !canSave} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1">
                        <Label>Employé</Label>
                        <p className="font-medium flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/> {evaluation.employeeName}</p>
                    </div>
                     <div className="space-y-1">
                        <Label>Manager</Label>
                        <p className="font-medium flex items-center gap-2"><Briefcase className="h-4 w-4 text-muted-foreground"/> {evaluation.managerName}</p>
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="status">Statut de l'évaluation</Label>
                        <Select value={evaluation.status} onValueChange={handleStatusChange} disabled={!canEditManagerFields}>
                            <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Draft">Brouillon</SelectItem>
                                <SelectItem value="Pending Manager Review">En attente (Manager)</SelectItem>
                                <SelectItem value="Pending Employee Sign-off">En attente (Employé)</SelectItem>
                                <SelectItem value="Completed">Complétée</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Évaluation des Compétences</CardTitle>
                    <CardDescription>Notez l'employé sur les compétences clés de 1 à 5.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {competencyList.map(skill => (
                        <div key={skill.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-md">
                           <p className="font-medium mb-2 sm:mb-0">{skill.label}</p>
                           <StarRating 
                             rating={evaluation.scores?.[skill.id] || 0}
                             onRate={(rating) => handleRatingChange(skill.id, rating)}
                             disabled={!canEditManagerFields}
                           />
                        </div>
                    ))}
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Commentaires Généraux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="strengths">Points Forts</Label>
                        <Textarea id="strengths" value={evaluation.strengths} onChange={(e) => handleCommentChange(e, 'strengths')} rows={4} placeholder="Décrire les points forts de l'employé..." disabled={!canEditManagerFields}/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="areasForImprovement">Axes d'Amélioration</Label>
                        <Textarea id="areasForImprovement" value={evaluation.areasForImprovement} onChange={(e) => handleCommentChange(e, 'areasForImprovement')} rows={4} placeholder="Identifier les domaines à améliorer..." disabled={!canEditManagerFields}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="managerComments">Commentaires du Manager</Label>
                        <Textarea id="managerComments" value={evaluation.managerComments} onChange={(e) => handleCommentChange(e, 'managerComments')} rows={4} placeholder="Ajouter des commentaires généraux..." disabled={!canEditManagerFields}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="employeeComments">Commentaires de l'Employé</Label>
                        <Textarea id="employeeComments" value={evaluation.employeeComments || ''} onChange={(e) => handleCommentChange(e, 'employeeComments')} rows={4} placeholder="L'employé peut ajouter ses commentaires ici..." disabled={!canEditEmployeeFields}/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="flex items-center gap-2"><GoalIcon className="h-5 w-5 text-primary"/> Objectifs</CardTitle>
                            <CardDescription>Définissez et suivez les objectifs pour cette période d'évaluation.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={addGoal} disabled={!canEditManagerFields}><PlusCircle className="mr-2 h-4 w-4"/> Ajouter</Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {evaluation.goals?.length > 0 ? evaluation.goals.map((goal) => {
                        const StatusIcon = statusIcons[goal.status];
                        return(
                             <div key={goal.id} className="p-4 border rounded-lg space-y-3">
                                <div className="flex justify-between items-start gap-2">
                                     <div className="flex-1 space-y-1">
                                        <Label htmlFor={`goal-title-${goal.id}`}>Titre de l'objectif</Label>
                                        <Input id={`goal-title-${goal.id}`} value={goal.title} onChange={(e) => handleGoalChange(goal.id, 'title', e.target.value)} placeholder="Titre de l'objectif" disabled={!canEditManagerFields}/>
                                    </div>
                                    <div className="space-y-1 w-[180px]">
                                        <Label htmlFor={`goal-status-${goal.id}`}>Statut</Label>
                                        <Select value={goal.status} onValueChange={(value: Goal['status']) => handleGoalChange(goal.id, 'status', value)} disabled={!canEditManagerFields}>
                                            <SelectTrigger id={`goal-status-${goal.id}`} className="w-full">
                                                <div className="flex items-center gap-2">
                                                    <StatusIcon className="h-4 w-4" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {goalStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`goal-desc-${goal.id}`}>Description</Label>
                                    <Textarea id={`goal-desc-${goal.id}`} value={goal.description} onChange={(e) => handleGoalChange(goal.id, 'description', e.target.value)} placeholder="Description..." rows={2} disabled={!canEditManagerFields}/>
                                </div>
                                <div className="text-right">
                                    <Button variant="destructive" size="sm" onClick={() => removeGoal(goal.id)} disabled={!canEditManagerFields}>
                                        <Trash2 className="mr-2 h-4 w-4"/>
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucun objectif défini. Cliquez sur "Ajouter" pour commencer.</p>
                    )}
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
