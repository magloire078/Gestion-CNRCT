
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { getEmployee } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails } from "@/services/payslip-details-service";
import type { Employe } from "@/lib/data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { subMonths, lastDayOfMonth } from 'date-fns';

export default function BulkPayslipPrintPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { id } = params as { id: string };
    const monthsParam = searchParams.get('months');

    const [payslips, setPayslips] = useState<PayslipDetails[]>([]);
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);

    useEffect(() => {
        if (!id || !monthsParam) {
            setError("Paramètres manquants pour générer les bulletins.");
            setLoading(false);
            return;
        }

        const numberOfMonths = parseInt(monthsParam, 10);
        if (isNaN(numberOfMonths) || numberOfMonths <= 0) {
            setError("Nombre de mois invalide.");
            setLoading(false);
            return;
        }

        async function fetchPayslips() {
            try {
                const emp = await getEmployee(id);
                if (!emp) {
                    setError("Employé non trouvé.");
                    setLoading(false);
                    return;
                }
                setEmployee(emp);

                const payslipPromises: Promise<PayslipDetails>[] = [];
                const today = new Date();

                for (let i = 0; i < numberOfMonths; i++) {
                    const targetDate = subMonths(today, i);
                    const lastDay = lastDayOfMonth(targetDate);
                    const formattedDate = lastDay.toISOString().split('T')[0];
                    payslipPromises.push(getPayslipDetails(emp, formattedDate));
                }

                const resolvedPayslips = await Promise.all(payslipPromises);
                setPayslips(resolvedPayslips.sort((a,b) => new Date(b.employeeInfo.paymentDate!).getTime() - new Date(a.employeeInfo.paymentDate!).getTime()));

            } catch (err) {
                console.error("Failed to fetch bulk payslips", err);
                setError("Impossible de générer les bulletins de paie.");
            } finally {
                setLoading(false);
            }
        }
        
        fetchPayslips();

    }, [id, monthsParam]);
    
    useEffect(() => {
        if (isPrinting) {
            setTimeout(() => {
                window.print();
                setIsPrinting(false);
            }, 300);
        }
    }, [isPrinting]);

    if (loading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto p-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[1000px] w-full" />
                 <Skeleton className="h-[1000px] w-full mt-4" />
            </div>
        );
    }
    
    if (error) {
        return <div className="text-center text-destructive p-8">{error}</div>;
    }

    return (
        <>
            <div className={`max-w-4xl mx-auto p-4 sm:p-8 ${isPrinting ? 'print-hidden' : ''}`}>
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                     <div className="text-center">
                        <h1 className="text-xl font-bold">Impression en Masse</h1>
                        <p className="text-muted-foreground">Bulletins de paie pour {employee?.name}</p>
                    </div>
                    <Button onClick={() => setIsPrinting(true)} disabled={isPrinting}>
                        {isPrinting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Printer className="mr-2 h-4 w-4" />}
                        Imprimer
                    </Button>
                </div>
            </div>
            <div id="print-section">
                {payslips.map((payslip, index) => (
                    <PayslipTemplate key={index} payslipDetails={payslip} />
                ))}
            </div>
        </>
    );
}


    