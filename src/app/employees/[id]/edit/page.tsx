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
        <div className="flex flex-col gap-10 pb-20">
             {/* --- PREMIUM EDIT HEADER --- */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl border border-white/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.15),transparent)] opacity-50" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <Link 
                            href={`/employees/${employee.id}`} 
                            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition-colors group"
                        >
                            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Retour à la fiche agent
                        </Link>
                        <div className="space-y-1">
                            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase leading-tight">
                                Mise à jour <br/> 
                                <span className="text-slate-500 font-medium tracking-tight normal-case">{employee.lastName} {employee.firstName}</span>
                            </h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                                <Loader2 className="h-3 w-3 animate-spin" /> Édition sécurisée du dossier individuel
                            </p>
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md hidden md:block">
                         <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">ID SYSTÈME</div>
                         <div className="text-xl font-bold text-white tracking-widest">{employee.matricule}</div>
                    </div>
                </div>
            </div>
            
            <div className="relative z-10">
                <EditEmployeeForm employee={employee} />
            </div>
        </div>
    );
}
