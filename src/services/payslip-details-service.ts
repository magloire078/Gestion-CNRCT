

import type { Employe, PayslipDetails, PayslipEarning, PayslipDeduction, PayslipEmployerContribution, EmployeeEvent } from '@/lib/data';
import { numberToWords } from '@/lib/utils';
import { getOrganizationSettings } from './organization-service';
import { getEmployeeHistory } from './employee-history-service';
import { differenceInYears, differenceInMonths, differenceInDays, addYears, addMonths, parseISO, isValid, lastDayOfMonth, getDay, isBefore, isEqual, format } from 'date-fns';
import { fr } from 'date-fns/locale';


// Ce service calcule les détails d'un bulletin de paie pour un employé donné à une date précise.
// Note : Les taux d'imposition et de cotisation sont des approximations simplifiées.
// Une application réelle nécessiterait des taux et des réglementations précis et à jour.

/**
 * Calcule l'ancienneté d'un employé à une date donnée.
 * @param hireDateStr - La date d'embauche (chaîne YYYY-MM-DD).
 * @param payslipDateStr - La date du bulletin de paie pour le calcul (chaîne YYYY-MM-DD).
 * @returns Un objet contenant le texte de l'ancienneté et le nombre d'années.
 */
function calculateSeniority(hireDateStr: string | undefined, payslipDateStr: string): { text: string, years: number } {
    if (!hireDateStr || !payslipDateStr) return { text: 'N/A', years: 0 };
    
    const hireDate = parseISO(hireDateStr);
    const payslipDate = parseISO(payslipDateStr);

    if (!isValid(hireDate) || !isValid(payslipDate)) return { text: 'Dates invalides', years: 0 };

    const years = differenceInYears(payslipDate, hireDate);
    const dateAfterYears = addYears(hireDate, years);
    
    const months = differenceInMonths(payslipDate, dateAfterYears);
    const dateAfterMonths = addMonths(dateAfterYears, months);

    const days = differenceInDays(payslipDate, dateAfterMonths);

    return {
        text: `${years} an(s), ${months} mois, ${days} jour(s)`,
        years: years
    };
}

/**
 * Trouve le dernier jour ouvrable d'un mois donné (exclut samedi et dimanche).
 * @param date - La date du mois concerné.
 * @returns Le dernier jour ouvrable.
 */
function getLastWorkingDay(date: Date): Date {
    let lastDay = lastDayOfMonth(date);
    let dayOfWeek = getDay(lastDay); // 0 = Sunday, 6 = Saturday

    if (dayOfWeek === 6) { // Saturday
        lastDay.setDate(lastDay.getDate() - 1);
    } else if (dayOfWeek === 0) { // Sunday
        lastDay.setDate(lastDay.getDate() - 2);
    }
    return lastDay;
}


/**
 * Calcule tous les détails nécessaires pour un bulletin de paie.
 * @param employee - L'objet employé.
 * @param payslipDate - La date de fin de période du bulletin (ex: "2024-12-31").
 * @returns Un objet PayslipDetails complet.
 */
