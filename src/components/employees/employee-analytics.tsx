"use client";

import React, { useMemo } from "react";
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area
} from "recharts";
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from "@/components/ui/card";
import { 
    Users, 
    UserPlus, 
    History, 
    VenetianMask, 
    TrendingUp,
    Briefcase,
    Calendar,
    GraduationCap
} from "lucide-react";
import { Employe } from "@/lib/data";
import { differenceInYears, parseISO } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface EmployeeAnalyticsProps {
    employees: Employe[];
}

const COLORS = ["#0f172a", "#3b82f6", "#10b981", "#f59e0b", "#f43f5e"];
const GENDER_COLORS = {
    'Homme': '#0f172a',
    'Femme': '#3b82f6',
    'Autre': '#94a3b8'
};

export function EmployeeAnalytics({ employees }: EmployeeAnalyticsProps) {
    
    // 1. Age Distribution
    const ageData = useMemo(() => {
        const ranges = {
            '18-25': 0,
            '26-35': 0,
            '36-45': 0,
            '46-55': 0,
            '56-65': 0,
            '65+': 0
        };

        const now = new Date();
        employees.forEach(emp => {
            if (emp.Date_Naissance) {
                const age = differenceInYears(now, parseISO(emp.Date_Naissance));
                if (age <= 25) ranges['18-25']++;
                else if (age <= 35) ranges['26-35']++;
                else if (age <= 45) ranges['36-45']++;
                else if (age <= 55) ranges['46-55']++;
                else if (age <= 65) ranges['56-65']++;
                else ranges['65+']++;
            }
        });

        return Object.entries(ranges).map(([range, count]) => ({ range, count }));
    }, [employees]);

    // 2. Gender Distribution
    const genderData = useMemo(() => {
        const counts: Record<string, number> = {};
        employees.forEach(emp => {
            const sexe = emp.sexe || 'Autre';
            counts[sexe] = (counts[sexe] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [employees]);

    // 3. Seniority Distribution (Years of service)
    const seniorityData = useMemo(() => {
        const now = new Date();
        const seniorityCounts: Record<string, number> = {
            '< 2 ans': 0,
            '2-5 ans': 0,
            '5-10 ans': 0,
            '10-20 ans': 0,
            '20+ ans': 0
        };

        employees.forEach(emp => {
            if (emp.dateEmbauche) {
                const years = differenceInYears(now, parseISO(emp.dateEmbauche));
                if (years < 2) seniorityCounts['< 2 ans']++;
                else if (years <= 5) seniorityCounts['2-5 ans']++;
                else if (years <= 10) seniorityCounts['5-10 ans']++;
                else if (years <= 20) seniorityCounts['10-20 ans']++;
                else seniorityCounts['20+ ans']++;
            }
        });

        return Object.entries(seniorityCounts).map(([name, value]) => ({ name, value }));
    }, [employees]);

    // 4. Status Breakdown
    const statusData = useMemo(() => {
        const counts: Record<string, number> = {};
        employees.forEach(emp => {
            counts[emp.status] = (counts[emp.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [employees]);

    const activeCount = employees.filter(e => e.status === 'Actif').length;
    const leaveCount = employees.filter(e => e.status === 'En congé').length;

    return (
        <div className="space-y-10 animate-in fade-in duration-1000">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-none bg-slate-900 text-white rounded-[2.5rem] shadow-3xl shadow-slate-900/20 relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
                        <Users className="h-32 w-32" />
                    </div>
                    <CardHeader className="p-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Effectif Global</CardTitle>
                        <div className="flex items-end gap-3 mt-4">
                            <span className="text-6xl font-black tracking-tighter leading-none">{employees.length}</span>
                            <span className="text-[10px] font-black text-blue-400 mb-1 uppercase tracking-widest">Collaborateurs</span>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 relative overflow-hidden group">
                    <CardHeader className="p-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Présence Active</CardTitle>
                        <div className="flex items-end gap-3 mt-4">
                            <span className="text-6xl font-black tracking-tighter leading-none text-slate-900">{activeCount}</span>
                            <div className="flex flex-col mb-1">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Agents</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1">En Mission/Poste</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 relative overflow-hidden group">
                    <CardHeader className="p-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Index Parité</CardTitle>
                        <div className="flex items-end gap-3 mt-4">
                            <span className="text-6xl font-black tracking-tighter leading-none text-slate-900">
                                {Math.round((employees.filter(e => e.sexe === 'Femme').length / employees.length) * 100)}%
                            </span>
                            <div className="flex flex-col mb-1">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest leading-none">Féminin</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1">Représentation</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 relative overflow-hidden group">
                    <CardHeader className="p-10">
                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">Mobilité / Congés</CardTitle>
                        <div className="flex items-end gap-3 mt-4">
                            <span className="text-6xl font-black tracking-tighter leading-none text-slate-900">{leaveCount}</span>
                            <div className="flex flex-col mb-1">
                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none">Absences</span>
                                <span className="text-[8px] font-bold text-slate-400 uppercase leading-none mt-1">Total Autorisé</span>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Age Pyramid / Distribution */}
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-white/10 p-10">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xl">
                                <TrendingUp className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Pyramide Institutionnelle</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Répartition démographique de l'effectif</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={ageData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="range" 
                                        tick={{fontSize: 9, fontWeight: 900, fill: '#64748b', letterSpacing: '0.1em'}} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                        cursor={{fill: 'rgba(15, 23, 42, 0.02)'}}
                                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                                    />
                                    <Bar 
                                        dataKey="count" 
                                        fill="#0f172a" 
                                        radius={[12, 12, 0, 0]} 
                                        barSize={45}
                                        name="Agents"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Parity Donut */}
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-white/10 p-10">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xl">
                                <GraduationCap className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Mixité Sociale</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Représentation des genres</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={genderData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={90}
                                        outerRadius={125}
                                        paddingAngle={8}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {genderData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name as 'Homme' | 'Femme' | 'Autre'] || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                         contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        formatter={(value) => <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Seniority */}
                <Card className="lg:col-span-2 border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-white/10 p-10">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xl">
                                <History className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Érable de Carrière</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Évolution de la fidélité et expérience</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={seniorityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSeniority" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="name" 
                                        tick={{fontSize: 9, fontWeight: 900, fill: '#64748b', letterSpacing: '0.1em'}} 
                                        axisLine={false}
                                        tickLine={false}
                                        dy={10}
                                    />
                                    <YAxis hide />
                                    <Tooltip 
                                         contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', padding: '20px' }}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="value" 
                                        stroke="#10b981" 
                                        fillOpacity={1} 
                                        fill="url(#colorSeniority)" 
                                        strokeWidth={6}
                                        name="Agents"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Status Breakdown */}
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-3xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-white/10 p-10">
                        <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xl">
                                <Briefcase className="h-7 w-7" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black uppercase tracking-tight text-slate-800">Status</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Positions administratives</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="space-y-8">
                            {statusData.map((item, idx) => (
                                <div key={item.name} className="space-y-3">
                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.15em]">
                                        <span className="text-slate-500">{item.name}</span>
                                        <span className={cn(
                                            "px-3 py-1 rounded-full text-[8px]",
                                            item.name === 'Actif' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-500 border border-slate-100"
                                        )}>
                                            {item.value} / {employees.length}
                                        </span>
                                    </div>
                                    <Progress 
                                        value={(item.value / employees.length) * 100} 
                                        className="h-2.5 bg-slate-100 rounded-full" 
                                        indicatorClassName={cn(
                                            "transition-all duration-1000 rounded-full",
                                            idx % 5 === 0 ? "bg-slate-900" :
                                            idx % 5 === 1 ? "bg-blue-600" :
                                            idx % 5 === 2 ? "bg-emerald-600" :
                                            idx % 5 === 3 ? "bg-amber-600" :
                                            "bg-rose-600"
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
