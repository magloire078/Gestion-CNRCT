"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import type { Village } from "@/types/village";

interface VillagesDistributionChartProps {
  villages: Village[];
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6', '#0ea5e9'];

export function VillagesDistributionChart({ villages }: VillagesDistributionChartProps) {
  const chartData = useMemo(() => {
    // Group villages by departement
    const countsByDept = villages.reduce((acc, village) => {
      const dept = (village.department || "Non spécifié").replace("DEPARTEMENT DE ", "").replace("DÉPARTEMENT DE ", "").trim();
      if (!acc[dept]) {
        acc[dept] = { name: dept, total: 0, villages: 0, campements: 0 };
      }
      acc[dept].total += 1;
      if (village.type === "campement") {
        acc[dept].campements += 1;
      } else {
        acc[dept].villages += 1;
      }
      return acc;
    }, {} as Record<string, { name: string, total: number, villages: number, campements: number }>);

    return Object.values(countsByDept)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Show top 10 departements
  }, [villages]);

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
        Aucune donnée territoriale disponible
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
          dataKey="name" 
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
        <Bar dataKey="villages" name="Villages" stackId="a" fill="#2563eb" radius={[0, 0, 4, 4]} />
        <Bar dataKey="campements" name="Campements" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
