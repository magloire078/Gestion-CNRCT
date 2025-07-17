
import type { PayrollEntry, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution } from '@/lib/payroll-data';
import { numberToWords } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/data';

// This service calculates payslip details based on a payroll entry.
// Note: Tax and contribution rates are simplified approximations based on the provided image.
// A real-world application would require precise, up-to-date rates and regulations.

async function getEmployeeMatricule(employeeId: string): Promise<string> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (employeeSnap.exists()) {
        const employeeData = employeeSnap.data() as Employee;
        return employeeData.matricule;
    }
    return "N/A";
}


export async function getPayslipDetails(payrollEntry: PayrollEntry): Promise<PayslipDetails> {
    
    // --- Earnings Calculation ---
    const baseSalary = payrollEntry.baseSalary;
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
    // Note: These calculations are highly simplified for demonstration.
    const cnps = brutImposable * 0.063; // 6.3%
    const itsBase = brutImposable * 0.8; // ITS is on 80% of brut
    const its = itsBase * 0.012;  // 1.2% on the 80% base
    const igr = (brutImposable - cnps - its) * 0.1 * payrollEntry.parts; // Very simplified IGR
    const cn = brutImposable * 0.015; // 1.5%
    
    // Align deductions with earnings for table layout
    earnings[0].deduction = cnps;
    earnings[1].deduction = its;
    earnings[2].deduction = igr;
    earnings[4].deduction = cn;


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
    
    const matricule = await getEmployeeMatricule(payrollEntry.employeeId);
    const employeeInfo = { ...payrollEntry, matricule };

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
