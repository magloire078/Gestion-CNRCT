import { describe, it, expect } from 'vitest';
import { villageInputSchema } from './village-schema';

const baseValid = {
    name: 'Yaakro',
    region: 'Bélier',
    department: 'Yamoussoukro',
    subPrefecture: 'Yamoussoukro',
};

describe('villageInputSchema', () => {
    it('valide un village minimal', () => {
        expect(villageInputSchema.safeParse(baseValid).success).toBe(true);
    });
    it('exige les champs obligatoires', () => {
        expect(villageInputSchema.safeParse({ ...baseValid, name: '' }).success).toBe(false);
        expect(villageInputSchema.safeParse({ ...baseValid, region: '' }).success).toBe(false);
    });
    it('refuse latitude/longitude hors plage', () => {
        expect(villageInputSchema.safeParse({ ...baseValid, latitude: 95 }).success).toBe(false);
        expect(villageInputSchema.safeParse({ ...baseValid, longitude: 200 }).success).toBe(false);
    });
    it('accepte des coordonnées valides', () => {
        expect(villageInputSchema.safeParse({ ...baseValid, latitude: 6.82, longitude: -5.27 }).success).toBe(true);
    });
    it('refuse une population négative', () => {
        expect(villageInputSchema.safeParse({ ...baseValid, population: -1 }).success).toBe(false);
    });
    it('refuse un developmentScore hors [0, 100]', () => {
        expect(villageInputSchema.safeParse({ ...baseValid, developmentScore: 150 }).success).toBe(false);
        expect(villageInputSchema.safeParse({ ...baseValid, developmentScore: -10 }).success).toBe(false);
        expect(villageInputSchema.safeParse({ ...baseValid, developmentScore: 75 }).success).toBe(true);
    });
});
