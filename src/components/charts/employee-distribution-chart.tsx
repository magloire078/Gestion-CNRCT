
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
  "Autre": { label: "Autre", color: "hsl(var(--muted))" },
} satisfies ChartConfig

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const textRadius = outerRadius + 10;
  const x2 = cx + textRadius * Math.cos(-midAngle * RADIAN);
  const y2 = cy + textRadius * Math.sin(-midAngle * RADIAN);
  const ex = x2;
  const ey = y2;
  const textAnchor = x2 > cx ? 'start' : 'end';


  return (
     <g>
      <path d={`M${x},${y}L${x2},${y2}L${ex},${ey}`} stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={0.5}/>
      <text x={ex + (x2 > cx ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" fontSize="10px" dominantBaseline="central">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};


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
          let departmentName = "Autre";
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
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="mx-auto aspect-square h-[300px]"
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
          innerRadius={50}
          outerRadius={80}
          labelLine={false}
          label={renderCustomizedLabel}
        >
           {chartData.map((entry, index) => (
            <Cell key={`cell-${entry.name}`} fill={`hsl(var(--chart-${index + 1}))`} />
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
      </PieChart>
    </ChartContainer>
  )
}
