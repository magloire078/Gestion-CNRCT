
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { PayrollEntry } from "@/lib/payroll-data";
import { getPayrollByEmployeeId } from "@/services/payroll-service"; // We need a new service function
import { ArrowLeft, Printer } from "lucide-react";

// Mock data for deductions and earnings for demonstration
const earnings = [
    { description: 'Salaire de base', amount: 0 },
    { description: 'Heures supplémentaires', amount: 15000 },
    { description: 'Prime de performance', amount: 50000 },
];

const deductions = [
    { description: 'Cotisation de sécurité sociale', amount: 25000 },
    { description: 'Impôt sur le revenu', amount: 75000 },
    { description: 'Assurance santé', amount: 10000 },
];


export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [payslip, setPayslip] = useState<PayrollEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof id === 'string') {
            getPayrollByEmployeeId(id)
                .then(data => {
                    setPayslip(data);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };
    
    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-96 w-full" />
            </div>
        )
    }

    if (!payslip) {
        return <div className="text-center text-muted-foreground">Bulletin de paie non trouvé.</div>;
    }
    
    const baseSalary = payslip.baseSalary || 0;
    const totalEarnings = baseSalary + earnings.reduce((acc, item) => acc + item.amount, 0);
    const totalDeductions = deductions.reduce((acc, item) => acc + item.amount, 0);
    const netSalary = totalEarnings - totalDeductions;


    return (
        <div className="flex flex-col gap-6">
             <div className="flex items-center justify-between print:hidden">
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                </Button>
                 <Button onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Imprimer / Enregistrer en PDF
                </Button>
            </div>
            <Card className="w-full max-w-4xl mx-auto" id="payslip-content">
                <CardHeader>
                    <CardTitle className="text-3xl">Bulletin de Paie</CardTitle>
                    <CardDescription>Période: {new Date(payslip.nextPayDate).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div>
                            <h3 className="font-semibold">Entreprise</h3>
                            <p>SYSTEME DE GESTION CNRCT</p>
                            <p>Cotonou, Bénin</p>
                        </div>
                        <div className="text-right">
                            <h3 className="font-semibold">Employé</h3>
                            <p>{payslip.employeeName}</p>
                            <p>Rôle: {payslip.role}</p>
                            <p>Matricule: {payslip.employeeId}</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                         <div>
                            <h4 className="font-semibold text-lg mb-2">Gains</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Salaire de base</TableCell>
                                        <TableCell className="text-right font-mono">{baseSalary.toLocaleString('fr-FR')} XOF</TableCell>
                                    </TableRow>
                                    {earnings.slice(1).map((item, i) => (
                                        <TableRow key={`earning-${i}`}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right font-mono">{item.amount.toLocaleString('fr-FR')} XOF</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                         <div>
                            <h4 className="font-semibold text-lg mb-2">Déductions</h4>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                     {deductions.map((item, i) => (
                                        <TableRow key={`deduction-${i}`}>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell className="text-right font-mono">{item.amount.toLocaleString('fr-FR')} XOF</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                         </div>
                    </div>

                    <div className="mt-8 pt-4 border-t">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-semibold">Total Gains</TableCell>
                                    <TableCell className="text-right font-semibold font-mono">{totalEarnings.toLocaleString('fr-FR')} XOF</TableCell>
                                </TableRow>
                                 <TableRow>
                                    <TableCell className="font-semibold">Total Déductions</TableCell>
                                    <TableCell className="text-right font-semibold font-mono">{totalDeductions.toLocaleString('fr-FR')} XOF</TableCell>
                                </TableRow>
                                 <TableRow className="text-xl">
                                    <TableCell className="font-bold">Salaire Net</TableCell>
                                    <TableCell className="text-right font-bold font-mono">{netSalary.toLocaleString('fr-FR')} XOF</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </div>

                </CardContent>
            </Card>
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #payslip-content, #payslip-content * {
                        visibility: visible;
                    }
                    #payslip-content {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .print-hidden {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
