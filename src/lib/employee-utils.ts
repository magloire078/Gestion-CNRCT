import type { Employe } from "@/types/employee";
import { parseISO, differenceInYears } from "date-fns";

/**
 * Identifie si un employé est un chef membre du Directoire, 
 * membre des comités régionaux, ou membre de l'assemblée des Rois et Chefs Traditionnels.
 */
export function isTraditionalAuthorityOrMember(
    employee?: Partial<Employe> | null,
    departmentName?: string
): boolean {
    if (!employee) return false;

    const poste = (employee.poste || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const dept = (departmentName || employee.department || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const groupe1 = ((employee as any).groupe_1 || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const groupe2 = ((employee as any).groupe_2 || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matricule = (employee.matricule || '').toUpperCase().trim();

    // 1. Membres du Directoire
    const isDirectoire = 
        employee.departmentId === '9ywKFDgVMS86rZLPYhpm' ||
        dept.includes('directoire') ||
        matricule.startsWith('D 0') ||
        matricule.startsWith('D-') ||
        matricule.startsWith('DIR') ||
        poste.includes('directoire') ||
        poste.includes('president') ||
        poste.includes('secretaire general');

    // 2. Membres des Comités Régionaux
    const isComiteRegional = 
        poste.includes('comite regional') ||
        poste.includes('comites regionaux') ||
        dept.includes('comite regional') ||
        dept.includes('comites regionaux') ||
        matricule.startsWith('CR') ||
        groupe1.includes('comite') ||
        groupe2.includes('comite');

    // 3. Membres de l'Assemblée des Rois et Chefs Traditionnels / Rois & Chefs
    const isAssembleeOuChef = 
        poste.includes('assemblee') ||
        poste.includes('roi') ||
        poste.includes('chef') ||
        poste.includes('notable') ||
        poste.includes('reine') ||
        dept.includes('assemblee') ||
        dept.includes('rois') ||
        groupe1.includes('roi') ||
        groupe2.includes('roi') ||
        groupe1.includes('chef') ||
        groupe2.includes('chef') ||
        (Array.isArray(employee.statutChef) && employee.statutChef.length > 0) ||
        (Array.isArray(employee.titresCoutumiers) && employee.titresCoutumiers.length > 0) ||
        Boolean(employee.chiefId);

    return isDirectoire || isComiteRegional || isAssembleeOuChef;
}

/**
 * Calcule l'ancienneté d'un employé en années et mois.
 */
export function calculateTenure(dateEmbauche?: string): { years: number; label: string } {
    if (!dateEmbauche) return { years: 0, label: "Non renseignée" };
    try {
        const d = parseISO(dateEmbauche);
        if (isNaN(d.getTime())) return { years: 0, label: "Non renseignée" };
        const years = Math.max(0, differenceInYears(new Date(), d));
        if (years === 0) return { years: 0, label: "Moins d'un an" };
        if (years === 1) return { years: 1, label: "1 an de service" };
        return { years, label: `${years} ans de service` };
    } catch {
        return { years: 0, label: "Non renseignée" };
    }
}

/**
 * Calcule les totaux bruts et nets estimés à partir des composantes de paie
 */
export function calculatePayrollTotals(employee?: Partial<Employe> | null) {
    if (!employee) return { brut: 0, net: 0, baseSalary: 0, totalIndemnites: 0 };

    const baseSalary = employee.baseSalary || 0;
    const primeAnciennete = employee.primeAnciennete || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const indemniteTransport = employee.indemniteTransportImposable || 0;
    const otherIndemnities = (employee.indemniteResponsabilite || 0) + 
                             (employee.indemniteSujetion || 0) + 
                             (employee.indemniteCommunication || 0) + 
                             (employee.indemniteRepresentation || 0) +
                             (employee.transportNonImposable || 0);

    const totalIndemnites = primeAnciennete + indemniteLogement + indemniteTransport + otherIndemnities;
    const calculatedBrut = baseSalary + totalIndemnites;
    
    const brut = (employee.Salaire_Brut && employee.Salaire_Brut > 0) ? employee.Salaire_Brut : calculatedBrut;
    const net = (employee.Salaire_Net && employee.Salaire_Net > 0) ? employee.Salaire_Net : brut;

    return {
        brut,
        net,
        baseSalary,
        primeAnciennete,
        indemniteLogement,
        indemniteTransport,
        totalIndemnites
    };
}
