
"use client"

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { getAssets } from '@/services/asset-service';
import type { Asset } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

const chartConfig = {
  count: {
    label: "Nombre",
  },
  "En utilisation": { color: "hsl(var(--chart-1))" },
  "En stock": { color: "hsl(var(--chart-2))" },
  "En réparation": { color: "hsl(var(--chart-3))" },
  "Retiré": { color: "hsl(var(--chart-4))" },
} satisfies ChartConfig

export function AssetStatusChart() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const assetData = await getAssets();
        const statusOrder = ['En utilisation', 'En stock', 'En réparation', 'Retiré'];
        const statusData = statusOrder.map(status => ({
          status,
          count: assetData.filter(asset => asset.status === status).length
        }));

        setChartData(statusData);
      } catch (error) {
        console.error("Failed to fetch asset data for chart:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <ChartContainer config={chartConfig} className="h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="status"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          fontSize={10}
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" radius={4}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={(chartConfig[entry.status as keyof typeof chartConfig] as any)?.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
