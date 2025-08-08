

import type { Employe, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution } from '@/lib/data';
import { numberToWords } from '@/lib/utils';
import { getOrganizationSettings } from './organization-service';
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, parseISO, isValid, lastDayOfMonth, getDay } from 'date-fns';


// This service calculates payslip details based on an employee object.
// Note: Tax and contribution rates are simplified approximations.
// A real-world application would require precise, up-to-date rates and regulations.

function calculateSeniority(hireDateStr: string, payslipDateStr: string): { text: string, years: number } {
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

function getLastWorkingDay(date: Date): Date {
    let lastDay = lastDayOfMonth(date);
    let dayOfWeek = getDay(lastDay); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 6) { // Saturday
        lastDay.setDate(lastDay.getDate() - 1);
    } else if (dayOfWeek === 0) { // Sunday
        lastDay.setDate(lastDay.getDate() - 2);
    }
    return lastDay;
}


export async function getPayslipDetails(employee: Employe, payslipDate: string): Promise<PayslipDetails> {
    
    const baseSalary = employee.baseSalary || 0;
    
    const seniorityInfo = calculateSeniority(employee.dateEmbauche || '', payslipDate);
    
    // --- Seniority Bonus Calculation ---
    let primeAnciennete = employee.primeAnciennete || 0;
    if (seniorityInfo.years >= 2 && !employee.primeAnciennete) { // Check if not manually overridden
        const bonusRate = Math.min(0.25, (seniorityInfo.years) * 0.01); 
        primeAnciennete = baseSalary * bonusRate;
    }

    const indemniteTransportImposable = employee.indemniteTransportImposable || 0;
    const indemniteResponsabilite = employee.indemniteResponsabilite || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const indemniteSujetion = employee.indemniteSujetion || 0;
    const indemniteCommunication = employee.indemniteCommunication || 0;
    const indemniteRepresentation = employee.indemniteRepresentation || 0;
    const transportNonImposable = employee.transportNonImposable || 0;
    const parts = employee.parts || 1;

    // --- Earnings Calculation from Payroll Entry ---
    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: baseSalary, deduction: 0 },
        { label: 'PRIME D\'ANCIENNETE', amount: primeAnciennete, deduction: 0 },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: indemniteTransportImposable, deduction: 0 },
        { label: 'INDEMNITE DE SUJETION', amount: indemniteSujetion, deduction: 0 },
        { label: 'INDEMNITE DE COMMUNICATION', amount: indemniteCommunication, deduction: 0 },
        { label: 'INDEMNITE DE REPRESENTATION', amount: indemniteRepresentation, deduction: 0 },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: indemniteResponsabilite, deduction: 0 },
        { label: 'INDEMNITE DE LOGEMENT', amount: indemniteLogement, deduction: 0 },
    ].filter(e => e.amount > 0); // Only show non-zero earnings

    const brutImposable = earnings.reduce((sum, item) => sum + item.amount, 0);

    // --- Deductions Calculation ---
    const cnps = employee.CNPS ? (brutImposable * 0.063) : 0; // Conditional CNPS deduction
    const its = 0;  // Exonerated as per request
    const igr = 0;  // Exonerated as per request
    const cn = 0;   // Exonerated as per request
    
    const deductions: PayslipDeduction[] = [
        { label: 'RETRAITE (CNPS)', amount: cnps },
        { label: 'IMPOT SUR SALAIRE (ITS)', amount: its },
        { label: 'IMPOT GENERAL SUR LE REVENU (IGR)', amount: igr },
        { label: 'CONTRIBUTION NATIONALE (CN)', amount: cn },
    ];
    
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    
    const netAPayer = brutImposable + transportNonImposable - totalDeductions;
    const netAPayerInWords = numberToWords(Math.floor(netAPayer)) + " FRANCS CFA";

    // --- Employer Contributions ---
    const baseCalculCotisations = brutImposable + transportNonImposable;
    const isCnpsRegistered = employee.CNPS === true;

    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'PRESTATION FAMILIALE', base: baseCalculCotisations, rate: '5.75%', amount: isCnpsRegistered ? (baseCalculCotisations * 0.0575) : 0 },
        { label: 'ACCIDENT DE TRAVAIL', base: baseCalculCotisations, rate: '3.00%', amount: isCnpsRegistered ? (baseCalculCotisations * 0.03) : 0 },
        { label: 'TAXE APPRENTISSAGE', base: baseCalculCotisations, rate: '0.40%', amount: isCnpsRegistered ? (baseCalculCotisations * 0.004) : 0 },
        { label: 'TAXE FORMATION CONTINUE', base: baseCalculCotisations, rate: '0.60%', amount: isCnpsRegistered ? (baseCalculCotisations * 0.006) : 0 },
    ];
    
    const organizationLogos = await getOrganizationSettings();
    
    const paymentDateObject = getLastWorkingDay(parseISO(payslipDate));

    const employeeInfoWithStaticData: Employe = {
        ...employee,
        cnpsEmployeur: "320491", // Static CNPS number
        anciennete: seniorityInfo.text,
        paymentDate: paymentDateObject.toISOString(),
        paymentLocation: 'Yamoussoukro',
    };

    return {
        employeeInfo: employeeInfoWithStaticData,
        earnings,
        deductions,
        totals: {
            brutImposable,
            transportNonImposable: { label: 'INDEMNITE DE TRANSPORT NON IMPOSABLE', amount: transportNonImposable },
            netAPayer: Math.round(netAPayer),
            netAPayerInWords,
        },
        employerContributions,
        organizationLogos
    };
}

    