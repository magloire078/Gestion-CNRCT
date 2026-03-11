"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { 
    ChevronLeft, Printer, Download, 
    Calendar, Loader2, AlertCircle,
    FileText, ArrowRight, RefreshCw,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PayslipTemplate } from "@/components/payroll/payslip-template";
import { getEmployee } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import type { Employe, PayslipDetails } from "@/lib/data";
import { useAuth } from "@/hooks/use-auth";
import { format, parseISO, lastDayOfMonth, addMonths, subMonths } from "date-fns";
import { fr } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

export default function PayslipDetailPage() {
    const { id } = useParams() as { id: string };
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { user, hasPermission } = useAuth();
    
    // Date management
    const payslipDateParam = searchParams.get('payslipDate');
    const [currentDate, setCurrentDate] = useState<string>(
        payslipDateParam || lastDayOfMonth(new Date()).toISOString().split('T')[0]
    );

    const [employee, setEmployee] = useState<Employe | null>(null);
    const [payslipData, setPayslipData] = useState<PayslipDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    
    const printRef = useRef<HTMLDivElement>(null);

    const canView = hasPermission('page:payroll:view') || user?.employeeId === id;

    useEffect(() => {
        async function fetchData() {
            if (!canView && user) {
                router.replace('/intranet');
                return;
            }
            
            setLoading(true);
            try {
                const emp = await getEmployee(id);
                if (emp) {
                    setEmployee(emp);
                    const details = await getPayslipDetails(emp, currentDate);
                    setPayslipData(details);
                }
            } catch (err) {
                console.error("Error fetching payslip details:", err);
                toast({
                    variant: "destructive",
                    title: "Erreur",
                    description: "Impossible de générer les détails du bulletin."
                });
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, currentDate, canView, user, router, toast]);

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPdf = async () => {
        if (!printRef.current || !payslipData) return;
        
        setIsGeneratingPdf(true);
        try {
            const canvas = await html2canvas(printRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`Bulletin_${employee?.lastName}_${format(parseISO(currentDate), 'MMMM_yyyy', { locale: fr })}.pdf`);
            
            toast({
                title: "Succès",
                description: "Le bulletin a été exporté en PDF."
            });
        } catch (err) {
            console.error("PDF generation error:", err);
            toast({
                variant: "destructive",
                title: "Erreur PDF",
                description: "Échec de l'exportation PDF."
            });
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const changeMonth = (offset: number) => {
        const newDate = offset > 0 
            ? lastDayOfMonth(addMonths(parseISO(currentDate), offset))
            : lastDayOfMonth(subMonths(parseISO(currentDate), Math.abs(offset)));
        setCurrentDate(newDate.toISOString().split('T')[0]);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Génération du bulletin en cours...</p>
            </div>
        );
    }

    if (!employee || !payslipData) {
        return (
            <div className="container mx-auto py-20 text-center space-y-4">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto" />
                <h2 className="text-2xl font-bold">Données indisponibles</h2>
                <p className="text-muted-foreground">Nous n'avons pas pu charger les données pour ce bulletin.</p>
                <Button variant="outline" onClick={() => router.push("/payroll")}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Retour à la paie
                </Button>
            </div>
        );
    }

    const formattedPeriod = format(parseISO(currentDate), 'MMMM yyyy', { locale: fr });

    return (
        <div className="container mx-auto py-8 pb-20 space-y-8">
            {/* Barre d'outils Premium */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border print:hidden">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Bulletin de Paie
                        </h1>
                        <p className="text-sm text-muted-foreground">{employee.name} • {formattedPeriod}</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeMonth(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="px-4 text-sm font-bold capitalize w-32 text-center">
                            {formattedPeriod}
                        </span>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md" onClick={() => changeMonth(1)}>
                            <ArrowRight className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-lg h-10">
                        <Printer className="mr-2 h-4 w-4" /> Imprimer
                    </Button>
                    <Button variant="default" size="sm" onClick={handleDownloadPdf} disabled={isGeneratingPdf} className="rounded-lg h-10 bg-slate-900">
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Export PDF
                    </Button>
                </div>
            </div>

            {/* Vue du Bulletin */}
            <div className="flex justify-center">
                <div 
                    ref={printRef}
                    className="bg-white shadow-2xl rounded-xl overflow-hidden border print:shadow-none print:border-none print:rounded-none w-full max-w-[210mm] min-h-[297mm]"
                >
                    <div className="p-4 md:p-8">
                        <PayslipTemplate payslipDetails={payslipData} />
                    </div>
                </div>
            </div>

            {/* Section Aide / Infos */}
            {!isGeneratingPdf && (
                <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 print:hidden">
                    <Card className="bg-slate-50 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4 text-emerald-500" />
                                Authenticité du document
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-500">
                                Ce bulletin de paie est généré numériquement par le système CNRCT. 
                                Le QR Code présent contient les informations d'identification de l'employé 
                                permettant de vérifier l'origine du document.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-50/50 border-none shadow-none">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-blue-500" />
                                Prochain Bulletin
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-slate-500">
                                Le prochain bulletin ( {format(addMonths(parseISO(currentDate), 1), 'MMMM yyyy', { locale: fr })} ) 
                                sera disponible automatiquement à la fin du mois.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}
            
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #print-section, #print-section * {
                        visibility: visible;
                    }
                    div.print-hidden {
                        display: none !important;
                    }
                    .container {
                        max-width: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    /* Ensure the payslip view is visible and sized correctly for A4 */
                    div[ref="printRef"], div[ref="printRef"] * {
                        visibility: visible !important;
                    }
                    div[ref="printRef"] {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 210mm !important;
                        margin: 0 !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