export async function getPayslipDetails(employee: Employe, payslipDate: string): Promise<PayslipDetails> {
    
    // =================================================================
    // ÉTAPE 1 : RÉCUPÉRATION DES DONNÉES DE BASE DE L'EMPLOYÉ
    // =================================================================
    const history = await getEmployeeHistory(employee.id);
    const payslipDateObj = parseISO(payslipDate);

    // Find the most recent salary augmentation before or on the payslip date
    const lastAugmentation = history
        .filter((event): event is EmployeeEvent & { eventType: 'Augmentation' } => 
            event.eventType === 'Augmentation' && 
            (isBefore(parseISO(event.effectiveDate), payslipDateObj) || isEqual(parseISO(event.effectiveDate), payslipDateObj))
        )
        .sort((a, b) => parseISO(b.effectiveDate).getTime() - parseISO(a.effectiveDate).getTime())
        [0];

    const baseSalary = lastAugmentation?.details?.newSalary ? 
        Number(lastAugmentation.details.newSalary) : 
        (employee.baseSalary || 0);

    const seniorityInfo = calculateSeniority(employee.dateEmbauche || '', payslipDate);
    
    // =================================================================
    // ÉTAPE 2 : CALCUL DES GAINS (SALAIRE BRUT)
    // =================================================================

    // --- Prime d'ancienneté ---
    // Calculée automatiquement si non surchargée manuellement dans la fiche de l'employé.
    let primeAnciennete = employee.primeAnciennete || 0;
    if (seniorityInfo.years >= 2 && !employee.primeAnciennete) {
        // Le taux est de 1% par an, plafonné à 25%.
        const bonusRate = Math.min(0.25, (seniorityInfo.years) * 0.01); 
        primeAnciennete = baseSalary * bonusRate;
    }

    // --- Liste de toutes les indemnités (imposables et non imposables) ---
    const indemniteTransportImposable = employee.indemniteTransportImposable || 0;
    const indemniteResponsabilite = employee.indemniteResponsabilite || 0;
    const indemniteLogement = employee.indemniteLogement || 0;
    const indemniteSujetion = employee.indemniteSujetion || 0;
    const indemniteCommunication = employee.indemniteCommunication || 0;
    const indemniteRepresentation = employee.indemniteRepresentation || 0;
    const transportNonImposable = employee.transportNonImposable || 0;
    
    // --- Création de la liste des gains pour l'affichage ---
    const earnings: PayslipEarning[] = [
        { label: 'SALAIRE DE BASE', amount: Math.round(baseSalary) },
        { label: 'PRIME D\'ANCIENNETE', amount: Math.round(primeAnciennete) },
        { label: 'INDEMNITE DE TRANSPORT IMPOSABLE', amount: Math.round(indemniteTransportImposable) },
        { label: 'INDEMNITE DE SUJETION', amount: Math.round(indemniteSujetion) },
        { label: 'INDEMNITE DE COMMUNICATION', amount: Math.round(indemniteCommunication) },
        { label: 'INDEMNITE DE REPRESENTATION', amount: Math.round(indemniteRepresentation) },
        { label: 'INDEMNITE DE RESPONSABILITE', amount: Math.round(indemniteResponsabilite) },
        { label: 'INDEMNITE DE LOGEMENT', amount: Math.round(indemniteLogement) },
    ];

    // --- Calcul du Brut Imposable ---
    // Somme de tous les gains qui sont soumis à l'impôt.
    const brutImposable = earnings.reduce((sum, item) => sum + item.amount, 0);

    // =================================================================
    // ÉTAPE 3 : CALCUL DES RETENUES (DÉDUCTIONS)
    // =================================================================
    
    // --- Calcul des cotisations salariales ---
    const cnps = employee.CNPS ? (brutImposable * 0.063) : 0; // 6.3% du brut imposable si déclaré
    const its = 0;  // Exonéré, mais peut être modifié ici.
    const igr = 0;  // Exonéré, mais peut être modifié ici.
    const cn = 0;   // Exonéré, mais peut être modifié ici.
    
    const deductions: PayslipDeduction[] = [
        { label: 'ITS', amount: Math.round(its) },
        { label: 'CN', amount: Math.round(cn) },
        { label: 'IGR', amount: Math.round(igr) },
        { label: 'CNPS', amount: Math.round(cnps) },
    ];
    
    const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
    
    // =================================================================
    // ÉTAPE 4 : CALCUL DES TOTAUX ET CONTRIBUTIONS PATRONALES
    // =================================================================

    // --- Calcul du Net à Payer ---
    const netAPayer = brutImposable + transportNonImposable - totalDeductions;
    const netAPayerInWords = numberToWords(Math.floor(netAPayer)) + " FRANCS CFA";

    // --- Calcul des contributions de l'employeur ---
    const baseCalculCotisations = brutImposable;
    const isCnpsRegistered = employee.CNPS === true;

    const employerContributions: PayslipEmployerContribution[] = [
        { label: 'ITS PART PATRONALE', base: Math.round(brutImposable), rate: '1,2%', amount: isCnpsRegistered ? Math.round(brutImposable * 0.012) : 0 },
        { label: 'TAXE D\'APPRENTISSAGE', base: Math.round(brutImposable), rate: '0,4%', amount: isCnpsRegistered ? Math.round(brutImposable * 0.004) : 0 },
        { label: 'TAXE FPC', base: Math.round(brutImposable), rate: '0,6%', amount: isCnpsRegistered ? Math.round(brutImposable * 0.006) : 0 },
        { label: 'PRESTATION FAMILIALE', base: Math.min(brutImposable, 70000), rate: '5,75%', amount: isCnpsRegistered ? Math.round(Math.min(brutImposable, 70000) * 0.0575) : 0 },
        { label: 'ACCIDENT DE TRAVAIL', base: Math.min(brutImposable, 70000), rate: '2,0%', amount: isCnpsRegistered ? Math.round(Math.min(brutImposable, 70000) * 0.02) : 0 },
        { label: 'REGIME DE RETRAITE', base: Math.round(brutImposable), rate: '7,7%', amount: isCnpsRegistered ? Math.round(brutImposable * 0.077) : 0 },
    ];
    
    // =================================================================
    // ÉTAPE 5 : FINALISATION DE L'OBJET RETOURNÉ
    // =================================================================
    
    const organizationLogos = await getOrganizationSettings();
    const paymentDateObject = getLastWorkingDay(parseISO(payslipDate));
    const numeroCompteComplet = [employee.CB, employee.CG, employee.numeroCompte, employee.Cle_RIB].filter(Boolean).join(' ');

    const formattedDateEmbauche = employee.dateEmbauche && isValid(parseISO(employee.dateEmbauche)) 
        ? format(parseISO(employee.dateEmbauche), 'dd MMMM yyyy', { locale: fr })
        : 'N/A';

    const employeeInfoWithStaticData: Employe & { numeroCompteComplet?: string } = {
        ...employee,
        dateEmbauche: formattedDateEmbauche,
        cnpsEmployeur: "320491", // Numéro CNPS statique de l'employeur
        anciennete: seniorityInfo.text,
        paymentDate: paymentDateObject.toISOString(),
        paymentLocation: 'Yamoussoukro',
        categorie: employee.categorie || 'Catégorie',
        parts: employee.parts || 1.5, // Nombre de parts fiscales par défaut
        numeroCompteComplet: numeroCompteComplet
    };

    return {
        employeeInfo: employeeInfoWithStaticData,
        earnings,
        deductions,
        totals: {
            brutImposable: Math.round(brutImposable),
            transportNonImposable: { label: 'INDEMNITE DE TRANSPORT NON IMPOSABLE', amount: Math.round(transportNonImposable) },
            netAPayer: Math.round(netAPayer),
            netAPayerInWords,
        },
        employerContributions,
        organizationLogos
    };
}
