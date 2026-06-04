import { describe, it, expect } from 'vitest';
import { formatChiefStatus, isChiefCurrentlyInOffice } from './chief-status';

describe('formatChiefStatus', () => {
    it('libellés français pour chaque statut', () => {
        expect(formatChiefStatus('actif')).toBe('En Exercice');
        expect(formatChiefStatus('a_vie')).toBe('À Vie');
        expect(formatChiefStatus('decede')).toBe('Décédé');
        expect(formatChiefStatus('demissionnaire')).toBe('Démissionnaire / Retraité');
        expect(formatChiefStatus('archive')).toBe('Archivé');
    });
    it('fallback "Inconnu" si statut absent', () => {
        expect(formatChiefStatus(undefined)).toBe('Inconnu');
    });
});

describe('isChiefCurrentlyInOffice', () => {
    it('actif et a_vie comptent comme en fonction', () => {
        expect(isChiefCurrentlyInOffice('actif')).toBe(true);
        expect(isChiefCurrentlyInOffice('a_vie')).toBe(true);
    });
    it('decede, demissionnaire et archive ne comptent pas', () => {
        expect(isChiefCurrentlyInOffice('decede')).toBe(false);
        expect(isChiefCurrentlyInOffice('demissionnaire')).toBe(false);
        expect(isChiefCurrentlyInOffice('archive')).toBe(false);
    });
    it('un chef sans statut (legacy) est considéré comme en fonction', () => {
        expect(isChiefCurrentlyInOffice(undefined)).toBe(true);
    });
});
