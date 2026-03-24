"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { EditEmployeeForm } from "@/components/employees/edit-employee-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function EditEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);

    const employeeId = params.id as string;

    useEffect(() => {
        if (!hasPermission('page:employees:edit')) {
            toast({
                variant: "destructive",
                title: "Accès refusé",
                description: "Vous n'avez pas les permissions nécessaires pour modifier un employé."
            });
            router.push("/employees");
            return;
        }

        if (!employeeId) return;

        getEmployee(employeeId)
            .then(emp => {
                if (emp) {
                    setEmployee(emp);
                } else {
                    toast({
                        variant: "destructive",
                        title: "Erreur",
                        description: "Employé non trouvé."
                    });
                    router.push("/employees");
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [employeeId, router, toast, hasPermission]);

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 w-48 bg-slate-100 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="h-96 bg-slate-50 rounded-[2rem]" />
                    <div className="md:col-span-2 h-[600px] bg-slate-50 rounded-[2rem]" />
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="space-y-6">
            <Link 
                href={`/employees/${employee.id}`} 
                className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
                <ChevronLeft className="h-4 w-4" /> Retour à la fiche
            </Link>
            
            <EditEmployeeForm employee={employee} />
        </div>
    );
}
