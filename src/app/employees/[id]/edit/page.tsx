"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { EditEmployeeForm } from "@/components/employees/edit-employee-form";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function EditEmployeePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission, loading: authLoading } = useAuth();
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);

    const employeeId = params.id as string;

    useEffect(() => {
        if (authLoading) return;

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
    }, [employeeId, router, toast, hasPermission, authLoading]);

    if (loading || authLoading) {
        return (
            <div className="max-w-6xl mx-auto py-16 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                    Chargement du dossier de l'agent...
                </p>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="w-full pb-10">
            <EditEmployeeForm employee={employee} />
        </div>
    );
}
