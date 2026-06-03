"use client";

import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    User, 
    Briefcase, 
    Calendar, 
    MapPin, 
    ShieldCheck, 
    Banknote,
    History as HistoryIcon,
    Mail,
    Phone,
    Users as UsersIcon,
    Award
} from "lucide-react";
import type { Employe, EmployeeEvent, OrganizationSettings } from "@/lib/data";
import { InstitutionalReportWrapper } from "./institutional-report-wrapper";
import { InstitutionalHeader } from "./institutional-header";
import { InstitutionalFooter } from "./institutional-footer";
import { InstitutionalCover } from "./institutional-cover";
import { cn } from "@/lib/utils";

interface EmployeeProfileReportProps {
    employee: Employe;
    history: EmployeeEvent[];
    organizationSettings: OrganizationSettings | null;
    isPrinting: boolean;
    onAfterPrint?: () => void;
    showSalary?: boolean;
    departmentName?: string;
    directionName?: string;
}

export function EmployeeProfileReport({ 
    employee, 
    history,
    organizationSettings,
    isPrinting,
    onAfterPrint,
    showSalary = false,
    departmentName,
    directionName
}: EmployeeProfileReportProps) {
    if (!employee || !isPrinting) return null;

    const todayStr = format(new Date(), "dd MMMM yyyy", { locale: fr });
    
    // Salary calculations
    const baseSalary = employee.baseSalary || 0;
    const primeAnciennete = employee.primeAnciennete || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const indemniteTransport = employee.indemniteTransportImposable || 0;
    const otherIndemnities = (employee.indemniteResponsabilite || 0) + 
                             (employee.indemniteSujetion || 0) + 
                             (employee.indemniteCommunication || 0) + 
                             (employee.indemniteRepresentation || 0);
    
    const totalBrut = baseSalary + primeAnciennete + indemniteLogement + indemniteTransport + otherIndemnities;
    const displayBrut = (employee.Salaire_Brut && employee.Salaire_Brut > 0) ? employee.Salaire_Brut : totalBrut;
    const displayNet = (employee.Salaire_Net && employee.Salaire_Net > 0) ? employee.Salaire_Net : displayBrut;

    const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR').format(val) + " FCFA";

    return (
        <InstitutionalReportWrapper 
            isPrinting={isPrinting} 
            onAfterPrint={onAfterPrint}
            orientation="portrait"
        >
            <div className="bg-white text-black w-full min-h-screen font-sans pb-12">
                {/* --- COVER PAGE --- */}
                <InstitutionalCover 
                    title="DOSSIER INDIVIDUEL DE L'AGENT"
                    subtitle={`${employee.lastName} ${employee.firstName}`}
                    direction="DAARH"
                    service="Direction des Affaires Administratives et des Ressources Humaines"
                    period={`ÉDITION DU ${todayStr}`}
                    stats={[
                        { label: "Matricule", value: employee.matricule || "N/A", icon: ShieldCheck },
                        { label: "Ancienneté", value: employee.dateEmbauche ? `${new Date().getFullYear() - new Date(employee.dateEmbauche).getFullYear()} ans` : "N/A", icon: Calendar },
                        { label: "Événements", value: history.length, icon: HistoryIcon },
                        { label: "Statut", value: employee.status || "Actif", icon: User },
                    ]}
                    reference={`DRP-${employee.matricule}-${new Date().getFullYear()}`}
                    settings={organizationSettings}
                    orientation="portrait"
                />

                {/* --- MAIN CONTENT PAGE --- */}
                <div className="p-12 space-y-5">
                    <InstitutionalHeader 
                        title="Fiche de Renseignements Signalétiques"
                        period={`Document généré le ${todayStr}`}
                        direction="DAARH"
                        service="Ressources Humaines"
                        settings={organizationSettings}
                    />

                    {/* Identité Section */}
                    <section className="space-y-4 break-inside-avoid">
                        <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
                            <User className="h-5 w-5 text-slate-400" />
                            <h3 className="text-lg font-black uppercase tracking-tight">I. État Civil & Identité</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nom et Prénoms</span>
                                <p className="font-black text-slate-900 uppercase text-lg leading-tight">{employee.lastName} {employee.firstName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Matricule Fonction Publique</span>
                                <p className="font-mono font-bold text-slate-700">{employee.matricule || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date et Lieu de Naissance</span>
                                <p className="font-bold text-slate-800">{employee.Date_Naissance ? format(new Date(employee.Date_Naissance), "dd/MM/yyyy") : "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sexe</span>
                                <p className="font-bold text-slate-800">{employee.sexe || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacts</span>
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                    <Phone className="h-3 w-3" /> {employee.mobile || "---"}
                                </p>
                                <p className="font-bold text-slate-800 flex items-center gap-2">
                                    <Mail className="h-3 w-3" /> {employee.email || "---"}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situation Matrimoniale</span>
                                <p className="font-bold text-slate-800">{employee.enfants || 0} enfant(s) à charge</p>
                            </div>
                        </div>
                    </section>

                    {/* Carrière Section */}
                    <section className="space-y-4 break-inside-avoid">
                        <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
                            <Briefcase className="h-5 w-5 text-slate-400" />
                            <h3 className="text-lg font-black uppercase tracking-tight">II. Situation Administrative</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fonction / Poste Occupé</span>
                                <p className="font-black text-slate-900 uppercase">{employee.poste || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie / Grade</span>
                                <p className="font-bold text-blue-700">{employee.categorie || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direction d'Affectation</span>
                                <p className="font-bold text-slate-800 uppercase">{directionName || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unité de Service</span>
                                <p className="font-bold text-slate-800 uppercase">{departmentName || employee.department || "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date de Prise de Service</span>
                                <p className="font-bold text-slate-800">{employee.dateEmbauche ? format(new Date(employee.dateEmbauche), "dd/MM/yyyy") : "---"}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lieu de Travail</span>
                                <p className="font-bold text-slate-800">{employee.Region || "Yamoussoukro (Siège)"}</p>
                            </div>
                        </div>
                    </section>

                    {/* Rémunération Section (Conditional) */}
                    {showSalary && (
                        <section className="space-y-4 break-inside-avoid p-6 bg-slate-50 border-2 border-slate-200 rounded-2xl">
                            <div className="flex items-center gap-3 border-b border-slate-300 pb-2 mb-4">
                                <Banknote className="h-5 w-5 text-slate-400" />
                                <h3 className="text-lg font-black uppercase tracking-tight">III. Éléments de Rémunération</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-sm">
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Salaire de Base</span>
                                    <p className="font-bold text-slate-700">{formatCurrency(baseSalary)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Indemnités Imposables</span>
                                    <p className="font-bold text-slate-700">{formatCurrency(indemniteLogement + indemniteTransport)}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autres Primes</span>
                                    <p className="font-bold text-slate-700">{formatCurrency(primeAnciennete + otherIndemnities)}</p>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-200">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Salaire Brut Annoncé</span>
                                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{formatCurrency(displayBrut)}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">Net à Payer (Estimation)</span>
                                    <span className="text-2xl font-black text-blue-700 tracking-tighter">{formatCurrency(displayNet)}</span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Historique Section */}
                    {history.length > 0 && (
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-2">
                                <HistoryIcon className="h-5 w-5 text-slate-400" />
                                <h3 className="text-lg font-black uppercase tracking-tight">IV. Historique des Événements</h3>
                            </div>
                            <div className="space-y-0 border-2 border-slate-900 rounded-xl overflow-hidden">
                                <table className="w-full text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-900 text-white font-black uppercase text-[10px]">
                                            <th className="p-3 text-left w-1/4 border-r border-slate-700">Date</th>
                                            <th className="p-3 text-left w-1/4 border-r border-slate-700">Événement</th>
                                            <th className="p-3 text-left">Détails / Observations</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()).map((event, idx) => (
                                            <tr key={event.id} className="border-b border-slate-200 last:border-0 even:bg-slate-50">
                                                <td className="p-3 font-bold">{format(new Date(event.effectiveDate), "dd MMMM yyyy", { locale: fr })}</td>
                                                <td className="p-3">
                                                    <span className={cn(
                                                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                        event.eventType === 'Promotion' ? "bg-emerald-100 text-emerald-700" :
                                                        event.eventType === 'Départ' ? "bg-rose-100 text-rose-700" :
                                                        "bg-blue-100 text-blue-700"
                                                    )}>
                                                        {event.eventType}
                                                    </span>
                                                </td>
                                                <td className="p-3 italic text-slate-600">{event.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <InstitutionalFooter 
                        showSignatures={true}
                        leftSignatureTitle="LE RESPONSABLE RH"
                        rightSignatureTitle="LE SECRÉTAIRE GÉNÉRAL"
                        place="Yamoussoukro"
                    />
                </div>
            </div>
        </InstitutionalReportWrapper>
    );
}
