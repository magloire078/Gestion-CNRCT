
"use server";

import { getEmployees } from "@/services/employee-service";
import { getPayslipDetails, type PayslipDetails, calculateSeniority } from "@/services/payslip-details-service";
import { getOrganizationSettings } from "@/services/organization-service";
import type { OrganizationSettings, Employe, EmployeeEvent } from "@/lib/data";
import { parseISO, isValid, isAfter, isBefore, isEqual, getMonth } from 'date-fns';
import { getEmployeeHistory } from "@/services/employee-history-service";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
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

function getSalaryStructureForDate(employee: Employe, effectiveDate: Date, allHistory: Map<string, EmployeeEvent[]>) {
    const employeeHistory = allHistory.get(employee.id) || [];
    
    const relevantEvent = employeeHistory
        .filter(event => 
            salaryEventTypes.includes(event.eventType as any) &&
            event.details &&
            isValid(parseISO(event.effectiveDate)) &&
            (isBefore(parseISO(event.effectiveDate), effectiveDate) || isEqual(parseISO(event.effectiveDate), effectiveDate))
        )
        .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())[0];
    
    if (relevantEvent?.details) {
        return {
            baseSalary: Number(relevantEvent.details.baseSalary || 0),
            indemniteTransportImposable: Number(relevantEvent.details.indemniteTransportImposable || 0),
            indemniteResponsabilite: Number(relevantEvent.details.indemniteResponsabilite || 0),
            indemniteLogement: Number(relevantEvent.details.indemniteLogement || 0),
            indemniteSujetion: Number(relevantEvent.details.indemniteSujetion || 0),
            indemniteCommunication: Number(relevantEvent.details.indemniteCommunication || 0),
            indemniteRepresentation: Number(relevantEvent.details.indemniteRepresentation || 0),
            transportNonImposable: Number(relevantEvent.details.transportNonImposable || 0),
        };
    }
    
    const firstEverEvent = employeeHistory
        .filter(event => salaryEventTypes.includes(event.eventType as any) && event.details)
        .sort((a,b) => parseISO(a.effectiveDate).getTime() - parseISO(b.effectiveDate).getTime())[0];
        
    if (firstEverEvent && firstEverEvent.details) {
        return {
            baseSalary: Number(firstEverEvent.details.previous_baseSalary || employee.baseSalary || 0),
            // Fallback to employee main data for other fields if not in previous state
            indemniteTransportImposable: Number(firstEverEvent.details.previous_indemniteTransportImposable ?? employee.indemniteTransportImposable ?? 0),
            indemniteResponsabilite: Number(firstEverEvent.details.previous_indemniteResponsabilite ?? employee.indemniteResponsabilite ?? 0),
            indemniteLogement: Number(firstEverEvent.details.previous_indemniteLogement ?? employee.indemniteLogement ?? 0),
            indemniteSujetion: Number(firstEverEvent.details.previous_indemniteSujetion ?? employee.indemniteSujetion ?? 0),
            indemniteCommunication: Number(firstEverEvent.details.previous_indemniteCommunication ?? employee.indemniteCommunication ?? 0),
            indemniteRepresentation: Number(firstEverEvent.details.previous_indemniteRepresentation ?? employee.indemniteRepresentation ?? 0),
            transportNonImposable: Number(firstEverEvent.details.previous_transportNonImposable ?? employee.transportNonImposable ?? 0),
        };
    }
    
    return {
        baseSalary: employee.baseSalary || 0,
        indemniteTransportImposable: employee.indemniteTransportImposable || 0,
        indemniteResponsabilite: employee.indemniteResponsabilite || 0,
        indemniteLogement: employee.indemniteLogement || 0,
        indemniteSujetion: employee.indemniteSujetion || 0,
        indemniteCommunication: employee.indemniteCommunication || 0,
        indemniteRepresentation: employee.indemniteRepresentation || 0,
        transportNonImposable: employee.transportNonImposable || 0,
    };
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
        if (hireDate.getFullYear() > reportYear) return false;

        if (e.Date_Depart && isValid(parseISO(e.Date_Depart))) {
            const departureDate = parseISO(e.Date_Depart);
            if (departureDate.getFullYear() < reportYear) return false;
        }

        return true;
    });

    if (employeesForYear.length === 0) {
        return { reportData: [], grandTotal: { brut: 0, cnps: 0, monthly: [] }, organizationLogos, year: yearStr, error: null };
    }
    
    const allHistoryQuery = query(collectionGroup(db, 'history'));
    const historySnapshot = await getDocs(allHistoryQuery);
    const allHistory = new Map<string, EmployeeEvent[]>();
    historySnapshot.forEach(doc => {
        const pathParts = doc.ref.path.split('/');
        const employeeId = pathParts[1];
        if (!allHistory.has(employeeId)) {
            allHistory.set(employeeId, []);
        }
        allHistory.get(employeeId)!.push({ id: doc.id, ...doc.data() } as EmployeeEvent);
    });
    

    const reportRows: DisaRow[] = [];
    for (const employee of employeesForYear) {
        const monthlySalaries: number[] = [];
        let totalCNPS = 0;

        for (let month = 0; month < 12; month++) {
            const currentDate = new Date(reportYear, month, 15);
            const hireDate = parseISO(employee.dateEmbauche!);
            
            let grossSalary = 0;
            let cnpsContribution = 0;
            
            // Only calculate salary if the month is after or during the hiring month
            if (isAfter(currentDate, hireDate) || getMonth(currentDate) === getMonth(hireDate) && currentDate.getFullYear() === hireDate.getFullYear()) {
                const salaryStructure = getSalaryStructureForDate(employee, currentDate, allHistory);
                
                const seniorityInfo = calculateSeniority(employee.dateEmbauche, currentDate.toISOString());
                let primeAnciennete = 0;
                if (seniorityInfo.years >= 2) {
                    const bonusRate = Math.min(25, seniorityInfo.years);
                    primeAnciennete = salaryStructure.baseSalary * (bonusRate / 100);
                }

                grossSalary = salaryStructure.baseSalary + primeAnciennete +
                    salaryStructure.indemniteTransportImposable + salaryStructure.indemniteSujetion +
                    salaryStructure.indemniteCommunication + salaryStructure.indemniteRepresentation +
                    salaryStructure.indemniteResponsabilite + salaryStructure.indemniteLogement;
                
                cnpsContribution = employee.CNPS ? (grossSalary * 0.063) : 0;
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
        reportData: reportRows,
        grandTotal: grandTotal,
        organizationLogos,
        year: yearStr,
        error: null,
    };

  } catch (err) {
    console.error("Error generating DISA report:", err);
    return { ...prevState, error: "Impossible de générer le rapport. Une erreur inattendue est survenue." };
  }
}
