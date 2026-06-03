"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardData } from '@/hooks/use-dashboard-data';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Crown } from 'lucide-react';
import type { ChiefRole } from '@/types/chief';

const ROLE_COLORS: Record<ChiefRole, string> = {
    "Roi": "#f59e0b", // amber-500
    "Chef de province": "#3b82f6", // blue-500
    "Chef de canton": "#10b981", // emerald-500
    "Chef de tribu": "#8b5cf6", // violet-500
    "Chef de Village": "#64748b" // slate-500
};

export function ChiefsDistributionChart() {
    const { user } = useAuth();
    const { globalStats, loading } = useDashboardData(user);

    const data = useMemo(() => {
        if (!globalStats.allChiefs || globalStats.allChiefs.length === 0) return [];

        const counts = globalStats.allChiefs.reduce((acc, chief) => {
            const role = chief.role || "Chef de Village";
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [globalStats.allChiefs]);

    if (loading) {
        return <Skeleton className="h-[400px] w-full rounded-xl" />;
    }

    if (data.length === 0) {
        return (
            <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 gap-4">
                <Crown className="h-12 w-12 opacity-20" />
                <p className="text-sm font-bold uppercase tracking-widest">Aucune autorité enregistrée</p>
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name as ChiefRole] || ROLE_COLORS["Chef de Village"]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value} Autorité(s)`, 'Effectif']}
                    />
                    <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
