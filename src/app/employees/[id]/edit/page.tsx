"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { EditEmployeeForm } from "@/components/employees/edit-employee-form";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function EditEmployeePage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { hasPermission, loading: authLoading } = useAuth();
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        
        if (!hasPermission('page:employees:edit')) {
            router.replace(`/employees/${id}`);
            return;
        }

        async function fetchEmployee() {
            try {
                const data = await getEmployee(id);
                setEmployee(data);
            } catch (err) {
                console.error("Error fetching employee for edit:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchEmployee();
    }, [id, hasPermission, authLoading, router]);

    if (loading || authLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Initialisation du formulaire...</p>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="container mx-auto py-20 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Employé non trouvé</h2>
                <p className="text-muted-foreground">Impossible de charger les données pour la modification.</p>
                <Button variant="outline" onClick={() => router.push("/employees")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la liste
                </Button>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8">
            <EditEmployeeForm employee={employee} />
        </div>
    );
}
