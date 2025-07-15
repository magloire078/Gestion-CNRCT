
"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { employeeData } from "@/lib/data"

const departmentData = employeeData.reduce((acc, employee) => {
  const department = employee.department;
  if (!acc[department]) {
    acc[department] = { name: department, value: 0, fill: '' };
  }
  acc[department].value += 1;
  return acc;
}, {} as Record<string, { name: string, value: number, fill: string }>);

const chartData = Object.values(departmentData);

const chartConfig = {
  employees: {
    label: "Employés",
  },
  Engineering: {
    label: "Ingénierie",
    color: "hsl(var(--chart-1))",
  },
  Marketing: {
    label: "Marketing",
    color: "hsl(var(--chart-2))",
  },
  HR: {
    label: "RH",
    color: "hsl(var(--chart-3))",
  },
  Sales: {
    label: "Ventes",
    color: "hsl(var(--chart-4))",
  },
  Operations: {
    label: "Opérations",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function EmployeeDistributionChart() {
  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[250px]"
    >
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          strokeWidth={5}
        >
           {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color} />
          ))}
        </Pie>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-[2px] flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
