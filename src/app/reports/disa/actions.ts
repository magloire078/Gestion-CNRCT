
"use server";

import { getEmployees } from "@/services/employee-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { db } from '@/lib/firebase';
import { collectionGroup, getDocs } from 'firebase/firestore';
import type { OrganizationSettings, EmployeeEvent } from "@/lib/data";
import { lastDayOfMonth, parseISO, getYear, isValid, isBefore, isEqual, isAfter, startOfYear, endOfYear, getMonth } from 'date-fns';

interface DisaRow {
  matricule: string;
  name: string;
  cnpsStatus: boolean;
  monthlySalaries: number[];
  totalBrut: number;
  totalCNPS: number;
}

export interface DisaReportState {
    reportData: DisaRow[] | null;
    grandTotal: { brut: number; cnps: number; monthly: number[] } | null;
    organizationLogos: OrganizationSettings | null;
    year: string | null;
    error: string | null;
}

// Simplified salary calculation function to be used server-side
const calculateMonthlySalary = (employee: any, salaryStructure: any, date: Date) => {
    const hireDate = employee.dateEmbauche ? parseISO(employee.dateEmbauche) : null;
    if (!hireDate || !isValid(hireDate) || isBefore(date, hireDate)) {
        return { brut: 0, cnps: 0 };
    }

    const baseSalary = Number(salaryStructure.baseSalary || 0);

    const years = differenceInYears(date, hireDate);
    let primeAnciennete = 0;
    if (years >= 2) {
        const bonusRate = Math.min(25, years) / 100;
        primeAnciennete = baseSalary * bonusRate;
    }

    const otherIndemnities = [
        'indemniteTransportImposable', 'indemniteSujetion', 'indemniteCommunication',
        'indemniteRepresentation', 'indemniteResponsabilite', 'indemniteLogement'
    ].reduce((sum, key) => sum + Number(salaryStructure[key] || 0), 0);

    const brutImposable = baseSalary + primeAnciennete + otherIndemnities;
    const cnps = employee.CNPS ? brutImposable * 0.063 : 0;

    return { brut: Math.round(brutImposable), cnps: Math.round(cnps) };
};

export async function generateDisaReportAction(
  prevState: DisaReportState,
  formData: FormData
): Promise<DisaReportState> {
  const yearStr = formData.get('year') as string;
  if (!yearStr) {
    return { ...prevState, error: "Veuillez sélectionner une année." };
  }
  const reportYear = parseInt(yearStr);

  try {
    const [allEmployees, organizationLogos, historySnapshot] = await Promise.all([
      getEmployees(),
      getOrganizationSettings(),
      getDocs(collectionGroup(db, 'history'))
    ]);
    
    // Group history events by employee ID
    const historyByEmployee = new Map<string, EmployeeEvent[]>();
    historySnapshot.forEach(doc => {
        const event = doc.data() as EmployeeEvent;
        const employeeId = doc.ref.parent.parent?.id;
        if (employeeId) {
            if (!historyByEmployee.has(employeeId)) {
                historyByEmployee.set(employeeId, []);
            }
            historyByEmployee.get(employeeId)!.push(event);
        }
    });

    const employeesForYear = allEmployees.filter(e => {
        if (!e.dateEmbauche || !isValid(parseISO(e.dateEmbauche))) return false;
        const hireYear = getYear(parseISO(e.dateEmbauche));
        const departureYear = e.Date_Depart && isValid(parseISO(e.Date_Depart)) ? getYear(parseISO(e.Date_Depart)) : null;
        return hireYear <= reportYear && (!departureYear || departureYear >= reportYear);
    });

    if (employeesForYear.length === 0) {
        return { reportData: [], grandTotal: { brut: 0, cnps: 0, monthly: Array(12).fill(0) }, organizationLogos, year: yearStr, error: null };
    }
    
    const reportRows: DisaRow[] = [];

    for (const employee of employeesForYear) {
        const employeeHistory = (historyByEmployee.get(employee.id) || [])
            .filter(e => e.details && isValid(parseISO(e.effectiveDate)))
            .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime());

        const monthlySalaries: number[] = [];
        let totalCNPS = 0;

        for (let month = 0; month < 12; month++) {
            const currentDate = new Date(reportYear, month, 15);
            
            // Find the salary structure effective for the current month
            const relevantEvent = employeeHistory.filter(e => !isAfter(parseISO(e.effectiveDate), currentDate)).pop();

            const salaryStructure = relevantEvent?.details || employee;
            
            const { brut, cnps } = calculateMonthlySalary(employee, salaryStructure, currentDate);
            monthlySalaries.push(brut);
            totalCNPS += cnps;
        }

        const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);

        reportRows.push({
            matricule: employee.matricule,
            name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
            cnpsStatus: employee.CNPS || false,
            monthlySalaries,
            totalBrut,
            totalCNPS,
        });
    }

    const grandTotal = reportRows.reduce((acc, row) => {
      acc.brut += row.totalBrut;
      acc.cnps += row.totalCNPS;
      row.monthlySalaries.forEach((salary, index) => {
          acc.monthly[index] = (acc.monthly[index] || 0) + salary;
      });
      return acc;
    }, { brut: 0, cnps: 0, monthly: Array(12).fill(0) });

     grandTotal.monthly = grandTotal.monthly.map(Math.round);
     grandTotal.brut = Math.round(grandTotal.brut);
     grandTotal.cnps = Math.round(grandTotal.cnps);

    return {
        reportData: reportRows.sort((a, b) => a.name.localeCompare(b.name)),
        grandTotal,
        organizationLogos,
        year: yearStr,
        error: null,
    };

  } catch (err) {
    console.error("Error generating DISA report:", err);
    return { ...prevState, error: "Impossible de générer le rapport. Une erreur inattendue est survenue." };
  }
}
