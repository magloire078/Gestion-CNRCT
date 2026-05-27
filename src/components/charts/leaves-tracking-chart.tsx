"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { Leave } from "@/lib/data";

interface LeavesTrackingChartProps {
  leaves: Leave[];
}

export function LeavesTrackingChart({ leaves }: LeavesTrackingChartProps) {
  const chartData = useMemo(() => {
    // Group leaves by month of start date
    const monthlyData: Record<string, { month: string, sortKey: string, Approuvé: number, 'En attente': number, Rejeté: number }> = {};

    leaves.forEach(leave => {
      try {
        const date = parseISO(leave.startDate);
        const monthKey = format(date, "MMM yyyy", { locale: fr });
        const sortKey = format(date, "yyyy-MM");

        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthKey, sortKey, Approuvé: 0, 'En attente': 0, Rejeté: 0 };
        }

        const status = leave.status as 'Approuvé' | 'En attente' | 'Rejeté';
        if (monthlyData[monthKey][status] !== undefined) {
          monthlyData[monthKey][status] += 1;
        }
      } catch (e) {
        // Ignore invalid dates
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .slice(-6); // Show last 6 months
  }, [leaves]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
        Aucune donnée de congés disponible
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
        <XAxis 
          dataKey="month" 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
          dy={10}
        />
        <YAxis 
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
          dx={-10}
        />
        <Tooltip
          cursor={{ fill: '#f8fafc' }}
          contentStyle={{ 
            borderRadius: '1rem', 
            border: 'none', 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            fontWeight: 800,
            textTransform: 'uppercase',
            fontSize: '11px',
            letterSpacing: '0.05em'
          }}
        />
        <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }} />
        <Bar dataKey="Approuvé" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
        <Bar dataKey="En attente" stackId="a" fill="#f59e0b" />
        <Bar dataKey="Rejeté" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
