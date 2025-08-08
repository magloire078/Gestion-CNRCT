
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

    const formattedPayslipDate = new Date(payslipDate!);
    const periodDisplay = format(formattedPayslipDate, "MMMM yyyy", { locale: fr });
    const paymentDateDisplay = format(formattedPayslipDate, "EEEE dd MMMM yyyy", { locale: fr });

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
            <div id="print-section" className="w-full max-w-4xl mx-auto bg-white p-4 sm:p-8 border rounded-lg text-black print:shadow-none print:border-none print:p-0 print:text-[8px]">
                {/* Header */}
                <header className="flex justify-between items-start pb-4 border-b">
                    <div className="text-center">
                        <h2 className="font-bold">Chambre Nationale des Rois</h2>
                        <h2 className="font-bold">et Chefs Traditionnels</h2>
                        {organizationLogos.mainLogoUrl && <img src={organizationLogos.mainLogoUrl} alt="Logo CNRCT" width={80} height={80} className="mx-auto mt-2 print:w-16 print:h-16" />}
                        <img src="https://i.ibb.co/3Wf2zYb/un-chef-nouveau.png" alt="Embleme Un Chef Nouveau" width={100} height={100} className="mx-auto mt-2 print:w-20 print:h-20"/>
                    </div>
                    <div className="text-center">
                        <h2 className="font-bold">République de Côte d'Ivoire</h2>
                         <img src="https://i.ibb.co/6r0M3Gv/Coat-of-arms-of-Ivory-Coast-svg.png" alt="Emblème de la Côte d'Ivoire" width={80} height={80} className="mx-auto my-2 print:w-16 print:h-16" />
                        <p className="mt-1">Union - Discipline - Travail</p>
                    </div>
                </header>

                <div className="text-center my-4 p-1 bg-gray-200 font-bold text-sm print:my-2">
                    BULLETIN DE PAIE CNRCT : Période de {periodDisplay}
                </div>

                {/* Employee Info */}
                <section className="grid grid-cols-12 gap-4 text-xs">
                    <div className="col-span-5 space-y-1">
                        <p><span className="font-bold">N° CNPS EMPLOYEUR :</span> {employeeInfo.cnpsEmployeur}</p>
                        <p><span className="font-bold">N° CNPS EMPLOYE :</span> {employeeInfo.cnpsEmploye}</p>
                        <div className="mt-2 bg-white p-1 w-fit">
                          <QRCode value={qrCodeValue} size={64} />
                        </div>
                    </div>
                    <div className="col-span-7 border rounded-lg p-3 print:p-2">
                         <div className="grid grid-cols-3 gap-x-2 gap-y-1">
                            <span className="font-bold">NOM & PRENOMS</span><span className="col-span-2">: <span className="font-arial print:text-[5px]">{fullName}</span></span>
                            <span className="font-bold">MATRICULE</span><span className="col-span-2">: {employeeInfo.matricule}</span>
                            <span className="font-bold">SITUATION MARITALE</span><span className="col-span-2">: {employeeInfo.situationMatrimoniale}</span>
                            <span className="font-bold">BANQUE</span><span className="col-span-2">: {employeeInfo.banque}</span>
                            <span className="font-bold">NUMERO DE COMPTE</span><span className="col-span-2">: {employeeInfo.numeroCompte}</span>
                            <span className="font-bold">SERVICE</span><span className="col-span-2">: {employeeInfo.department}</span>
                            <span className="font-bold">DATE DE CONGE</span><span className="col-span-2">: {employeeInfo.dateConge}</span>
                        </div>
                    </div>
                     <div className="col-span-12 grid grid-cols-7 gap-x-2 gap-y-1 text-right pr-4">
                        <span className="col-start-3 col-span-2 font-bold">ANCIENNETE :</span><span className="col-span-3 text-left">{employeeInfo.anciennete}</span>
                        <span className="col-start-3 col-span-2 font-bold">CATEGORIE :</span><span className="col-span-3 text-left">{employeeInfo.categorie}</span>
                        <span className="col-start-3 col-span-2 font-bold">ENFANT(S) :</span><span className="col-span-3 text-left">{employeeInfo.enfants}</span>
                    </div>
                </section>
                
                {/* Job Info Table */}
                 <table className="w-full border-collapse border mt-4 text-xs print:mt-2">
                    <thead>
                        <tr className="bg-gray-200 font-bold">
                            <td className="border p-1">EMPLOI</td>
                            <td className="border p-1">MATRICULE</td>
                            <td className="border p-1">NBRE DE PARTS</td>
                            <td className="border p-1">DATE D'EMBAUCHE</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border p-1">{employeeInfo.poste}</td>
                            <td className="border p-1">{employeeInfo.matricule}</td>
                            <td className="border p-1">{employeeInfo.parts}</td>
                            <td className="border p-1">{employeeInfo.dateEmbauche}</td>
                        </tr>
                    </tbody>
                </table>


                {/* Earnings & Deductions */}
                <div className="grid grid-cols-12 mt-1">
                    <div className="col-span-9 border-r">
                         <table className="w-full border-collapse border text-xs">
                            <thead>
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border p-1 w-2/3">ELEMENTS</td>
                                    <td className="border p-1 text-center">GAINS</td>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(item => (
                                    <tr key={item.label}>
                                        <td className="border p-1">{item.label}</td>
                                        <td className="border p-1 text-right font-mono">{item.amount > 0 ? formatCurrency(item.amount) : ''}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold">
                                    <td className="border p-1">BRUT IMPOSABLE</td>
                                    <td className="border p-1 text-right font-mono bg-gray-200">{formatCurrency(totals.brutImposable)}</td>
                                </tr>
                                 <tr>
                                    <td className="border p-1">{totals.transportNonImposable.label}</td>
                                    <td className="border p-1 text-right font-mono">{formatCurrency(totals.transportNonImposable.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="col-span-3">
                         <table className="w-full border-collapse border text-xs">
                            <thead>
                                <tr className="bg-gray-200 font-bold">
                                    <td className="border p-1 text-center">RETENUES</td>
                                </tr>
                            </thead>
                            <tbody>
                                {earnings.map(item => (
                                     <tr key={item.label}>
                                        <td className="border p-1 text-right font-mono h-[28px] print:h-auto print:leading-tight">{item.deduction > 0 ? formatCurrency(item.deduction) : ''}</td>
                                    </tr>
                                ))}
                                <tr className="font-bold h-[28px] print:h-auto print:leading-tight"><td className="border p-1"></td></tr>
                                <tr className="h-[28px] print:h-auto print:leading-tight"><td className="border p-1"></td></tr>
                            </tbody>
                         </table>
                    </div>
                </div>
                 <div className="grid grid-cols-12 mt-[-1px]">
                     <div className="col-span-9">
                        <table className="w-full border-collapse border text-xs">
                            <tbody>
                                {deductions.map(item => (
                                    <tr key={item.label}>
                                        <td className="border p-1 w-2/3">{item.label}</td>
                                        <td className="border p-1 text-right font-mono w-1/3"></td>
                                    </tr>
                                ))}
                                <tr>
                                     <td className="border p-1">NBR JRS IMPOSABLES :</td>
                                     <td className="border p-1 text-right font-mono"></td>
                                </tr>
                            </tbody>
                        </table>
                     </div>
                     <div className="col-span-3">
                         <table className="w-full border-collapse border text-xs">
                             <tbody>
                                {deductions.map(item => (
                                    <tr key={item.label}>
                                        <td className="border p-1 text-right font-mono h-[28px] print:h-auto print:leading-tight">{item.amount > 0 ? formatCurrency(item.amount) : '0'}</td>
                                    </tr>
                                ))}
                                 <tr><td className="border p-1 h-[28px] print:h-auto print:leading-tight"></td></tr>
                            </tbody>
                         </table>
                     </div>
                 </div>

                 <div className="grid grid-cols-12 mt-[-1px] border text-xs">
                    <div className="col-span-9 p-1 flex justify-between items-center font-bold">
                        <span>NET A PAYER</span>
                        <span className="italic font-normal text-[9px] print:text-[6px]">{totals.netAPayerInWords}</span>
                    </div>
                    <div className="col-span-3 p-1 text-right font-bold font-mono bg-gray-200">{formatCurrency(totals.netAPayer)}</div>
                 </div>
                
                 {/* Employer Contributions */}
                 <div className="grid grid-cols-12 mt-4 border rounded-b-lg print:mt-2">
                    <div className="col-span-9 p-2">
                        <p className="font-bold text-center underline mb-2">Impôts à la charge de l'employeur</p>
                         <table className="w-full text-xs">
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
                     <div className="col-span-3 flex flex-col justify-between items-center p-2 border-l">
                        <div></div>
                         <div className="text-center text-xs">
                             <p className="font-bold">Payé à {employeeInfo.paymentLocation || 'Abidjan'} le</p>
                             <p className="capitalize">{paymentDateDisplay}</p>
                         </div>
                         <div className="text-xs"></div>
                     </div>
                 </div>

                {/* Footer */}
                <footer className="text-center pt-4 border-t print:pt-2">
                    <div className="text-xs leading-tight print:text-[8px] print:leading-tight">
                        <p className="font-bold">Chambre Nationale de Rois et Chefs Traditionnels (CNRCT)</p>
                        <p>Yamoussoukro, Riviera - BP 201 Yamoussoukro | Tél : (225) 30 64 06 60 | Fax : (+255) 30 64 06 63</p>
                        <p>www.cnrct.ci - Email : info@cnrct.ci</p>
                    </div>
                </footer>

            </div>
        </>
    );
}
