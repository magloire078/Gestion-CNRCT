"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { Mail as MailType } from "@/lib/data";

interface MailStatsCardsProps {
    mails: MailType[];
}

export function MailStatsCards({ mails }: MailStatsCardsProps) {
    const stats = useMemo(() => {
        const total = mails.length;
        const nouveaux = mails.filter(m => m.status === 'Nouveau' || !m.status).length;
        const enCours = mails.filter(m => m.status === 'En cours').length;
        const traites = mails.filter(m => m.status === 'Traité').length;
        const classes = mails.filter(m => m.status === 'Classé').length;
        
        const activeTreatment = nouveaux + enCours;
        const completed = traites + classes;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        // Count urgent pending mails
        const urgentPending = mails.filter(m => 
            m.priority === 'Urgente' && 
            m.status !== 'Traité' && 
            m.status !== 'Classé'
        ).length;

        return { total, nouveaux, enCours, activeTreatment, completionRate, urgentPending, completed };
    }, [mails]);

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Card 1: Total register */}
            <Card className="border-none shadow-xl shadow-blue-500/5 bg-gradient-to-br from-blue-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Mail className="h-16 w-16 -mr-4 -mt-4 text-blue-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        Flux Global
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.total}</div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        Courriers Enregistrés
                    </p>
                </CardContent>
            </Card>

            {/* Card 2: Active processing */}
            <Card className="border-none shadow-xl shadow-amber-500/5 bg-gradient-to-br from-amber-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Clock className="h-16 w-16 -mr-4 -mt-4 text-amber-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Traitement Actif
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.activeTreatment}</div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200/50">
                            {stats.nouveaux} Nouveaux
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200/50">
                            {stats.enCours} En cours
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Urgents non traités */}
            <Card className="border-none shadow-xl shadow-rose-500/5 bg-gradient-to-br from-rose-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <AlertTriangle className="h-16 w-16 -mr-4 -mt-4 text-rose-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        Urgences à Traiter
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.urgentPending}</div>
                    <p className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-widest">
                        Courriers Urgents en attente
                    </p>
                </CardContent>
            </Card>

            {/* Card 4: Completion rate */}
            <Card className="border-none shadow-xl shadow-emerald-500/5 bg-gradient-to-br from-emerald-50/50 to-white relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle2 className="h-16 w-16 -mr-4 -mt-4 text-emerald-600" />
                </div>
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Taux d'Efficacité
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-black text-slate-900 tracking-tighter tabular-nums">{stats.completionRate}<span className="text-lg ml-0.5 opacity-40">%</span></div>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        {stats.completed} Courriers traités ou classés
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
