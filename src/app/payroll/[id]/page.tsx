
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
import { format } from "date-fns";
import { fr } from 'date-fns/locale';
import Image from "next/image";

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
        return value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }

    const { employeeInfo, earnings, deductions, totals, employerContributions, organizationLogos } = payslipDetails;
    const fullName = `${employeeInfo.lastName || ''} ${employeeInfo.firstName || ''}`.trim() || employeeInfo.name;
    const qrCodeValue = `${fullName} | ${employeeInfo.matricule} | ${employeeInfo.department}`;

    const parsedPayslipDate = new Date(payslipDate!);
    const periodDisplay = format(parsedPayslipDate, "MMMM yyyy", { locale: fr });
    const paymentDateDisplay = format(new Date(employeeInfo.paymentDate || payslipDate!), "EEEE dd MMMM yyyy", { locale: fr });

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
            <div id="print-section" className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-8 border rounded-lg text-black print:shadow-none print:border-none print:p-0 font-arial text-xs leading-normal">
                {/* Header */}
                <header className="flex justify-between items-start pb-2 border-b-2 border-gray-300">
                    <div className="text-center">
                        <h2 className="font-bold">Chambre Nationale des Rois</h2>
                        <h2 className="font-bold">et Chefs Traditionnels</h2>
                        <img src="https://i.ibb.co/CBRS8gH/logo-cnrct.png" alt="Logo CNRCT" width={60} height={60} className="mx-auto my-1" />
                    </div>
                    <div className="text-center">
                        <h2 className="font-bold">République de Côte d'Ivoire</h2>
                         <img src="https://i.ibb.co/6r0M3Gv/Coat-of-arms-of-Ivory-Coast-svg.png" alt="Emblème de la Côte d'Ivoire" width={60} height={60} className="mx-auto my-1" />
                        <p className="mt-1">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="text-center my-2 p-1 bg-gray-200 font-bold rounded-md">
                    BULLETIN DE PAIE CNRCT : Période de {periodDisplay}
                </div>

                {/* Employee Info */}
                <section className="grid grid-cols-12 gap-x-4">
                    <div className="col-span-5 space-y-1">
                        <p><span className="font-bold">N° CNPS EMPLOYEUR :</span> {employeeInfo.cnpsEmployeur}</p>
                        <p><span className="font-bold">N° CNPS EMPLOYE :</span> {employeeInfo.cnpsEmploye}</p>
                        <div className="mt-1 bg-white p-1 w-fit">
                          <QRCode value={qrCodeValue} size={60} />
                        </div>
                    </div>
                    <div className="col-span-7 border-2 border-gray-300 rounded-lg p-2">
                         <div className="grid grid-cols-3 gap-x-2">
                            <span className="font-bold">NOM & PRENOMS</span><span className="col-span-2">: {fullName}</span>
                            <span className="font-bold">MATRICULE</span><span className="col-span-2">: {employeeInfo.matricule}</span>
                            <span className="font-bold">SITUATION MARITALE</span><span className="col-span-2">: {employeeInfo.situationMatrimoniale}</span>
                            <span className="font-bold">BANQUE</span><span className="col-span-2">: {employeeInfo.banque}</span>
                            <span className="font-bold">NUMERO DE COMPTE</span><span className="col-span-2">: {employeeInfo.numeroCompte}</span>
                            <span className="font-bold">SERVICE</span><span className="col-span-2">: {employeeInfo.department}</span>
                            <span className="font-bold">DATE DE CONGE</span><span className="col-span-2">: {employeeInfo.dateConge}</span>
                        </div>
                    </div>
                     <div className="col-span-12 grid grid-cols-7 gap-x-2 text-right pr-4 mt-1">
                        <span className="col-start-3 col-span-2 font-bold">ANCIENNETE :</span><span className="col-span-3 text-left">{employeeInfo.anciennete}</span>
                        <span className="col-start-3 col-span-2 font-bold">CATEGORIE :</span><span className="col-span-3 text-left">{employeeInfo.categorie}</span>
                        <span className="col-start-3 col-span-2 font-bold">ENFANT(S) :</span><span className="col-span-3 text-left">{employeeInfo.enfants}</span>
                    </div>
                </section>
                
                {/* Job Info Table */}
                 <table className="w-full border-collapse border-2 border-gray-300 rounded-lg mt-2">
                    <thead className="bg-gray-200 font-bold">
                        <tr>
                            <td className="p-1 rounded-tl-lg">EMPLOI</td>
                            <td className="p-1">MATRICULE</td>
                            <td className="p-1">NBRE DE PARTS</td>
                            <td className="p-1 rounded-tr-lg">DATE D'EMBAUCHE</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="p-1">{employeeInfo.poste}</td>
                            <td className="p-1">{employeeInfo.matricule}</td>
                            <td className="p-1">{employeeInfo.parts}</td>
                            <td className="p-1">{employeeInfo.dateEmbauche}</td>
                        </tr>
                    </tbody>
                </table>


                {/* Earnings & Deductions */}
                <div className="grid grid-cols-12 mt-1 border-2 border-gray-300 rounded-lg">
                    <div className="col-span-9 border-r-2 border-gray-300">
                         <table className="w-full">
                            <thead className="bg-gray-200 font-bold">
                                <tr>
                                    <td className="p-1 w-2/3 rounded-tl-lg">ELEMENTS</td>
                                    <td className="p-1 text-center w-1/3">GAINS</td>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(item => (
                                    <tr key={item.label} className="h-[18px]">
                                        <td className="p-1">{item.label}</td>
                                        <td className="p-1 text-right font-mono">{item.amount > 0 ? formatCurrency(item.amount) : ''}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold h-[18px]">
                                    <td className="p-1">BRUT IMPOSABLE</td>
                                    <td className="p-1 text-right font-mono bg-gray-200">{formatCurrency(totals.brutImposable)}</td>
                                </tr>
                                 <tr className="h-[18px]">
                                    <td className="p-1">{totals.transportNonImposable.label}</td>
                                    <td className="p-1 text-right font-mono">{formatCurrency(totals.transportNonImposable.amount)}</td>
                                </tr>
                                {deductions.map(item => (
                                    <tr key={item.label} className="h-[18px]">
                                        <td className="p-1 w-2/3">{item.label}</td>
                                        <td className="p-1 text-right font-mono w-1/3"></td>
                                    </tr>
                                ))}
                                <tr className="h-[18px]">
                                     <td className="p-1">NBR JRS IMPOSABLES :</td>
                                     <td className="p-1 text-right font-mono"></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-span-3">
                         <table className="w-full">
                            <thead className="bg-gray-200 font-bold">
                                <tr>
                                    <td className="p-1 text-center rounded-tr-lg">RETENUES</td>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(item => (
                                     <tr key={item.label} className="h-[18px]">
                                        <td className="p-1 text-right font-mono">{item.deduction > 0 ? formatCurrency(item.deduction) : ''}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold h-[18px]"><td className="p-1"></td></tr>
                                <tr className="h-[18px]"><td className="p-1"></td></tr>
                                {deductions.map(item => (
                                    <tr key={item.label} className="h-[18px]">
                                        <td className="p-1 text-right font-mono">{item.amount > 0 ? formatCurrency(item.amount) : '0'}</td>
                                    </tr>
                                ))}
                                 <tr className="h-[18px]"><td className="p-1"></td></tr>
                            </tbody>
                         </table>
                    </div>
                 </div>

                 <div className="grid grid-cols-12 -mt-px border-2 border-t-0 border-gray-300 rounded-b-lg">
                    <div className="col-span-9 p-1 flex justify-between items-center font-bold">
                        <span>NET A PAYER</span>
                        <span className="italic font-normal">{totals.netAPayerInWords}</span>
                    </div>
                    <div className="col-span-3 p-1 text-right font-bold font-mono bg-gray-200 rounded-br-lg">{formatCurrency(totals.netAPayer)}</div>
                 </div>
                
                 {/* Employer Contributions */}
                 <div className="grid grid-cols-12 mt-2 border-2 border-gray-300 rounded-lg">
                    <div className="col-span-9 p-2">
                        <p className="font-bold text-center underline mb-1">Impôts à la charge de l'employeur</p>
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
                     <div className="col-span-3 flex flex-col justify-end items-center p-1">
                         <div className="text-center pb-4">
                             <p className="font-bold">Payé à Yamoussoukro le</p>
                             <p className="capitalize">{paymentDateDisplay}</p>
                             <div className="h-8"></div>
                             <p>Signature</p>
                         </div>
                     </div>
                 </div>

                {/* Footer */}
                <footer className="text-center pt-2 border-t border-gray-300 mt-2">
                    <div className="leading-tight">
                        <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                </footer>

            </div>
        </>
    );
}
