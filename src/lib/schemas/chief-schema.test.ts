import { describe, it, expect } from 'vitest';
import { cnrctRegistrationNumberSchema, chiefRoleSchema, chiefInputSchema } from './chief-schema';

describe('cnrctRegistrationNumberSchema', () => {
    it('accepte un format CNRCT-XXXX', () => {
        expect(cnrctRegistrationNumberSchema.safeParse('CNRCT-1234').success).toBe(true);
        expect(cnrctRegistrationNumberSchema.safeParse('CNRCT/2025/001').success).toBe(true);
    });
    it('accepte un code alphanumérique alternatif', () => {
        expect(cnrctRegistrationNumberSchema.safeParse('AB-1234').success).toBe(true);
    });
    it('accepte une chaîne vide ou undefined (optionnel)', () => {
        expect(cnrctRegistrationNumberSchema.safeParse('').success).toBe(true);
        expect(cnrctRegistrationNumberSchema.safeParse(undefined).success).toBe(true);
    });
    it('refuse un code trop court', () => {
        expect(cnrctRegistrationNumberSchema.safeParse('AB').success).toBe(false);
    });
});

describe('chiefRoleSchema', () => {
    it('valide les rôles officiels', () => {
        expect(chiefRoleSchema.safeParse('Roi').success).toBe(true);
        expect(chiefRoleSchema.safeParse('Chef de canton').success).toBe(true);
    });
    it('refuse un rôle inconnu', () => {
        expect(chiefRoleSchema.safeParse('Empereur').success).toBe(false);
    });
});

describe('chiefInputSchema', () => {
    const minimal = {
        name: 'Nanan Atse',
        title: 'Roi',
        role: 'Roi' as const,
        region: 'Sud-Comoé',
        department: 'Aboisso',
        subPrefecture: 'Aboisso',
        village: 'Aboisso',
        contact: '+225 07 00 00 00 00',
        bio: '',
        photoUrl: '',
    };
    it('valide un chef minimal correct', () => {
        expect(chiefInputSchema.safeParse(minimal).success).toBe(true);
    });
    it('refuse un email mal formé', () => {
        expect(chiefInputSchema.safeParse({ ...minimal, email: 'pas-un-email' }).success).toBe(false);
    });
    it('accepte un email vide ou absent', () => {
        expect(chiefInputSchema.safeParse({ ...minimal, email: '' }).success).toBe(true);
        expect(chiefInputSchema.safeParse(minimal).success).toBe(true);
    });
    it('exige les champs obligatoires (region, village, contact)', () => {
        expect(chiefInputSchema.safeParse({ ...minimal, region: '' }).success).toBe(false);
        expect(chiefInputSchema.safeParse({ ...minimal, village: '' }).success).toBe(false);
        expect(chiefInputSchema.safeParse({ ...minimal, contact: '' }).success).toBe(false);
    });
});
