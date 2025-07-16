
import type { PayrollEntry, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution } from '@/lib/payroll-data';
import { numberToWords } from '@/lib/utils'; // We'll create this utility

// This service calculates payslip details based on a payroll entry.
// Note: Tax and contribution rates are simplified approximations based on the provided image.
// A real-world application would require precise, up-to-date rates and regulations.

export async function getPayslipDetails(payrollEntry: PayrollEntry): Promise<PayslipDetails> {
    
    const employeeInfo = { ...payrollEntry };

    // --- Earnings Calculation ---
    const baseSalary = employeeInfo.baseSalary;
    const primeAnciennete = baseSalary * 0.07; // Approx 7% from example
    const indemniteTransportImposable = 125000; // Fixed from example
    const indemniteLogement = 200000; // Fixed from example
    const transportNonImposable = 25000; // Fixed from example

    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: baseSalary, deduction: 0 },
        { label: 'PRIME D\'ANCIENNETE', amount: primeAnciennete, deduction: 0 },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: indemniteTransportImposable, deduction: 0 },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: 0, deduction: 0 },
        { label: 'INDEMNITE DE LOGEMENT', amount: indemniteLogement, deduction: 0 },
    ];

    const brutImposable = earnings.reduce((sum, item) => sum + item.amount, 0);

    // --- Deductions Calculation ---
    const cnps = brutImposable * 0.063; // 6.3%
    const its = brutImposable * 0.012;  // 1.2%
    const igs = (brutImposable * 0.8) * 0.015 * employeeInfo.parts; // Complex, simplified
    const cn = brutImposable * 0.015; // 1.5%
    
    // Align deductions with earnings for table layout
    earnings[0].deduction = cnps;
    earnings[1].deduction = its;
    earnings[2].deduction = igs;
    earnings[4].deduction = cn;


    const otherDeductions: PayslipDeduction[] = [
        { label: 'IMPOT SUR SALAIRE (ITS)', amount: its },
        { label: 'IMPOT GENERAL SUR LE REVENU (IGR)', amount: igs },
        { label: 'CONTRIBUTION NATIONALE (CN)', amount: cn },
    ];
    
    const totalDeductions = cnps + otherDeductions.reduce((sum, item) => sum + item.amount, 0);
    
    const netAPayer = brutImposable + transportNonImposable - totalDeductions;
    const netAPayerInWords = numberToWords(Math.round(netAPayer)) + " FRANCS CFA";

    // --- Employer Contributions ---
    const baseCalculCotisations = brutImposable + transportNonImposable;
    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'PRESTATION FAMILIALE', base: baseCalculCotisations, rate: '5.75%', amount: baseCalculCotisations * 0.0575 },
        { label: 'ACCIDENT DE TRAVAIL', base: baseCalculCotisations, rate: '3.00%', amount: baseCalculCotisations * 0.03 },
        { label: 'TAXE APPRENTISSAGE', base: baseCalculCotisations, rate: '0.40%', amount: baseCalculCotisations * 0.004 },
        { label: 'TAXE FORMATION CONTINUE', base: baseCalculCotisations, rate: '0.60%', amount: baseCalculCotisations * 0.006 },
    ];
    
    return {
        employeeInfo,
        earnings,
        deductions: otherDeductions,
        totals: {
            brutImposable,
            transportNonImposable: { label: 'INDEMNITE DE TRANSPORT NON IMPOSABLE', amount: transportNonImposable },
            netAPayer,
            netAPayerInWords,
        },
        employerContributions,
    };
}
