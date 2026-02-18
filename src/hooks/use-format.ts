import { useCallback } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export const useFormat = () => {
    /**
     * Formate un montant en FCFA
     * @param amount Le montant à formater
     * @returns Le montant formaté (ex: 1 000 000 FCFA)
     */
    const formatCurrency = useCallback((amount: number | string | undefined | null) => {
        if (amount === undefined || amount === null) return '0 FCFA';

        const value = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(value)) return '0 FCFA';

        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF', // XOF est le code ISO pour le Franc CFA
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value).replace('XOF', 'FCFA').trim();
    }, []);

    /**
     * Formate une date au format court (dd/MM/yyyy)
     * @param dateString La date au format ISO (string) ou un objet Date
     * @returns La date formatée
     */
    const formatDate = useCallback((dateString: string | Date | undefined | null) => {
        if (!dateString) return 'N/A';

        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return 'N/A';

        return format(date, 'dd/MM/yyyy', { locale: fr });
    }, []);

    /**
     * Formate une date au format long (dd MMMM yyyy)
     * @param dateString La date au format ISO (string) ou un objet Date
     * @returns La date formatée
     */
    const formatDateLong = useCallback((dateString: string | Date | undefined | null) => {
        if (!dateString) return 'N/A';

        const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
        if (!isValid(date)) return 'N/A';

        return format(date, 'dd MMMM yyyy', { locale: fr });
    }, []);

    return {
        formatCurrency,
        formatDate,
        formatDateLong,
    };
};
