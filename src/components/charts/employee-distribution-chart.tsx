
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
import { getEmployees } from "@/services/employee-service"
import type { Employe } from "@/lib/data"
import { Skeleton } from "../ui/skeleton"

const chartConfig = {
  employees: {
    label: "Employés",
  },
  Engineering: { label: "Ingénierie", color: "hsl(var(--chart-1))" },
  Marketing: { label: "Marketing", color: "hsl(var(--chart-2))" },
  Sales: { label: "Ventes", color: "hsl(var(--chart-3))" },
  HR: { label: "RH", color: "hsl(var(--chart-4))" },
  Operations: { label: "Opérations", color: "hsl(var(--chart-5))" },
  Informatique: { label: "Informatique", color: "hsl(var(--chart-1))" },
  "Secretariat Général": { label: "Secrétariat", color: "hsl(var(--chart-2))" },
  Communication: { label: "Communication", color: "hsl(var(--chart-3))" },
  "Direction Administrative": { label: "Admin", color: "hsl(var(--chart-4))" },
  "Direction des Affaires financières et du patrimoine": { label: "Finances", color: "hsl(var(--chart-5))" },
  Protocole: { label: "Protocole", color: "hsl(var(--chart-1))" },
  Cabinet: { label: "Cabinet", color: "hsl(var(--chart-2))" },
  "Direction des Affaires sociales": { label: "Social", color: "hsl(var(--chart-3))" },
  Directoire: { label: "Membres du Directoire", color: "hsl(var(--chart-4))" },
  "Comités Régionaux": { label: "Régions", color: "hsl(var(--chart-5))" },
  Other: { label: "Autre", color: "hsl(var(--muted))" },
} satisfies ChartConfig

export function EmployeeDistributionChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const employeeData = await getEmployees();
        const departmentData = employeeData.reduce((acc, employee) => {
          const department = employee.department || "Other";
          if (!acc[department]) {
            acc[department] = { name: department, value: 0, fill: '' };
          }
          acc[department].value += 1;
          return acc;
        }, {} as Record<string, { name: string, value: number, fill: string }>);

        setChartData(Object.values(departmentData));
      } catch (error) {
        console.error("Failed to fetch employee data for chart:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <Skeleton className="h-[250px] aspect-square mx-auto rounded-full" />;
  }

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
           {chartData.map((entry) => (
            <Cell key={`cell-${entry.name}`} fill={chartConfig[entry.name as keyof typeof chartConfig]?.color || chartConfig.Other.color} />
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
