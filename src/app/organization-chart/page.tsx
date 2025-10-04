
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { getDepartments } from '@/services/department-service';
import { getDirections } from '@/services/direction-service';
import { getServices } from '@/services/service-service';
import { getEmployees } from '@/services/employee-service';
import type { Department, Direction, Service, Employe } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Building, Globe, Briefcase } from "lucide-react";

interface OrganizationalData {
  departments: Department[];
  directions: Direction[];
  services: Service[];
  employees: Employe[];
}

export default function OrganizationChartPage() {
  const [data, setData] = useState<OrganizationalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [departments, directions, services, employees] = await Promise.all([
          getDepartments(),
          getDirections(),
          getServices(),
          getEmployees(),
        ]);
        setData({ departments, directions, services, employees });
      } catch (err) {
        console.error("Failed to fetch organizational data:", err);
        setError("Impossible de charger les données de l'organisation.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <OrgChartSkeleton />;
  }

  if (error || !data) {
    return <div className="text-center text-destructive py-10">{error || "Aucune donnée disponible."}</div>;
  }

  const { departments, directions, services, employees } = data;

  const employeesByService = (serviceId: string) => employees.filter(e => e.serviceId === serviceId);
  const employeesByDirection = (directionId: string) => employees.filter(e => e.directionId === directionId && !e.serviceId);
  const employeesByDepartment = (departmentId: string) => employees.filter(e => e.departmentId === departmentId && !e.directionId && !e.serviceId);
  
  const servicesInDirection = (directionId: string) => services.filter(s => s.directionId === directionId);
  const servicesInDepartment = (departmentId: string) => services.filter(s => s.departmentId === departmentId && !s.directionId);
  const directionsInDepartment = (departmentId: string) => directions.filter(d => d.departmentId === departmentId);
  

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Organigramme de l'Entreprise</h1>

      <Card>
        <CardHeader>
            <CardTitle>Structure Organisationnelle</CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="multiple" className="w-full">
                {departments.map(dept => (
                    <AccordionItem value={dept.id} key={dept.id}>
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                            <div className="flex items-center gap-3">
                                <Building className="h-6 w-6 text-primary" />
                                {dept.name}
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="pl-8 space-y-4">
                            <EmployeeList employees={employeesByDepartment(dept.id)} />
                            {servicesInDepartment(dept.id).map(svc => (
                                <ServiceNode key={svc.id} service={svc} employees={employeesByService(svc.id)} />
                            ))}

                            {directionsInDepartment(dept.id).map(dir => (
                                <Accordion type="multiple" className="w-full" key={dir.id}>
                                    <AccordionItem value={dir.id}>
                                        <AccordionTrigger className="text-md font-medium hover:no-underline">
                                             <div className="flex items-center gap-3">
                                                <Globe className="h-5 w-5 text-secondary-foreground" />
                                                {dir.name}
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pl-6 space-y-4">
                                            <EmployeeList employees={employeesByDirection(dir.id)} />
                                            {servicesInDirection(dir.id).map(svc => (
                                                 <ServiceNode key={svc.id} service={svc} employees={employeesByService(svc.id)} />
                                            ))}
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}

function ServiceNode({ service, employees }: { service: Service, employees: Employe[] }) {
    return (
        <Card className="bg-muted/50">
            <CardHeader className="p-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {service.name}
                </CardTitle>
            </CardHeader>
            {employees.length > 0 && (
                <CardContent className="p-4 pt-0">
                    <EmployeeList employees={employees} />
                </CardContent>
            )}
        </Card>
    )
}


function EmployeeList({ employees }: { employees: Employe[] }) {
  if (employees.length === 0) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {employees.map(emp => (
        <Link href={`/employees/${emp.id}`} key={emp.id} className="block">
          <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors">
            <Avatar className="h-9 w-9">
              <AvatarImage src={emp.photoUrl} alt={emp.name} data-ai-hint="employee photo" />
              <AvatarFallback>{emp.lastName?.charAt(0)}{emp.firstName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium leading-tight">{`${emp.lastName || ''} ${emp.firstName || ''}`.trim()}</p>
              <p className="text-xs text-muted-foreground">{emp.poste}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function OrgChartSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <Skeleton className="h-9 w-1/3" />
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-1/4" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                </CardContent>
            </Card>
        </div>
    )
}
