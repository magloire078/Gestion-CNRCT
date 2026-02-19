
import { getEmployees } from "@/services/employee-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { Employe, OrganizationSettings, EmployeeEvent } from "@/lib/data";
import { getEmployeeHistory } from "@/services/employee-history-service";
import { parseISO, getYear, isValid, isBefore, isEqual, differenceInYears, lastDayOfMonth } from 'date-fns';

export interface DisaRow {
  matricule: string;
  name: string;
  cnpsStatus: boolean;
  monthlySalaries: number[];
  totalBrut: number;
  totalCNPS: number;
  gratification: number;
}

export interface DisaReportState {
  reportData: DisaRow[] | null;
  grandTotal: { brut: number; cnps: number; gratification: number; monthly: number[] } | null;
  organizationLogos: OrganizationSettings | null;
  year: string | null;
  error: string | null;
}

const salaryEventTypes: EmployeeEvent['eventType'][] = ['Promotion', 'Augmentation au Mérite', 'Ajustement de Marché', 'Revalorisation Salariale'];

function calculateBrutSalary(baseSalary: number, primeAnciennete: number, details: Record<string, any>): number {
  const otherIndemnities = [
    'indemniteTransportImposable', 'indemniteSujetion', 'indemniteCommunication',
    'indemniteRepresentation', 'indemniteResponsabilite', 'indemniteLogement'
  ].reduce((sum, key) => sum + Number(details[key] || 0), 0);
  return baseSalary + primeAnciennete + otherIndemnities;
}

function calculatePrimeAnciennete(baseSalary: number, hireDate: Date | null, payslipDate: Date): number {
  if (!hireDate || !isValid(hireDate) || !isValid(payslipDate)) return 0;
  const yearsOfService = differenceInYears(payslipDate, hireDate);
  if (yearsOfService < 2) return 0;
  const bonusRate = Math.min(25, yearsOfService);
  return baseSalary * (bonusRate / 100);
}

function getSalaryStructureForDate(employee: Employe, history: EmployeeEvent[], date: Date): Record<string, any> {
  const relevantEvent = history
    .filter(event =>
      salaryEventTypes.includes(event.eventType as any) &&
      event.details &&
      isValid(parseISO(event.effectiveDate)) &&
      (isBefore(parseISO(event.effectiveDate), date) || isEqual(parseISO(event.effectiveDate), date))
    )
    .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];

  if (relevantEvent) {
    return relevantEvent.details || {};
  }

  const firstEverEvent = history
    .filter(event => salaryEventTypes.includes(event.eventType as any) && event.details)
    .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime())[0];

  // If the payslip date is before the first salary event, use the "previous" state from that event.
  if (firstEverEvent && firstEverEvent.details && isBefore(date, parseISO(firstEverEvent.effectiveDate))) {
    return {
      baseSalary: firstEverEvent.details?.previous_baseSalary || employee.baseSalary || 0,
      indemniteTransportImposable: firstEverEvent.details?.previous_indemniteTransportImposable || employee.indemniteTransportImposable || 0,
      indemniteResponsabilite: firstEverEvent.details?.previous_indemniteResponsabilite || employee.indemniteResponsabilite || 0,
      indemniteLogement: firstEverEvent.details?.previous_indemniteLogement || employee.indemniteLogement || 0,
      indemniteSujetion: firstEverEvent.details?.previous_indemniteSujetion || employee.indemniteSujetion || 0,
      indemniteCommunication: firstEverEvent.details?.previous_indemniteCommunication || employee.indemniteCommunication || 0,
      indemniteRepresentation: firstEverEvent.details?.previous_indemniteRepresentation || employee.indemniteRepresentation || 0,
      transportNonImposable: firstEverEvent.details?.previous_transportNonImposable || employee.transportNonImposable || 0,
    };
  }

  return employee;
}


