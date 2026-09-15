
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// French Number to Words Converter
export function numberToWords(num: number): string {
    if (num === 0) return 'ZÉRO';

    const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
    const teens = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
    const tens = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];

    function convert(n: number): string {
        if (n < 10) return units[n];
        if (n < 20) return teens[n - 10];
        if (n < 70) {
            const ten = Math.floor(n / 10);
            const unit = n % 10;
            if (unit === 1 && ten < 8) return tens[ten] + ' ET UN';
            return tens[ten] + (unit > 0 ? '-' + units[unit] : '');
        }
        if (n < 80) { // 70-79
             const unit = n % 10;
             if (unit === 1) return tens[6] + '-ET-ONZE';
             return tens[6] + '-' + teens[n - 70];
        }
        if (n < 100) {
            const ten = Math.floor(n / 10);
            const unit = n % 10;
            if (unit === 0) return tens[ten] + 'S';
            return tens[ten] + (unit > 0 ? '-' + units[unit] : '');
        }
        if (n < 200) {
            return 'CENT' + (n % 100 > 0 ? ' ' + convert(n % 100) : '');
        }
        if (n < 1000) {
            const hundred = Math.floor(n / 100);
            const remainder = n % 100;
            return units[hundred] + ' CENT' + (remainder > 0 ? ' ' + convert(remainder) : 'S');
        }
        return '';
    }

    function processGroup(n: number, groupName: string, isLastGroup: boolean): string {
        if (n === 0) return '';
        let str = '';
        if (n > 1) {
            str = convert(n) + ' ' + groupName;
             str += 'S';
        } else {
            str = 'UN ' + groupName;
        }
        return str;
    }

    const billions = Math.floor(num / 1000000000);
    const millions = Math.floor((num % 1000000000) / 1000000);
    const thousands = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;

    let result = '';
    if (billions > 0) result += processGroup(billions, 'MILLIARD', false) + ' ';
    if (millions > 0) result += processGroup(millions, 'MILLION', false) + ' ';
    if (thousands > 0) {
        if (thousands === 1) result += 'MILLE ';
        else result += convert(thousands).replace(/S$/, '') + ' MILLE ';
    }
    if (remainder > 0) result += convert(remainder);
    
    // Cleanup: remove trailing S from CENT if followed by MILLE/MILLION etc.
    result = result.replace(/CENTS\s(MILLE|MILLION|MILLIARD)/g, 'CENT $1');

    return result.trim().toUpperCase();
}

export function formatCurrency(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null) return "0 FCFA";
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(value)) return "0 FCFA";
    return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA';
}

/**
 * Assure que le titre/poste du signataire sur les documents comporte l'article adéquat ("Le ", "La ", "L'").
 * Ex: "Sécrétaire Général" -> "Le Sécrétaire Général"
 *     "Secrétaire Général" -> "Le Secrétaire Général"
 *     "Directeur de Cabinet" -> "Le Directeur de Cabinet"
 *     "Directrice des RH" -> "La Directrice des RH"
 *     "Auditeur Qualité" -> "L'Auditeur Qualité"
 */
export function formatSignataireTitle(title?: string | null): string {
    if (!title || !title.trim()) return "Le Secrétaire Général";
    const trimmed = title.trim();
    const lower = trimmed.toLowerCase();

    // Si le titre commence déjà par un article ou une formule de délégation, le conserver
    if (
        lower.startsWith("le ") ||
        lower.startsWith("la ") ||
        lower.startsWith("l'") ||
        lower.startsWith("l’") ||
        lower.startsWith("les ") ||
        lower.startsWith("p. ") ||
        lower.startsWith("p.o") ||
        lower.startsWith("pour ")
    ) {
        return trimmed;
    }

    // Gestion des postes féminins courants
    if (
        lower.startsWith("directrice") ||
        lower.startsWith("présidente") ||
        lower.startsWith("presidente") ||
        lower.startsWith("secrétaire adjointe") ||
        lower.startsWith("secretaire adjointe") ||
        lower.startsWith("responsable adjointe") ||
        lower.startsWith("chef de service adjointe")
    ) {
        return `La ${trimmed}`;
    }

    // Gestion des postes débutant par une voyelle ou un 'h'
    if (/^[aeiouyéèêëàâîïôùûh]/i.test(trimmed)) {
        return `L'${trimmed}`;
    }

    return `Le ${trimmed}`;
}
