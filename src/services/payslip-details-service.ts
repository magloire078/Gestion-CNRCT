
"use client";

import type { Employe, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution, EmployeeEvent } from '@/lib/data';
import { numberToWords } from '@/lib/utils';
import { getOrganizationSettings } from './organization-service';
import { getEmployeeHistory } from './employee-history-service';
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, parseISO, isValid, lastDayOfMonth, getDay, isBefore, isEqual, isAfter, format } from 'date-fns';
import { fr } from 'date-fns/locale';


// Ce service calcule les détails d'un bulletin de paie pour un employé donné à une date précise.
// Note : Les taux d'imposition et de cotisation sont des approximations simplifiées.
// Une application réelle nécessiterait des taux et des réglementations précis et à jour.

/**
 * Calcule l'ancienneté d'un employé à une date donnée.
 * @param hireDateStr - La date d'embauche (chaîne YYYY-MM-DD).
 * @param payslipDateStr - La date du bulletin de paie pour le calcul (chaîne YYYY-MM-DD).
 * @returns Un objet contenant le texte de l'ancienneté et le nombre d'années.
 */
export function calculateSeniority(hireDateStr: string | undefined, payslipDateStr: string): { text: string, years: number } {
    if (!hireDateStr || !payslipDateStr) return { text: 'N/A', years: 0 };
    
    const hireDate = parseISO(hireDateStr);
    const payslipDate = parseISO(payslipDateStr);

    if (!isValid(hireDate) || !isValid(payslipDate)) return { text: 'Dates invalides', years: 0 };

    const years = differenceInYears(payslipDate, hireDate);
    const dateAfterYears = addYears(hireDate, years);
    
    const months = differenceInMonths(payslipDate, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);

    const days = differenceInDays(payslipDate, dateAfterMonths);

    return {
        text: `${years} an(s), ${months} mois, ${days} jour(s)`,
        years: years
    };
}


/**
 * Calcule tous les détails nécessaires pour un bulletin de paie.
 * @param employee - L'objet employé.
 * @param payslipDate - La date de fin de période du bulletin (ex: "2024-12-31").
 * @returns Un objet PayslipDetails complet.
 */
