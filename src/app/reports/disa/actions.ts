
"use server";

import { getEmployees } from "@/services/employee-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { Employe, OrganizationSettings } from "@/lib/data";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { lastDayOfMonth, parseISO, getYear, isValid, isBefore, isEqual } from 'date-fns';

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
    const [allEmployees, organizationLogos] = await Promise.all([
      getEmployees(),
      getOrganizationSettings(),
    ]);
    
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
        const monthlySalaries: number[] = [];
        let totalCNPS = 0;

        for (let month = 0; month < 12; month++) {
            const dateForPayslip = lastDayOfMonth(new Date(reportYear, month)).toISOString().split('T')[0];
            
            // Do not calculate for months before hiring or after departure
            const hireDate = employee.dateEmbauche ? parseISO(employee.dateEmbauche) : null;
            const departureDate = employee.Date_Depart ? parseISO(employee.Date_Depart) : null;
            const payslipDateObj = parseISO(dateForPayslip);
            
            if ((hireDate && isBefore(payslipDateObj, hireDate)) || (departureDate && isBefore(departureDate, payslipDateObj))) {
                 monthlySalaries.push(0);
                 continue;
            }

            try {
                const details = await getPayslipDetails(employee, dateForPayslip);
                const brutImposable = details.totals.brutImposable;
                const cnps = details.deductions.find(d => d.label === 'CNPS')?.amount || 0;
                
                monthlySalaries.push(Math.round(brutImposable));
                totalCNPS += Math.round(cnps);
            } catch (error) {
                console.warn(`Could not calculate payslip for ${employee.name} for ${dateForPayslip}:`, error);
                monthlySalaries.push(0);
            }
        }

        const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);

        reportRows.push({
            matricule: employee.matricule || 'N/A',
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
