
import type { PayrollEntry, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution } from '@/lib/payroll-data';
import { numberToWords } from '@/lib/utils';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Employee } from '@/lib/data';
import { getOrganizationSettings } from './organization-service';


// This service calculates payslip details based on a payroll entry.
// Note: Tax and contribution rates are simplified approximations.
// A real-world application would require precise, up-to-date rates and regulations.

async function getEmployeeMatricule(employeeId: string): Promise<string> {
    const employeeRef = doc(db, 'employees', employeeId);
    const employeeSnap = await getDoc(employeeRef);
    if (employeeSnap.exists()) {
        const employeeData = employeeSnap.data() as Employee;
        return employeeData.matricule;
    }
    
    // Fallback if not found by ID, which is less ideal
    const q = query(collection(db, "employees"), where("employeeId", "==", employeeId), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
        const employeeData = querySnapshot.docs[0].data() as Employee;
        return employeeData.matricule;
    }

    return "N/A";
}


export async function getPayslipDetails(payrollEntry: PayrollEntry): Promise<PayslipDetails> {
    
    // --- Earnings Calculation from Payroll Entry ---
    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: payrollEntry.baseSalary, deduction: 0 },
        { label: 'PRIME D\'ANCIENNETE', amount: payrollEntry.primeAnciennete, deduction: 0 },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: payrollEntry.indemniteTransportImposable, deduction: 0 },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: payrollEntry.indemniteResponsabilite, deduction: 0 },
        { label: 'INDEMNITE DE LOGEMENT', amount: payrollEntry.indemniteLogement, deduction: 0 },
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
    
    const netAPayer = brutImposable + payrollEntry.transportNonImposable - totalDeductions;
    const netAPayerInWords = numberToWords(Math.floor(netAPayer)) + " FRANCS CFA";

    // --- Employer Contributions ---
    const baseCalculCotisations = brutImposable + payrollEntry.transportNonImposable;
    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'PRESTATION FAMILIALE', base: baseCalculCotisations, rate: '5.75%', amount: baseCalculCotisations * 0.0575 },
        { label: 'ACCIDENT DE TRAVAIL', base: baseCalculCotisations, rate: '3.00%', amount: baseCalculCotisations * 0.03 },
        { label: 'TAXE APPRENTISSAGE', base: baseCalculCotisations, rate: '0.40%', amount: baseCalculCotisations * 0.004 },
        { label: 'TAXE FORMATION CONTINUE', base: baseCalculCotisations, rate: '0.60%', amount: baseCalculCotisations * 0.006 },
    ];
    
    const [matricule, organizationLogos] = await Promise.all([
        getEmployeeMatricule(payrollEntry.employeeId),
        getOrganizationSettings(),
    ]);

    const employeeInfo = { ...payrollEntry, matricule };

    return {
        employeeInfo,
        earnings,
        deductions: otherDeductions,
        totals: {
            brutImposable,
            transportNonImposable: { label: 'INDEMNITE DE TRANSPORT NON IMPOSABLE', amount: payrollEntry.transportNonImposable },
            netAPayer,
            netAPayerInWords,
        },
        employerContributions,
        organizationLogos
    };
}
