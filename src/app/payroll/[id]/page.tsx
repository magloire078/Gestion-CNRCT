"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useAuth } from "@/hooks/use-auth";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { getEmployee } from "@/services/employee-service";
import type { Employe, PayslipDetails } from "@/lib/data";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Printer, 
    Download, 
    ChevronLeft, 
    ShieldCheck,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isValid } from "date-fns";
import { fr } from "date-fns/locale";

export default function PayslipDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { hasPermission } = useAuth();
    
    // In this app, /payroll/[id] refers to an employee ID
    const employeeId = params.id as string;
    const payslipDate = searchParams.get('payslipDate') || format(new Date(), 'yyyy-MM-dd');

    const [payslipDetails, setPayslipDetails] = useState<PayslipDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!employeeId) return;

        async function fetchData() {
            try {
                const employeeDoc = await getEmployee(employeeId);
                
                if (employeeDoc) {
                    const details = await getPayslipDetails(employeeDoc, payslipDate);
                    setPayslipDetails(details);
                } else {
                     toast({
                        variant: "destructive",
                        title: "Indisponible",
                        description: "L'employé demandé est introuvable."
                    });
                    router.push("/payroll");
                }
            } catch (error) {
                console.error("Failed to load payslip details:", error);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de générer le bulletin de paie."
                });
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [employeeId, payslipDate, router, toast]);

    const handlePrint = () => {
        setIsPrinting(true);
        // Little delay to ensure state update potentially triggers re-render if needed
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300);
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
                <div className="h-10 w-48 bg-slate-100 rounded-lg" />
                <div className="h-[800px] bg-slate-50 rounded-[3rem]" />
            </div>
        );
    }

    if (!payslipDetails) return null;

    const periodDisplay = isValid(parseISO(payslipDate)) 
        ? format(parseISO(payslipDate), "MMMM yyyy", { locale: fr })
        : "Période inconnue";

    return (
        <div className="space-y-8 pb-20">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="space-y-1">
                    <Link 
                        href="/payroll" 
                        className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft className="h-3 w-3" /> Retour à la liste
                    </Link>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        Bulletin de Paie <span className="text-slate-400 font-medium">{periodDisplay}</span>
                    </h1>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button 
                        variant="outline" 
                        className="rounded-2xl h-12 px-6 border-slate-200 bg-white hover:bg-slate-50 text-slate-600 font-bold transition-all shadow-xl shadow-slate-200"
                        onClick={handlePrint}
                    >
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                    <Button 
                        disabled
                        className="rounded-2xl h-12 px-6 bg-slate-900 text-white hover:bg-slate-800 font-bold transition-all shadow-xl shadow-slate-900/20"
                    >
                        <Download className="mr-2 h-4 w-4" /> Télécharger PDF
                    </Button>
                </div>
            </div>

            {/* Main Preview Container (visible on screen only) */}
            <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-300/60 overflow-hidden border border-slate-100 min-h-[1000px] relative print:hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-bl-full opacity-50 -z-0 pointer-events-none" />
                
                <div className="relative z-10 p-4 md:p-8">
                    <PayslipTemplate payslipDetails={payslipDetails} />
                </div>
            </div>

            {/* Print Container (Visible only in print, ID must be print-section for globals.css) */}
            {typeof document !== 'undefined' && createPortal(
                <div id="print-section" className="bg-white">
                    <PayslipTemplate payslipDetails={payslipDetails} />
                </div>,
                document.body
            )}

            {/* Help / Contextual Note */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-8 flex gap-6 items-start print:hidden">
                <div className="h-12 w-12 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                    <ShieldCheck className="h-6 w-6 text-white" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-indigo-900 font-black uppercase tracking-widest text-xs">Note de Conformité</h3>
                    <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
                        Ce bulletin de paie est généré dynamiquement sur la base des paramètres de carrière et de rémunération de l'employé. 
                        Il fait foi en tant que document administratif provisoire. En cas de divergence, veuillez contacter la Direction des Ressources Humaines.
                    </p>
                </div>
            </div>
        </div>
    );
}
