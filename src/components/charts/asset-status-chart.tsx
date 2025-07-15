
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { assetData } from "@/lib/data"

const statusData = assetData.reduce((acc, asset) => {
  const status = asset.status;
  if (!acc[status]) {
    acc[status] = { status, count: 0 };
  }
  acc[status].count += 1;
  return acc;
}, {} as Record<string, { status: string, count: number }>);

const chartData = Object.values(statusData);

const chartConfig = {
  count: {
    label: "Nombre",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function AssetStatusChart() {
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
        />
        <YAxis />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