export async function generateDisaReport(yearStr: string): Promise<DisaReportState> {
  console.log("generateDisaReport triggered (client-side)");
  if (!yearStr) {
    return { reportData: null, grandTotal: null, organizationLogos: null, year: null, error: "Veuillez sélectionner une année." };
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
      if (e.Date_Depart && isValid(parseISO(e.Date_Depart))) {
        const departureYear = getYear(parseISO(e.Date_Depart));
        return hireYear <= reportYear && departureYear >= reportYear;
      }
      return hireYear <= reportYear;
    });

    if (employeesForYear.length === 0) {
      return { reportData: [], grandTotal: { brut: 0, cnps: 0, gratification: 0, monthly: Array(12).fill(0) }, organizationLogos, year: yearStr, error: null };
    }

    const employeeHistories = new Map<string, EmployeeEvent[]>();
    const historyPromises = employeesForYear.map(e => getEmployeeHistory(e.id).then(h => employeeHistories.set(e.id, h)));
    await Promise.all(historyPromises);

    const reportRows: DisaRow[] = [];

    for (const employee of employeesForYear) {
      const monthlySalaries: number[] = [];
      let totalCNPS = 0;
      const employeeHistory = employeeHistories.get(employee.id) || [];
      const hireDate = employee.dateEmbauche ? parseISO(employee.dateEmbauche) : null;
      const departureDate = employee.Date_Depart ? parseISO(employee.Date_Depart) : null;

      // Gratification Calculation: 75% of December's base salary or last active month
      const dateForGratification = lastDayOfMonth(new Date(reportYear, 11)); // December 31st
      const salaryStructureDec = getSalaryStructureForDate(employee, employeeHistory, dateForGratification);
      const baseSalaryDec = Number(salaryStructureDec.baseSalary || 0);

      let gratification = 0;
      const isPresentInDecember = !departureDate || !isBefore(departureDate, dateForGratification);

      if (isPresentInDecember) {
        gratification = Math.round(baseSalaryDec * 0.75);
      } else {
        gratification = 0;
      }

      for (let month = 0; month < 12; month++) {
        const dateForPayslip = lastDayOfMonth(new Date(reportYear, month));
        let brutImposable = 0;

        if (hireDate && isBefore(dateForPayslip, hireDate)) {
          monthlySalaries.push(0);
          continue;
        }
        if (departureDate && isBefore(departureDate, dateForPayslip)) {
          monthlySalaries.push(0);
          continue;
        }

        const salaryStructure = getSalaryStructureForDate(employee, employeeHistory, dateForPayslip);
        const baseSalary = Number(salaryStructure.baseSalary || 0);
        const primeAnciennete = calculatePrimeAnciennete(baseSalary, hireDate, dateForPayslip);
        brutImposable = calculateBrutSalary(baseSalary, primeAnciennete, salaryStructure);

        if (employee.CNPS === true) {
          totalCNPS += brutImposable * 0.063;
        }

        monthlySalaries.push(Math.round(brutImposable));
      }

      const totalMonthlyBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);
      const totalBrut = totalMonthlyBrut + gratification;

      if (employee.CNPS === true) {
        totalCNPS += gratification * 0.063;
      }

      reportRows.push({
        matricule: employee.matricule || 'N/A',
        name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
        cnpsStatus: employee.CNPS || false,
        monthlySalaries,
        gratification,
        totalBrut: Math.round(totalBrut),
        totalCNPS: Math.round(totalCNPS),
      });
    }

    const grandTotal = reportRows.reduce((acc, row) => {
      acc.brut += row.totalBrut;
      acc.cnps += row.totalCNPS;
      acc.gratification += row.gratification;
      row.monthlySalaries.forEach((salary, index) => {
        acc.monthly[index] = (acc.monthly[index] || 0) + salary;
      });
      return acc;
    }, { brut: 0, cnps: 0, gratification: 0, monthly: Array(12).fill(0) });

    return {
      reportData: reportRows.sort((a, b) => a.name.localeCompare(b.name)),
      grandTotal: {
        brut: Math.round(grandTotal.brut),
        cnps: Math.round(grandTotal.cnps),
        gratification: Math.round(grandTotal.gratification),
        monthly: grandTotal.monthly.map(m => Math.round(m))
      },
      organizationLogos,
      year: yearStr,
      error: null,
    };

  } catch (err) {
    console.error("Error generating DISA report:", err);
    return {
      reportData: null,
      grandTotal: null,
      organizationLogos: null,
      year: yearStr,
      error: `Erreur: ${err instanceof Error ? err.message : String(err)}`
    };
  }
}
