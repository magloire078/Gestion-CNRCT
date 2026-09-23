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

    // 0. Statut de chef explicitement attribué dans les données de l'employé
    const hasExplicitChiefData = 
        (Array.isArray(employee.statutChef) && employee.statutChef.length > 0) ||
        (Array.isArray(employee.titresCoutumiers) && employee.titresCoutumiers.length > 0) ||
        Boolean(employee.chiefId);

    if (hasExplicitChiefData) return true;

    const poste = (employee.poste || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const dept = (departmentName || employee.department || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const groupe1 = ((employee as any).groupe_1 || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const groupe2 = ((employee as any).groupe_2 || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const matricule = (employee.matricule || '').toUpperCase().trim();

    // Personnel administratif, technique, support, cabinet ou direction (NE DOIT PAS être considéré comme autorité traditionnelle)
    const isAdministrativeRole = [
        'secretaire', 'secretariat', 'assistant', 'assistante', 'chauffeur', 'conducteur', 
        'garde', 'gendarme', 'agent', 'coursier', 'informaticien', 'technicien', 'cuisinier', 
        'securite', 'gestionnaire', 'charge de', 'chargee de', 'directeur', 'directrice',
        'chef de service', 'chef service', 'chef de bureau', 'chef de cabinet', 'chef secretariat',
        'chef de departement', 'chef de division', 'chef d\'antenne', 'chef d\'equipe', 
        'chef de projet', 'comptable', 'auditeur', 'juriste', 'archiviste', 'standardiste',
        'magasinier', 'receptionniste', 'stagiaire', 'aide de camp', 'protocole'
    ].some(w => poste.includes(w));

    if (isAdministrativeRole) {
        return false;
    }

    // 1. Membres du Directoire (titulaires / présidents du Directoire)
    const isDirectoireMember = 
        (employee.departmentId === '9ywKFDgVMS86rZLPYhpm' || dept.includes('directoire') || matricule.startsWith('D 0') || matricule.startsWith('D-') || matricule.startsWith('DIR')) &&
        (
            poste.includes('membre du directoire') ||
            poste.includes('president du directoire') ||
            poste.includes('vice-president du directoire') ||
            poste === 'president' ||
            poste === 'vice-president' ||
            poste === 'membre directoire' ||
            poste.includes('directoire') ||
            matricule.startsWith('D 0')
        );

    // 2. Membres des Comités Régionaux
    const isComiteRegional = 
        poste.includes('membre du comite regional') ||
        poste.includes('membre comite regional') ||
        poste.includes('comite regional') ||
        poste.includes('comites regionaux') ||
        dept.includes('comite regional') ||
        dept.includes('comites regionaux') ||
        matricule.startsWith('CR') ||
        groupe1.includes('comite regional') ||
        groupe2.includes('comite regional');

    // 3. Assemblée des Rois et Chefs Traditionnels / Titres Coutumiers Spécifiques
    const isTraditionalTitle = 
        poste.includes('chef de canton') ||
        poste.includes('chef de caton') ||
        poste.includes('chef de tribu') ||
        poste.includes('chef de village') ||
        poste.includes('chef de province') ||
        poste.includes('chef superieur') ||
        poste.includes('chef traditionnel') ||
        poste.includes('rois et chefs') ||
        /\b(roi|rois|reine|reines|nanan|notable)\b/i.test(poste) ||
        groupe1.includes('rois & chefs') ||
        groupe2.includes('rois & chefs') ||
        groupe1.includes('rois et chefs') ||
        groupe2.includes('rois et chefs') ||
        dept.includes('rois et chefs') ||
        dept.includes('assemblee des rois');

    return isDirectoireMember || isComiteRegional || isTraditionalTitle;
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
