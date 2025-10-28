
"use server";

import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails, calculateSeniority } from "@/services/payslip-details-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings, Employe, EmployeeEvent } from "@/lib/data";
import { parseISO, isValid, isAfter, isBefore, isEqual, getMonth, getYear, startOfYear, endOfYear, startOfMonth, endOfMonth, min, max } from 'date-fns';
import { collectionGroup, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";


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

const salaryEventTypes: EmployeeEvent['eventType'][] = ['Augmentation au Mérite', 'Promotion', 'Ajustement de Marché', 'Revalorisation Salariale'];

interface SalaryStructure {
    baseSalary: number;
    indemniteTransportImposable: number;
    indemniteResponsabilite: number;
    indemniteLogement: number;
    indemniteSujetion: number;
    indemniteCommunication: number;
    indemniteRepresentation: number;
    transportNonImposable: number;
    primeAnciennete?: number;
}

interface SalaryPeriod {
    startDate: Date;
    endDate: Date;
    structure: SalaryStructure;
}

function getSalaryStructureForEmployee(employee: Employe, history: EmployeeEvent[]): SalaryPeriod[] {
    const salaryEvents = history
        .filter(event => 
            salaryEventTypes.includes(event.eventType as any) &&
            event.details &&
            isValid(parseISO(event.effectiveDate))
        )
        .sort((a, b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime());

    const periods: SalaryPeriod[] = [];
    let lastDate = parseISO(employee.dateEmbauche!);

    // Add initial period from hire date
    const initialStructure: SalaryStructure = {
        baseSalary: employee.baseSalary || 0,
        indemniteTransportImposable: employee.indemniteTransportImposable || 0,
        indemniteResponsabilite: employee.indemniteResponsabilite || 0,
        indemniteLogement: employee.indemniteLogement || 0,
        indemniteSujetion: employee.indemniteSujetion || 0,
        indemniteCommunication: employee.indemniteCommunication || 0,
        indemniteRepresentation: employee.indemniteRepresentation || 0,
        transportNonImposable: employee.transportNonImposable || 0,
        primeAnciennete: employee.primeAnciennete || 0,
    };
    
    salaryEvents.forEach(event => {
        const eventDate = parseISO(event.effectiveDate);
        if (isAfter(eventDate, lastDate)) {
            // Use the "previous" state stored in the event for the period before it
            periods.push({
                startDate: lastDate,
                endDate: eventDate,
                structure: {
                    baseSalary: Number(event.details?.previous_baseSalary || initialStructure.baseSalary),
                    indemniteTransportImposable: Number(event.details?.previous_indemniteTransportImposable || initialStructure.indemniteTransportImposable),
                    indemniteResponsabilite: Number(event.details?.previous_indemniteResponsabilite || initialStructure.indemniteResponsabilite),
                    indemniteLogement: Number(event.details?.previous_indemniteLogement || initialStructure.indemniteLogement),
                    indemniteSujetion: Number(event.details?.previous_indemniteSujetion || initialStructure.indemniteSujetion),
                    indemniteCommunication: Number(event.details?.previous_indemniteCommunication || initialStructure.indemniteCommunication),
                    indemniteRepresentation: Number(event.details?.previous_indemniteRepresentation || initialStructure.indemniteRepresentation),
                    transportNonImposable: Number(event.details?.previous_transportNonImposable || initialStructure.transportNonImposable),
                    primeAnciennete: Number(event.details?.previous_primeAnciennete || initialStructure.primeAnciennete)
                }
            });
            lastDate = eventDate;
        }
    });

    // Add the last period from the last event to infinity
    const lastEvent = salaryEvents[salaryEvents.length - 1];
    periods.push({
        startDate: lastDate,
        endDate: new Date('2999-12-31'),
        structure: lastEvent?.details ? {
            baseSalary: Number(lastEvent.details.baseSalary || 0),
            indemniteTransportImposable: Number(lastEvent.details.indemniteTransportImposable || 0),
            indemniteResponsabilite: Number(lastEvent.details.indemniteResponsabilite || 0),
            indemniteLogement: Number(lastEvent.details.indemniteLogement || 0),
            indemniteSujetion: Number(lastEvent.details.indemniteSujetion || 0),
            indemniteCommunication: Number(lastEvent.details.indemniteCommunication || 0),
            indemniteRepresentation: Number(lastEvent.details.indemniteRepresentation || 0),
            transportNonImposable: Number(lastEvent.details.transportNonImposable || 0),
            primeAnciennete: Number(lastEvent.details.primeAnciennete || 0)
        } : initialStructure
    });

    return periods;
}


function getStructureForDate(date: Date, periods: SalaryPeriod[]): SalaryStructure | null {
    const applicablePeriod = periods.find(p => 
        (isAfter(date, p.startDate) || isEqual(date, p.startDate)) && isBefore(date, p.endDate)
    );
    return applicablePeriod ? applicablePeriod.structure : null;
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
        if (!e.matricule || !e.dateEmbauche || !isValid(parseISO(e.dateEmbauche))) return false;
        const hireDate = parseISO(e.dateEmbauche);
        if (getYear(hireDate) > reportYear) return false;
        if (e.Date_Depart && isValid(parseISO(e.Date_Depart)) && getYear(parseISO(e.Date_Depart)) < reportYear) {
            return false;
        }
        return true;
    });

    if (employeesForYear.length === 0) {
        return { reportData: [], grandTotal: { brut: 0, cnps: 0, monthly: Array(12).fill(0) }, organizationLogos, year: yearStr, error: null };
    }
    
    const allHistoryQuery = query(collectionGroup(db, 'history'));
    const historySnapshot = await getDocs(allHistoryQuery);
    const historyByEmployee = new Map<string, EmployeeEvent[]>();
    historySnapshot.forEach(doc => {
        const pathParts = doc.ref.path.split('/');
        const employeeId = pathParts[1];
        if (!historyByEmployee.has(employeeId)) {
            historyByEmployee.set(employeeId, []);
        }
        historyByEmployee.get(employeeId)!.push({ id: doc.id, ...doc.data() } as EmployeeEvent);
    });
    

    const reportRows: DisaRow[] = [];
    for (const employee of employeesForYear) {
        const monthlySalaries: number[] = [];
        let totalCNPS = 0;
        
        const salaryPeriods = getSalaryStructureForEmployee(employee, historyByEmployee.get(employee.id) || []);

        for (let month = 0; month < 12; month++) {
            const currentDate = new Date(reportYear, month, 15);
            const hireDate = parseISO(employee.dateEmbauche!);
            const departureDate = employee.Date_Depart ? parseISO(employee.Date_Depart) : null;
            
            let grossSalary = 0;
            let cnpsContribution = 0;
            
            const isEmployeeActiveInMonth = 
                (isAfter(currentDate, hireDate) || isEqual(currentDate, hireDate)) &&
                (!departureDate || isBefore(currentDate, departureDate) || isEqual(currentDate, departureDate));

            if (isEmployeeActiveInMonth) {
                const salaryStructure = getStructureForDate(currentDate, salaryPeriods);
                
                if (salaryStructure) {
                    const seniorityInfo = calculateSeniority(employee.dateEmbauche, currentDate.toISOString());
                    let primeAnciennete = salaryStructure.primeAnciennete || 0;

                    if (seniorityInfo.years >= 2 && salaryStructure.primeAnciennete === 0) { // Auto-calculate if not manually set
                        const bonusRate = Math.min(25, seniorityInfo.years);
                        primeAnciennete = salaryStructure.baseSalary * (bonusRate / 100);
                    }

                    grossSalary = salaryStructure.baseSalary + primeAnciennete +
                        salaryStructure.indemniteTransportImposable + salaryStructure.indemniteSujetion +
                        salaryStructure.indemniteCommunication + salaryStructure.indemniteRepresentation +
                        salaryStructure.indemniteResponsabilite + salaryStructure.indemniteLogement;
                    
                    cnpsContribution = employee.CNPS ? (grossSalary * 0.063) : 0;
                }
            }
            
            monthlySalaries.push(Math.round(grossSalary));
            totalCNPS += cnpsContribution;
        }

        const totalBrut = monthlySalaries.reduce((sum, current) => sum + current, 0);

        reportRows.push({
            matricule: employee.matricule,
            name: `${(employee.lastName || '').toUpperCase()} ${employee.firstName || ''}`.trim(),
            cnpsStatus: employee.CNPS || false,
            monthlySalaries: monthlySalaries,
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

    