export async function getPayslipDetails(employee: Employe, payslipDate: string): Promise<PayslipDetails> {
    
    const history = await getEmployeeHistory(employee.id);
    const payslipDateObj = parseISO(payslipDate);

    // Find the most recent salary event that is effective on or before the payslip date.
    const relevantEvent = history
        .filter(event => 
            salaryEventTypes.includes(event.eventType as any) &&
            event.details &&
            isValid(parseISO(event.effectiveDate)) &&
            (isBefore(parseISO(event.effectiveDate), payslipDateObj) || isEqual(parseISO(event.effectiveDate), payslipDateObj))
        )
        .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];
    
    const getSalaryStructure = () => {
        const currentEmployeeStructure = {
            baseSalary: employee.baseSalary || 0,
            indemniteTransportImposable: employee.indemniteTransportImposable || 0,
            indemniteResponsabilite: employee.indemniteResponsabilite || 0,
            indemniteLogement: employee.indemniteLogement || 0,
            indemniteSujetion: employee.indemniteSujetion || 0,
            indemniteCommunication: employee.indemniteCommunication || 0,
            indemniteRepresentation: employee.indemniteRepresentation || 0,
            transportNonImposable: employee.transportNonImposable || 0,
        };

        if (relevantEvent?.details) {
            return {
                baseSalary: Number(relevantEvent.details.baseSalary || 0),
                indemniteTransportImposable: Number(relevantEvent.details.indemniteTransportImposable || 0),
                indemniteResponsabilite: Number(relevantEvent.details.indemniteResponsabilite || 0),
                indemniteLogement: Number(relevantEvent.details.indemniteLogement || 0),
                indemniteSujetion: Number(relevantEvent.details.indemniteSujetion || 0),
                indemniteCommunication: Number(relevantEvent.details.indemniteCommunication || 0),
                indemniteRepresentation: Number(relevantEvent.details.indemniteRepresentation || 0),
                transportNonImposable: Number(relevantEvent.details.transportNonImposable || 0),
            };
        }
        
        // Find the event that occurred right AFTER the payslip date to get the "previous" state
        const nextEvent = history
            .filter(event =>
                salaryEventTypes.includes(event.eventType as any) &&
                event.details &&
                isValid(parseISO(event.effectiveDate)) &&
                isAfter(parseISO(event.effectiveDate), payslipDateObj)
            )
            .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime())[0];
        
        if (nextEvent?.details) {
             return {
                baseSalary: Number(nextEvent.details.previous_baseSalary || 0),
                indemniteTransportImposable: Number(nextEvent.details.previous_indemniteTransportImposable || 0),
                indemniteResponsabilite: Number(nextEvent.details.previous_indemniteResponsabilite || 0),
                indemniteLogement: Number(nextEvent.details.previous_indemniteLogement || 0),
                indemniteSujetion: Number(nextEvent.details.previous_indemniteSujetion || 0),
                indemniteCommunication: Number(nextEvent.details.previous_indemniteCommunication || 0),
                indemniteRepresentation: Number(nextEvent.details.previous_indemniteRepresentation || 0),
                transportNonImposable: Number(nextEvent.details.previous_transportNonImposable || 0),
             }
        }
        
        return currentEmployeeStructure;
    };
    
    let salaryStructure = getSalaryStructure();
    
     // Check if payslipDate is before hireDate
    if (employee.dateEmbauche && isValid(parseISO(employee.dateEmbauche))) {
        if (isBefore(payslipDateObj, parseISO(employee.dateEmbauche))) {
            // If before hire date, set all salary fields to 0
            salaryStructure = {
                baseSalary: 0,
                indemniteTransportImposable: 0,
                indemniteResponsabilite: 0,
                indemniteLogement: 0,
                indemniteSujetion: 0,
                indemniteCommunication: 0,
                indemniteRepresentation: 0,
                transportNonImposable: 0,
            };
        }
    }


    const { baseSalary, ...indemnityFields } = salaryStructure;
    
    const seniorityInfo = calculateSeniority(employee.dateEmbauche || '', payslipDate);
    
    let primeAnciennete = 0;
    if (seniorityInfo.years >= 2) {
        const bonusRate = Math.min(25, seniorityInfo.years);
        primeAnciennete = baseSalary * (bonusRate / 100);
    }

    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: Math.round(baseSalary) },
        { label: 'PRIME D\'ANCIENNETE', amount: Math.round(primeAnciennete) },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: Math.round(indemnityFields.indemniteTransportImposable || 0) },
        { label: 'INDEMNITE DE SUJETION', amount: Math.round(indemnityFields.indemniteSujetion || 0) },
        { label: 'INDEMNITE DE COMMUNICATION', amount: Math.round(indemnityFields.indemniteCommunication || 0) },
        { label: 'INDEMNITE DE REPRESENTATION', amount: Math.round(indemnityFields.indemniteRepresentation || 0) },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: Math.round(indemnityFields.indemniteResponsabilite || 0) },
        { label: 'INDEMNITE DE LOGEMENT', amount: Math.round(indemnityFields.indemniteLogement || 0) },
    ];

    const brutImposable = earnings.reduce((sum, item) => sum + item.amount, 0);
    
    const cnps = employee.CNPS ? (brutImposable * 0.063) : 0;
    const its = 0;
    const igr = 0;
    const cn = 0;
    
    const deductions: PayslipDeduction[] = [
        { label: 'ITS', amount: Math.round(its) },
        { label: 'CN', amount: Math.round(cn) },
        { label: 'IGR', amount: Math.round(igr) },
        { label: 'CNPS', amount: Math.round(cnps) },
    ];
    
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);

    const netAPayer = brutImposable + (indemnityFields.transportNonImposable || 0) - totalDeductions;
    const netAPayerInWords = numberToWords(Math.floor(netAPayer)) + " FRANCS CFA";

    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'ITS PART PATRONALE', base: Math.round(brutImposable), rate: '1,2%', amount: employee.CNPS ? Math.round(brutImposable * 0.012) : 0 },
        { label: 'TAXE D\'APPRENTISSAGE', base: Math.round(brutImposable), rate: '0,4%', amount: employee.CNPS ? Math.round(brutImposable * 0.004) : 0 },
        { label: 'TAXE FPC', base: Math.round(brutImposable), rate: '0,6%', amount: employee.CNPS ? Math.round(brutImposable * 0.006) : 0 },
        { label: 'PRESTATION FAMILIALE', base: Math.min(brutImposable, 70000), rate: '5,75%', amount: employee.CNPS ? Math.round(Math.min(brutImposable, 70000) * 0.0575) : 0 },
        { label: 'ACCIDENT DE TRAVAIL', base: Math.min(brutImposable, 70000), rate: '2,0%', amount: employee.CNPS ? Math.round(Math.min(brutImposable, 70000) * 0.02) : 0 },
        { label: 'REGIME DE RETRAITE', base: Math.round(brutImposable), rate: '7,7%', amount: employee.CNPS ? Math.round(brutImposable * 0.077) : 0 },
    ];
    
    const organizationLogos = await getOrganizationSettings();
    const paymentDateObject = isValid(payslipDateObj) ? lastDayOfMonth(payslipDateObj) : new Date();
    const numeroCompteComplet = [employee.CB, employee.CG, employee.numeroCompte, employee.Cle_RIB].filter(Boolean).join(' ');

    const formattedDateEmbauche = employee.dateEmbauche && isValid(parseISO(employee.dateEmbauche)) 
        ? format(parseISO(employee.dateEmbauche), 'dd MMMM yyyy', { locale: fr })
        : 'N/A';

    const employeeInfoWithStaticData: Employe & { numeroCompteComplet?: string } = {
        ...employee,
        dateEmbauche: formattedDateEmbauche,
        cnpsEmployeur: "320491",
        anciennete: seniorityInfo.text,
        paymentDate: paymentDateObject.toISOString(),
        paymentLocation: 'Yamoussoukro',
        categorie: employee.categorie || 'Catégorie',
        parts: employee.parts || 1.5,
        numeroCompteComplet: numeroCompteComplet
    };

    return {
        employeeInfo: employeeInfoWithStaticData,
        earnings,
        deductions,
        totals: {
            brutImposable: Math.round(brutImposable),
            transportNonImposable: { label: 'INDEMNITE DE TRANSPORT NON IMPOSABLE', amount: Math.round(indemnityFields.transportNonImposable || 0) },
            netAPayer: Math.round(netAPayer),
            netAPayerInWords,
        },
        employerContributions,
        organizationLogos
    };
}
