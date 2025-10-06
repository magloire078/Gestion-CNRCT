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
import { getDepartments } from "@/services/department-service"
import type { Employe, Department } from "@/lib/data"
import { Skeleton } from "../ui/skeleton"

const chartConfig = {
  employees: {
    label: "Employés",
  },
  "Informatique": { label: "Informatique", color: "hsl(var(--chart-1))" },
  "Directoire": { label: "Directoire", color: "hsl(var(--chart-2))" },
  "Membres du Directoire": { label: "Membres du Directoire", color: "hsl(var(--chart-2))" },
  "Direction des Affaires financières et du patrimoine": { label: "Finances", color: "hsl(var(--chart-3))" },
  "Secretariat Général": { label: "Secrétariat", color: "hsl(var(--chart-4))" },
  "Communication": { label: "Communication", color: "hsl(var(--chart-5))" },
  "Comités Régionaux": { label: "Régions", color: "hsl(var(--chart-1))" },
  "Direction Administrative": { label: "Admin", color: "hsl(var(--chart-2))" },
  "Protocole": { label: "Protocole", color: "hsl(var(--chart-3))" },
  "Cabinet": { label: "Cabinet", color: "hsl(var(--chart-4))" },
  "Direction des Affaires sociales": { label: "Social", color: "hsl(var(--chart-5))" },
  "Other": { label: "Autre", color: "hsl(var(--muted))" },
} satisfies ChartConfig

export function EmployeeDistributionChart() {
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [employeeData, departments] = await Promise.all([
          getEmployees(),
          getDepartments(),
        ]);
        
        const departmentMap = new Map(departments.map(d => [d.id, d.name]));

        const departmentData = employeeData.reduce((acc, employee) => {
          let departmentName = "Other";
          if (employee.departmentId && departmentMap.has(employee.departmentId)) {
            departmentName = departmentMap.get(employee.departmentId)!;
          } else if (employee.department) { // Fallback for old data structure
             departmentName = employee.department;
          }
          
          if (departmentName === "Directoire") {
            departmentName = "Membres du Directoire";
          }

          if (!acc[departmentName]) {
            acc[departmentName] = { name: departmentName, value: 0, fill: '' };
          }
          acc[departmentName].value += 1;
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

  const totalEmployees = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])


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
            <Cell key={`cell-${entry.name}`} fill={(chartConfig[entry.name as keyof typeof chartConfig] as any)?.color || chartConfig.Other.color} />
          ))}
        </Pie>
         <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-foreground text-3xl font-bold"
        >
          {totalEmployees.toLocaleString()}
        </text>
        <ChartLegend
          content={<ChartLegendContent nameKey="name" />}
          className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
        />
      </PieChart>
    </ChartContainer>
  )
}
