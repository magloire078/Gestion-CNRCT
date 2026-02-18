
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employe, PayslipDetails } from "@/lib/data";
import { getEmployee } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { ArrowLeft, Printer } from "lucide-react";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import { eachMonthOfInterval, lastDayOfMonth, parseISO, format } from "date-fns";

export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id } = params;

    const [employee, setEmployee] = useState<Employe | null>(null);
    const [payslips, setPayslips] = useState<PayslipDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPrinting, setIsPrinting] = useState(false);


    const payslipDate = searchParams.get('payslipDate');
    const endDateParam = searchParams.get('endDate');

    useEffect(() => {
        async function fetchData() {
            if (typeof id !== 'string') {
                setLoading(false);
                setError("ID d'employé invalide.");
                return;
            }
            if (!payslipDate) {
                setLoading(false);
                setError("Date du bulletin non spécifiée. Veuillez retourner et sélectionner une date.");
                return;
            }

            try {
                const employeeData = await getEmployee(id);
                if (!employeeData) {
                    setError("Données de l'employé non trouvées.");
                    setLoading(false);
                    return;
                }
                setEmployee(employeeData);

                if (endDateParam) {
                    const start = parseISO(payslipDate);
                    const end = parseISO(endDateParam);
                    const months = eachMonthOfInterval({ start, end });

                    const payslipPromises = months.map(month => {
                        const formattedDate = lastDayOfMonth(month).toISOString().split('T')[0];
                        return getPayslipDetails(employeeData, formattedDate);
                    });

                    const allDetails = await Promise.all(payslipPromises);
                    setPayslips(allDetails);
                } else {
                    const details = await getPayslipDetails(employeeData, payslipDate);
                    setPayslips([details]);
                }
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les données du bulletin de paie.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, payslipDate, endDateParam]);

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => {
            window.print();
            setIsPrinting(false);
        }, 300); // Delay to ensure styles are applied
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto p-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[1000px] w-full" />
            </div>
        )
    }

    if (error || !employee || payslips.length === 0) {
        return <div className="text-center text-destructive p-8">{error || "Bulletin(s) de paie non trouvé(s)."}</div>;
    }

    return (
        <>
            <div className={`max-w-4xl mx-auto p-4 sm:p-8 ${isPrinting ? 'print-hidden' : ''}`}>
                <div className="flex items-center justify-between">
                    <Button variant="outline" onClick={() => router.back()}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour
                    </Button>
                    <Button onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimer / Enregistrer en PDF
                    </Button>
                </div>
            </div>
            <div id="print-section" className={!isPrinting ? 'max-w-4xl mx-auto shadow-lg my-8 space-y-8 bg-white' : ''}>
                {payslips.map((details, index) => (
                    <div key={index} className={index > 0 ? 'print:break-before-page pt-8 print:pt-0' : ''}>
                        <PayslipTemplate payslipDetails={details} />
                    </div>
                ))}
            </div>
        </>
    );
}
