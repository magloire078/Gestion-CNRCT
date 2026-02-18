
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
import { getDirections } from "@/services/direction-service"
import { getServices } from "@/services/service-service"
import type { Employe, Department, Direction, Service } from "@/lib/data"
import { Skeleton } from "../ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
      <path d={`M${x},${y}L${x2},${y2}L${ex},${ey}`} stroke="hsl(var(--muted-foreground))" fill="none" strokeWidth={0.5} />
      <text x={ex + (x2 > cx ? 1 : -1) * 4} y={ey} textAnchor={textAnchor} fill="hsl(var(--muted-foreground))" fontSize="10px" dominantBaseline="central">
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    </g>
  );
};


export function EmployeeDistributionChart() {
  const [employees, setEmployees] = React.useState<Employe[]>([])
  const [departments, setDepartments] = React.useState<Department[]>([])
  const [directions, setDirections] = React.useState<Direction[]>([])
  const [services, setServices] = React.useState<Service[]>([])
  const [filterType, setFilterType] = React.useState<"department" | "direction" | "service">("department")
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [employeeData, departmentData, directionData, serviceData] = await Promise.all([
          getEmployees(),
          getDepartments(),
          getDirections(),
          getServices(),
        ]);

        setEmployees(employeeData);
        setDepartments(departmentData);
        setDirections(directionData);
        setServices(serviceData);
      } catch (error) {
        console.error("Failed to fetch organizational data for chart:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  React.useEffect(() => {
    if (employees.length === 0) return;

    let distribution: Record<string, { name: string, value: number, fill: string }> = {};

    if (filterType === "department") {
      const departmentMap = new Map(departments.map(d => [d.id, d.name]));
      distribution = employees.reduce((acc, employee) => {
        let name = "Autre";
        if (employee.departmentId && departmentMap.has(employee.departmentId)) {
          name = departmentMap.get(employee.departmentId)!;
        } else if (employee.department) {
          name = employee.department;
        }
        if (name === "Directoire") name = "Membres du Directoire";

        if (!acc[name]) acc[name] = { name, value: 0, fill: '' };
        acc[name].value += 1;
        return acc;
      }, distribution);
    } else if (filterType === "direction") {
      const directionMap = new Map(directions.map(d => [d.id, d.name]));
      distribution = employees.reduce((acc, employee) => {
        let name = "Sans Direction";
        if (employee.directionId && directionMap.has(employee.directionId)) {
          name = directionMap.get(employee.directionId)!;
        }
        if (!acc[name]) acc[name] = { name, value: 0, fill: '' };
        acc[name].value += 1;
        return acc;
      }, distribution);
    } else if (filterType === "service") {
      const serviceMap = new Map(services.map(s => [s.id, s.name]));
      distribution = employees.reduce((acc, employee) => {
        let name = "Sans Service";
        if (employee.serviceId && serviceMap.has(employee.serviceId)) {
          name = serviceMap.get(employee.serviceId)!;
        }
        if (!acc[name]) acc[name] = { name, value: 0, fill: '' };
        acc[name].value += 1;
        return acc;
      }, distribution);
    }

    setChartData(Object.values(distribution).sort((a, b) => b.value - a.value));
  }, [employees, departments, directions, services, filterType]);

  const totalEmployees = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0)
  }, [chartData])


  if (loading) {
    return <Skeleton className="h-[250px] w-full" />;
  }

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-center">
        <Tabs value={filterType} onValueChange={(v: any) => setFilterType(v)}>
          <TabsList className="grid w-[300px] grid-cols-3">
            <TabsTrigger value="department">Dép.</TabsTrigger>
            <TabsTrigger value="direction">Dir.</TabsTrigger>
            <TabsTrigger value="service">Serv.</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
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
              <Cell key={`cell-${entry.name}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
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
    </div>
  )
}
