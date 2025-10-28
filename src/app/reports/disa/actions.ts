
"use server";

import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails } from "@/services/payslip-details-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings } from "@/lib/data";
import { parseISO, isValid, addYears } from 'date-fns';

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

async function calculateAnnualData(payslipPromises: Promise<PayslipDetails>[]): Promise<{ monthlySalaries: number[], totalBrut: number, totalCNPS: number }> {
    const monthlyDetails = await Promise.all(payslipPromises);
    const monthlySalaries = monthlyDetails.map(details => Math.round(details.totals.brutImposable));
    const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);
    const totalCNPS = monthlyDetails.reduce((sum, details) => sum + (details.deductions.find(d => d.label === 'CNPS')?.amount || 0), 0);
    
    return {
        monthlySalaries,
        totalBrut: Math.round(totalBrut),
        totalCNPS: Math.round(totalCNPS),
    };
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
    const [allEmployees, organizationLogos] = await Promise.all([
      getEmployees(),
      getOrganizationSettings(),
    ]);
    
    const employeesForYear = allEmployees.filter(e => {
      if (!e.matricule) return false;
      
      const hireDate = e.dateEmbauche ? parseISO(e.dateEmbauche) : null;
      if (!hireDate || !isValid(hireDate)) return false;

      let departureDate: Date | null = null;
      if (e.Date_Depart && isValid(parseISO(e.Date_Depart))) {
          departureDate = parseISO(e.Date_Depart);
      } else if (e.status === 'Actif' && e.Date_Naissance && isValid(parseISO(e.Date_Naissance))) {
          departureDate = addYears(parseISO(e.Date_Naissance), 60);
      }

      const hiredInTime = hireDate.getFullYear() <= reportYear;
      const notLeftTooEarly = !departureDate || departureDate.getFullYear() >= reportYear;

      return hiredInTime && notLeftTooEarly;
    });

    const reportRows: DisaRow[] = [];
    const matriculeSet = new Set<string>();

    for (const employee of employeesForYear) {
        if (matriculeSet.has(employee.matricule)) continue;
        matriculeSet.add(employee.matricule);

        const monthlyPayslipPromises: Promise<PayslipDetails>[] = [];
        for (let month = 0; month < 12; month++) {
            const date = new Date(reportYear, month, 15);
            const payslipDate = date.toISOString().split('T')[0];
            monthlyPayslipPromises.push(getPayslipDetails(employee, payslipDate));
        }
        const annualTotals = await calculateAnnualData(monthlyPayslipPromises);
        
        reportRows.push({
            matricule: employee.matricule,
            name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
            cnpsStatus: employee.CNPS || false,
            monthlySalaries: annualTotals.monthlySalaries,
            totalBrut: annualTotals.totalBrut,
            totalCNPS: annualTotals.totalCNPS,
        });
    }

    const grandTotal = reportRows?.reduce((acc, row) => {
      acc.brut += row.totalBrut;
      acc.cnps += row.totalCNPS;
      row.monthlySalaries.forEach((salary, index) => {
          acc.monthly[index] = (acc.monthly[index] || 0) + salary;
      });
      return acc;
    }, { brut: 0, cnps: 0, monthly: Array(12).fill(0) });

    return {
        reportData: reportRows,
        grandTotal: grandTotal,
        organizationLogos,
        year: yearStr,
        error: null,
    };

  } catch (err) {
    console.error(err);
    return { ...prevState, error: "Impossible de générer le rapport. Veuillez réessayer." };
  }
}
