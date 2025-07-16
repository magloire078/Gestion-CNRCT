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
            return tens[6] + '-ET-' + teens[n - 70];
        }
        if (n < 100) {
            const ten = Math.floor(n / 10);
            const unit = n % 10;
            const link = (ten === 8 && unit > 0) ? '-' : '';
            return tens[ten] + link + (unit > 0 ? units[unit] : (ten === 8 ? 'S' : ''));
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
            if (n % 100 !== 1) str += 'S';
        } else {
            str = (isLastGroup ? 'UN ' : '') + groupName;
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
        else result += convert(thousands) + ' MILLE ';
    }
    if (remainder > 0) result += convert(remainder);

    return result.trim().toUpperCase();
}
