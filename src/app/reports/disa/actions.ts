
"use server";

import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails } from "@/services/payslip-details-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";
import { lastDayOfMonth } from 'date-fns';

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

    const employeesForYear = allEmployees.filter(e => e.matricule);

    if (employeesForYear.length === 0) {
        return { reportData: [], grandTotal: { brut: 0, cnps: 0, monthly: Array(12).fill(0) }, organizationLogos, year: yearStr, error: null };
    }
    
    const reportRows: DisaRow[] = [];
    for (const employee of employeesForYear) {
        const monthlySalaries: number[] = [];
        let totalCNPS = 0;
        
        for (let month = 0; month < 12; month++) {
            const payslipDate = lastDayOfMonth(new Date(reportYear, month)).toISOString().split('T')[0];
            try {
                const details = await getPayslipDetails(employee, payslipDate);
                monthlySalaries.push(details.totals.brutImposable);
                totalCNPS += details.deductions.find(d => d.label === 'CNPS')?.amount || 0;
            } catch (error) {
                console.warn(`Could not generate payslip for ${employee.name} for ${payslipDate}. Setting salary to 0.`, error);
                monthlySalaries.push(0);
            }
        }

        const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);

        reportRows.push({
            matricule: employee.matricule,
            name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
            cnpsStatus: employee.CNPS || false,
            monthlySalaries: monthlySalaries.map(s => Math.round(s)),
            totalBrut: Math.round(totalBrut),
            totalCNPS: Math.round(totalCNPS),
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
