

import type { Employe, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution } from '@/lib/data';
import { numberToWords } from '@/lib/utils';
import { getOrganizationSettings } from './organization-service';
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, parseISO, isValid } from 'date-fns';


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


export async function getPayslipDetails(employee: Employe, payslipDate: string): Promise<PayslipDetails> {
    
    const baseSalary = employee.baseSalary || 0;
    
    const seniorityInfo = calculateSeniority(employee.dateEmbauche || '', payslipDate);
    
    // --- Seniority Bonus Calculation ---
    let primeAnciennete = 0;
    if (seniorityInfo.years >= 2) {
        const bonusRate = (seniorityInfo.years - 1) * 0.01; // 1% for 2 years, 2% for 3 years, etc.
        primeAnciennete = baseSalary * bonusRate;
    }


    const indemniteTransportImposable = employee.indemniteTransportImposable || 0;
    const indemniteResponsabilite = employee.indemniteResponsabilite || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const transportNonImposable = employee.transportNonImposable || 0;
    const parts = employee.parts || 1;

    // --- Earnings Calculation from Payroll Entry ---
    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: baseSalary, deduction: 0 },
        { label: 'PRIME D\'ANCIENNETE', amount: primeAnciennete, deduction: 0 },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: indemniteTransportImposable, deduction: 0 },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: indemniteResponsabilite, deduction: 0 },
        { label: 'INDEMNITE DE LOGEMENT', amount: indemniteLogement, deduction: 0 },
    ];

    const brutImposable = earnings.reduce((sum, item) => sum + item.amount, 0);

    // --- Deductions Calculation ---
    // Note: These calculations are highly simplified for demonstration.
    const cnps = brutImposable * 0.063; // 6.3%
    const itsBase = brutImposable * 0.8; // ITS is on 80% of brut
    const its = itsBase * 0.012;  // 1.2% on the 80% base
    const igr = Math.max(0, (brutImposable - cnps - its) * 0.1 * parts); // Very simplified IGR, ensure non-negative
    const cn = brutImposable * 0.015; // 1.5%
    
    // Align deductions with earnings for table layout
    // Find the corresponding earnings and set the deduction value
    const cnpsEarning = earnings.find(e => e.label === 'SALAIRE DE BASE');
    if(cnpsEarning) cnpsEarning.deduction = cnps;

    const itsEarning = earnings.find(e => e.label === 'PRIME D\'ANCIENNETE');
    if(itsEarning) itsEarning.deduction = its;
    
    const igrEarning = earnings.find(e => e.label === 'INDEMNITE DE TRANSPORT IMPOSABLE');
    if(igrEarning) igrEarning.deduction = igr;

    const cnEarning = earnings.find(e => e.label === 'INDEMNITE DE LOGEMENT');
    if(cnEarning) cnEarning.deduction = cn;


    const otherDeductions: PayslipDeduction[] = [
        { label: 'IMPOT SUR SALAIRE (ITS)', amount: its },
        { label: 'IMPOT GENERAL SUR LE REVENU (IGR)', amount: igr },
        { label: 'CONTRIBUTION NATIONALE (CN)', amount: cn },
    ];
    
    const totalDeductions = cnps + otherDeductions.reduce((sum, item) => sum + item.amount, 0);
    
    const netAPayer = brutImposable + transportNonImposable - totalDeductions;
    const netAPayerInWords = numberToWords(Math.floor(netAPayer)) + " FRANCS CFA";

    // --- Employer Contributions ---
    const baseCalculCotisations = brutImposable + transportNonImposable;
    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'PRESTATION FAMILIALE', base: baseCalculCotisations, rate: '5.75%', amount: baseCalculCotisations * 0.0575 },
        { label: 'ACCIDENT DE TRAVAIL', base: baseCalculCotisations, rate: '3.00%', amount: baseCalculCotisations * 0.03 },
        { label: 'TAXE APPRENTISSAGE', base: baseCalculCotisations, rate: '0.40%', amount: baseCalculCotisations * 0.004 },
        { label: 'TAXE FORMATION CONTINUE', base: baseCalculCotisations, rate: '0.60%', amount: baseCalculCotisations * 0.006 },
    ];
    
    const organizationLogos = await getOrganizationSettings();

    const employeeInfoWithStaticData: Employe = {
        ...employee,
        cnpsEmployeur: "320491", // Static CNPS number
        anciennete: seniorityInfo.text,
        paymentDate: payslipDate,
    };

    return {
        employeeInfo: employeeInfoWithStaticData,
        earnings,
        deductions: otherDeductions,
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
