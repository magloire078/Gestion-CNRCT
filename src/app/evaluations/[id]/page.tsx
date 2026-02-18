
"use client";

import React, { useState, useEffect, Fragment } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEvaluation, updateEvaluation } from "@/services/evaluation-service";
import type { Evaluation, Goal } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Save, User, Star, Briefcase, PlusCircle, Trash2, Shield, Circle, CheckCircle, Goal as GoalIcon, Send, Check, ChevronLeft, ChevronRight, Info, Award, MessageSquare, Target, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from 'uuid';
import { Badge } from "@/components/ui/badge";

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
    'In Progress': Loader2,
    'Completed': CheckCircle,
};

const statusVariantMap: Record<Evaluation['status'], "secondary" | "default" | "outline" | "destructive" | "success"> = {
    'Draft': 'secondary',
    'Pending Manager Review': 'default',
    'Pending Employee Sign-off': 'outline',
    'Completed': 'success',
};

const STEPS = [
    { id: 'info', label: 'Infos', icon: Info },
    { id: 'skills', label: 'Compétences', icon: Award },
    { id: 'analysis', label: 'Analyse', icon: MessageSquare },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'finalize', label: 'Finalisation', icon: ClipboardCheck },
];

function StarRating({ rating, onRate, disabled }: { rating: number, onRate: (rating: number) => void, disabled?: boolean }) {
    return (
        <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    className={`h-6 w-6 ${disabled ? 'cursor-not-allowed text-gray-300' : 'cursor-pointer'} ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
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
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchEvaluation() {
            try {
                const data = await getEvaluation(id as string);
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

    const canEditManagerFields = isManager && evaluation?.status !== 'Pending Employee Sign-off' && !isCompleted;
    const canEditEmployeeFields = isEmployee && evaluation?.status === 'Pending Employee Sign-off';


    const handleRatingChange = (skillId: string, rating: number) => {
        if (!canEditManagerFields) return;
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
        if (!canEditManagerFields) return;
        setEvaluation(prev => {
            if (!prev) return null;
            const newGoals = prev.goals.map(g => g.id === goalId ? { ...g, [field]: value } : g);
            return { ...prev, goals: newGoals };
        });
    };

    const addGoal = () => {
        if (!canEditManagerFields) return;
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
        if (!canEditManagerFields) return;
        setEvaluation(prev => {
            if (!prev) return null;
            const newGoals = prev.goals.filter(g => g.id !== goalId);
            return { ...prev, goals: newGoals };
        });
    };

    const handleSave = async (newStatus?: Evaluation['status']) => {
        if (!evaluation || typeof id !== 'string') return;
        setIsSaving(true);
        try {
            const { strengths, areasForImprovement, managerComments, employeeComments, scores, goals, status } = evaluation;
            const dataToSave: Partial<Evaluation> = { strengths, areasForImprovement, managerComments, employeeComments, scores, goals, status: newStatus || status };

            await updateEvaluation(id, dataToSave);

            if (newStatus) {
                setEvaluation(prev => prev ? { ...prev, status: newStatus } : null);
            }

            toast({ title: "Succès", description: "L'évaluation a été mise à jour." });

            if (newStatus === 'Completed') {
                router.back();
            }

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
        <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4 md:p-6 lg:p-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Détails de l'Évaluation</h1>
                    <p className="text-muted-foreground">Période : {evaluation.reviewPeriod}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    {canEditManagerFields && (
                        <Button onClick={() => handleSave()} disabled={isSaving} variant="default">
                            <Save className="mr-2 h-4 w-4" />
                            Sauvegarder
                        </Button>
                    )}
                    <Badge variant={statusVariantMap[evaluation.status] || 'default'}>{evaluation.status}</Badge>
                </div>
            </div>

            {/* Stepper Header */}
            <div className="flex items-center justify-between px-2 bg-card border rounded-lg p-2 overflow-x-auto no-scrollbar">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === index;
                    const isPassed = currentStep > index;
                    return (
                        <Fragment key={step.id}>
                            <button
                                onClick={() => setCurrentStep(index)}
                                className={`flex flex-col items-center gap-2 px-4 py-2 rounded-md transition-all min-w-[80px] ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                            >
                                <div className={`relative flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all ${isActive ? 'border-primary bg-primary text-primary-foreground' : isPassed ? 'border-primary bg-primary/20 text-primary' : 'border-muted bg-background'}`}>
                                    {isPassed ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                    {isActive && <div className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-primary" />}
                                </div>
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isActive ? 'text-primary' : ''}`}>
                                    {step.label}
                                </span>
                            </button>
                            {index < STEPS.length - 1 && (
                                <div className={`flex-1 h-px max-w-[40px] hidden sm:block ${isPassed ? 'bg-primary' : 'bg-muted'}`} />
                            )}
                        </Fragment>
                    );
                })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
                {currentStep === 0 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Info className="h-5 w-5" /> Informations</CardTitle>
                            <CardDescription>Détails contextuels de l'évaluation.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-lg bg-muted/30 border border-muted space-y-3">
                                <Label className="text-xs uppercase text-muted-foreground font-bold italic">Employé</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{evaluation.employeeName}</p>
                                        <p className="text-xs text-muted-foreground">ID: {evaluation.employeeId}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 rounded-lg bg-muted/30 border border-muted space-y-3">
                                <Label className="text-xs uppercase text-muted-foreground font-bold italic">Manager</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <Briefcase className="h-6 w-6 text-secondary-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-lg">{evaluation.managerName}</p>
                                        <p className="text-xs text-muted-foreground">ID: {evaluation.managerId}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="md:col-span-2 p-4 rounded-lg bg-blue-50/10 border border-blue-200/20">
                                <p className="text-sm italic">Cette évaluation couvre la période du <strong>{evaluation.reviewPeriod}</strong>. Le statut actuel est <Badge variant="outline">{evaluation.status}</Badge>.</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 1 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" /> Évaluation des Compétences</CardTitle>
                            <CardDescription>Évaluez les compétences clés. Les notes vont de 1 (Débutant) à 5 (Expert).</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {competencyList.map(skill => (
                                <div key={skill.id} className="flex justify-between items-center p-4 border rounded-lg bg-card hover:bg-muted/10 transition-colors">
                                    <span className="font-medium">{skill.label}</span>
                                    <StarRating
                                        rating={evaluation.scores?.[skill.id] || 0}
                                        onRate={(rating) => handleRatingChange(skill.id, rating)}
                                        disabled={!canEditManagerFields}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {currentStep === 2 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Analyse Qualitative</CardTitle>
                            <CardDescription>Commentaires détaillés du manager sur le travail effectué.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="strengths" className="text-primary font-bold">Points Forts</Label>
                                    <Textarea id="strengths" value={evaluation.strengths} onChange={(e) => handleCommentChange(e, 'strengths')} rows={6} className="bg-green-50/5 border-green-200/20 focus:ring-green-500" placeholder="Quels sont les succès majeurs ?" disabled={!canEditManagerFields} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="areasForImprovement" className="text-red-400 font-bold">Axes d'Amélioration</Label>
                                    <Textarea id="areasForImprovement" value={evaluation.areasForImprovement} onChange={(e) => handleCommentChange(e, 'areasForImprovement')} rows={6} className="bg-red-50/5 border-red-200/20 focus:ring-red-500" placeholder="Quels sont les domaines à renforcer ?" disabled={!canEditManagerFields} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="managerComments" className="font-bold border-l-4 border-primary pl-2">Commentaires de Synthèse</Label>
                                <Textarea id="managerComments" value={evaluation.managerComments} onChange={(e) => handleCommentChange(e, 'managerComments')} rows={4} placeholder="Conclusions générales de l'évaluation..." disabled={!canEditManagerFields} />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {currentStep === 3 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Objectifs de Performance</CardTitle>
                                    <CardDescription>Définissez les objectifs pour la prochaine période.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={addGoal} disabled={!canEditManagerFields} className="hover:bg-primary hover:text-primary-foreground"><PlusCircle className="mr-2 h-4 w-4" /> Ajouter un objectif</Button>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {evaluation.goals?.length > 0 ? evaluation.goals.map((goal) => {
                                const StatusIcon = statusIcons[goal.status];
                                return (
                                    <div key={goal.id} className="p-5 border rounded-xl bg-muted/10 space-y-4 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                            <div className="flex-1 space-y-2 w-full">
                                                <Label htmlFor={`goal-title-${goal.id}`} className="text-xs uppercase font-bold text-muted-foreground">Titre de l'objectif</Label>
                                                <Input id={`goal-title-${goal.id}`} value={goal.title} onChange={(e) => handleGoalChange(goal.id, 'title', e.target.value)} placeholder="Ex: Maîtriser le nouveau dashboard" disabled={!canEditManagerFields} className="font-bold" />
                                            </div>
                                            <div className="space-y-2 w-full md:w-[200px]">
                                                <Label htmlFor={`goal-status-${goal.id}`} className="text-xs uppercase font-bold text-muted-foreground">Statut</Label>
                                                <Select value={goal.status} onValueChange={(value: Goal['status']) => handleGoalChange(goal.id, 'status', value)} disabled={!canEditManagerFields}>
                                                    <SelectTrigger id={`goal-status-${goal.id}`} className="w-full">
                                                        <div className="flex items-center gap-2">
                                                            <StatusIcon className={`h-4 w-4 ${goal.status === 'In Progress' ? 'animate-spin text-blue-500' : goal.status === 'Completed' ? 'text-green-500' : ''}`} />
                                                            <SelectValue />
                                                        </div>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {goalStatuses.map(s => {
                                                            const Icon = statusIcons[s];
                                                            return (
                                                                <SelectItem key={s} value={s}>
                                                                    <div className="flex items-center gap-2">
                                                                        <Icon className={`h-4 w-4 ${s === 'In Progress' ? 'animate-spin text-blue-500' : s === 'Completed' ? 'text-green-500' : ''}`} />
                                                                        {s}
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        })}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`goal-desc-${goal.id}`} className="text-xs uppercase font-bold text-muted-foreground">Description & Critères de réussite</Label>
                                            <Textarea id={`goal-desc-${goal.id}`} value={goal.description} onChange={(e) => handleGoalChange(goal.id, 'description', e.target.value)} placeholder="Détails sur ce qui est attendu..." rows={3} disabled={!canEditManagerFields} />
                                        </div>
                                        {canEditManagerFields && (
                                            <div className="flex justify-end">
                                                <Button variant="ghost" size="sm" onClick={() => removeGoal(goal.id)} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Retirer cet objectif
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )
                            }) : (
                                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/5">
                                    <Target className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                                    <p className="text-muted-foreground">Aucun objectif défini pour le moment.</p>
                                    <Button variant="link" onClick={addGoal} disabled={!canEditManagerFields} className="mt-2">Créer le premier objectif</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {currentStep === 4 && (
                    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Finalisation et Signature</CardTitle>
                            <CardDescription>Dernière étape avant la clôture de l'évaluation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <Label htmlFor="employeeComments" className="font-bold flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Commentaires de l'Employé
                                </Label>
                                <div className="relative">
                                    <Textarea id="employeeComments" value={evaluation.employeeComments || ''} onChange={(e) => handleCommentChange(e, 'employeeComments')} rows={6} placeholder="L'employé exprime ici son ressenti, ses besoins de formation, etc..." disabled={!canEditEmployeeFields} className={canEditEmployeeFields ? "ring-2 ring-primary/20" : ""} />
                                    {canEditEmployeeFields && (
                                        <div className="flex justify-end mt-4">
                                            <Button size="sm" onClick={() => handleSave()} disabled={isSaving} variant="secondary">
                                                <Save className="mr-2 h-4 w-4" /> Enregistrer mes commentaires
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {!canEditEmployeeFields && !evaluation.employeeComments && (
                                    <p className="text-sm italic text-muted-foreground px-2">L'employé n'a pas encore ajouté de commentaires.</p>
                                )}
                            </div>

                            <div className="pt-6 border-t space-y-4">
                                <h3 className="font-bold">Actions Finales</h3>
                                <div className="flex flex-wrap gap-4">
                                    {isManager && !isCompleted && (
                                        <>
                                            {evaluation.status === 'Draft' && (
                                                <Button onClick={() => handleSave('Pending Employee Sign-off')} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[200px]">
                                                    <Send className="mr-2 h-4 w-4" />
                                                    Soumettre à l'employé
                                                </Button>
                                            )}
                                            {evaluation.status === 'Pending Employee Sign-off' && (
                                                <Button onClick={() => handleSave('Completed')} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white min-w-[200px]">
                                                    <CheckCircle className="mr-2 h-4 w-4" />
                                                    Clôturer définitivement
                                                </Button>
                                            )}
                                        </>
                                    )}

                                    {isEmployee && evaluation.status === 'Pending Employee Sign-off' && (
                                        <div className="flex flex-col gap-3 w-full">
                                            <Button onClick={() => handleSave('Completed')} disabled={isSaving} className="bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg">
                                                <Check className="mr-2 h-5 w-5" />
                                                Accepter et Finaliser l'évaluation
                                            </Button>
                                            <p className="text-xs text-center text-muted-foreground italic">En cliquant ci-dessus, vous attestez avoir pris connaissance des éléments de cette évaluation.</p>
                                        </div>
                                    )}

                                    {isCompleted && (
                                        <div className="w-full p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-600">
                                            <CheckCircle className="h-6 w-6" />
                                            <p className="font-bold">Cette évaluation est finalisée et verrouillée.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center bg-card p-4 border rounded-lg shadow-sm">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Précédent
                </Button>
                <div className="flex items-center gap-1">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all ${currentStep === i ? 'w-4 bg-primary' : 'bg-muted'}`} />
                    ))}
                </div>
                {currentStep < STEPS.length - 1 ? (
                    <Button onClick={nextStep}>
                        Suivant <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <div />
                )}
            </div>
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
