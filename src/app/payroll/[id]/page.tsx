

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Employe } from "@/lib/data";
import { getEmployee } from "@/services/employee-service";
import { getPayslipDetails, PayslipDetails } from "@/services/payslip-details-service";
import { ArrowLeft, Printer } from "lucide-react";
import QRCode from "react-qr-code";
import { format, parseISO } from "date-fns";
import { fr } from 'date-fns/locale';
import { DocumentLayout } from "@/components/common/document-layout";

export default function PayslipPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { id } = params;
    
    const [employee, setEmployee] = useState<Employe | null>(null);
    const [payslipDetails, setPayslipDetails] = useState<PayslipDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const payslipDate = searchParams.get('payslipDate');

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
                const details = await getPayslipDetails(employeeData, payslipDate);
                setPayslipDetails(details);
            } catch (err) {
                console.error(err);
                setError("Impossible de charger les données du bulletin de paie.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, payslipDate]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="space-y-4 max-w-4xl mx-auto p-8">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[1000px] w-full" />
            </div>
        )
    }

    if (error || !employee || !payslipDetails) {
        return <div className="text-center text-destructive p-8">{error || "Bulletin de paie non trouvé."}</div>;
    }

    const formatCurrency = (value: number) => {
        if (value === 0) return '0';
        return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    const { employeeInfo, earnings, deductions, totals, employerContributions, organizationLogos } = payslipDetails;
    const fullName = `${employeeInfo.lastName || ''} ${employeeInfo.firstName || ''}`.trim() || employeeInfo.name;
    const qrCodeValue = `${fullName} | ${employeeInfo.matricule} | ${employeeInfo.departmentId}`;

    const parsedPayslipDate = parseISO(payslipDate!);
    const periodDisplay = format(parsedPayslipDate, "MMMM yyyy", { locale: fr });
    const paymentDateDisplay = format(parseISO(employeeInfo.paymentDate!), "EEEE dd MMMM yyyy", { locale: fr });

    return (
        <>
             <div className="max-w-4xl mx-auto p-4 sm:p-8 print-hidden">
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
            <div id="print-section">
                <DocumentLayout>
                    <div className="font-arial text-[8px] leading-tight text-black">
                        <div className="text-center my-2 p-1 bg-gray-200 font-bold rounded-md text-sm">
                            BULLETIN DE PAIE CNRCT : Période de {periodDisplay}
                        </div>
                        
                        {/* Employee Info */}
                        <section className="flex">
                            <div className="w-1/3 space-y-1">
                                <p className="text-[9px]"><span className="font-bold">N° CNPS EMPLOYEUR</span>: {employeeInfo.cnpsEmployeur}</p>
                                <p className="text-[9px]"><span className="font-bold">N° CNPS EMPLOYE</span>: {employeeInfo.cnpsEmploye}</p>
                                <div className="mt-2 bg-white p-1 w-fit">
                                  <QRCode value={qrCodeValue} size={32} />
                                </div>
                            </div>
                            <div className="w-2/3 pl-4">
                                <div className="border border-gray-400 rounded-lg p-2 text-[9px] grid grid-cols-1 gap-y-1">
                                    <p><span className="font-bold inline-block w-[140px]">NOM & PRENOMS</span>: <span className="pl-1">{fullName}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">MATRICULE</span>: <span className="pl-1">{employeeInfo.matricule}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">SITUATION MATRIMONIALE</span>: <span className="pl-1">{employeeInfo.situationMatrimoniale}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">BANQUE</span>: <span className="pl-1">{employeeInfo.banque}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">NUMERO DE COMPTE</span>: <span className="pl-1">{employeeInfo.numeroCompteComplet || employeeInfo.numeroCompte}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">SERVICE</span>: <span className="pl-1">{employeeInfo.departmentId}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">DATE DE CONGE</span>: <span className="pl-1">__/__/____</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">ANCIENNETE</span>: <span className="pl-1">{employeeInfo.anciennete}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">ENFANT(S)</span>: <span className="pl-1">{employeeInfo.enfants}</span></p>
                                    <p><span className="font-bold inline-block w-[140px]">CATEGORIE</span>: <span className="pl-1">{employeeInfo.categorie}</span></p>
                                </div>
                            </div>
                        </section>
                        
                         {/* Job Info Table */}
                         <table className="w-full border-collapse border border-gray-400 rounded-lg mt-2 text-[9px]">
                            <thead className="bg-gray-200 font-bold text-center">
                                <tr>
                                    <td className="p-1 border-r border-gray-400">EMPLOI</td>
                                    <td className="p-1 border-r border-gray-400">MATRICULE</td>
                                    <td className="p-1 border-r border-gray-400">NBRE DE PARTS</td>
                                    <td className="p-1">DATE D'EMBAUCHE</td>
                                </tr>
                            </thead>
                            <tbody className="text-center">
                                <tr>
                                    <td className="p-1 border-r border-gray-400">{employeeInfo.poste}</td>
                                    <td className="p-1 border-r border-gray-400">{employeeInfo.matricule}</td>
                                    <td className="p-1 border-r border-gray-400">{employeeInfo.parts}</td>
                                    <td className="p-1">{employeeInfo.dateEmbauche}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        {/* Earnings & Deductions */}
                        <div className="border border-gray-400 rounded-lg mt-2 text-[9px]">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-200 font-bold">
                                    <tr>
                                        <th className="p-1 text-left w-[50%]">ELEMENTS</th>
                                        <th className="p-1 text-center w-[25%] border-l border-gray-400">GAINS</th>
                                        <th className="p-1 text-center w-[25%] border-l border-gray-400">RETENUES</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {earnings.map(item => (
                                        <tr key={item.label}>
                                            <td className="pl-1 h-[21px]">{item.label}</td>
                                            <td className="pr-1 text-right font-mono border-l border-gray-400">{item.amount > 0 ? formatCurrency(item.amount) : ''}</td>
                                            <td className="pr-1 text-right font-mono border-l border-gray-400"></td>
                                        </tr>
                                    ))}
                                    <tr className="font-bold bg-gray-200">
                                        <td className="pl-1 h-[21px]">BRUT IMPOSABLE</td>
                                        <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(totals.brutImposable)}</td>
                                        <td className="border-l border-gray-400"></td>
                                    </tr>
                                    <tr>
                                        <td className="pl-1 h-[21px]">{totals.transportNonImposable.label}</td>
                                        <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(totals.transportNonImposable.amount)}</td>
                                        <td className="border-l border-gray-400"></td>
                                    </tr>
                                    
                                     {deductions.map(item => (
                                        <tr key={item.label}>
                                            <td className="pl-1 h-[21px]">{item.label}</td>
                                            <td className="border-l border-gray-400"></td>
                                            <td className="pr-1 text-right font-mono border-l border-gray-400">{formatCurrency(item.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                         <td className="pl-1 h-[21px]"><span className="font-bold">NBR JRS IMPOSABLES :</span></td>
                                         <td className="border-l border-gray-400"></td>
                                         <td className="border-l border-gray-400"></td>
                                    </tr>
    
                                </tbody>
                            </table>
                             <div className="flex justify-between items-center font-bold bg-gray-200 border-t border-gray-400">
                                <div className="w-[50%] p-1 italic font-normal text-[8px] text-center">
                                    {totals.netAPayerInWords}
                                </div>
                                <div className="w-[25%] p-1 text-left border-l border-gray-400">NET A PAYER</div>
                                <div className="w-[25%] p-1 text-right font-mono pr-1 border-l border-gray-400 text-sm">{formatCurrency(totals.netAPayer)}</div>
                            </div>
                         </div>
                         
                         {/* Employer Contributions */}
                         <div className="grid grid-cols-12 mt-2">
                            <div className="col-span-8">
                                <p className="font-bold text-center underline mb-1 text-sm">Impôts à la charge de l'employeur</p>
                                <div className="border border-gray-400 rounded-lg p-1 text-[9px]">
                                     <table className="w-full">
                                        <tbody>
                                            {employerContributions.map(item => (
                                                 <tr key={item.label}>
                                                    <td className="w-[45%] pr-2">{item.label}</td>
                                                    <td className="w-[25%] text-right font-mono pr-2">{formatCurrency(item.base)}</td>
                                                    <td className="w-[10%] text-center font-mono">{item.rate}</td>
                                                    <td className="w-[20%] text-right font-mono">{formatCurrency(item.amount)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                             <div className="col-span-4 flex flex-col justify-center items-center p-1">
                                 <div className="text-center pb-1">
                                     <p className="font-bold">Payé à Yamoussoukro le</p>
                                     <p className="capitalize text-xs">{paymentDateDisplay}</p>
                                     <div className="h-20"></div>
                                     <p className="border-t border-gray-400 pt-1 opacity-50">Signature</p>
                                 </div>
                             </div>
                         </div>
                    </div>
                </DocumentLayout>
            </div>
        </>
    );
}

    
