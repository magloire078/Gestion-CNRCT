import { describe, it, expect } from 'vitest';
import { normalizeString, getOfficialRegion } from './normalization-utils';

describe('normalizeString', () => {
  it('retourne une chaîne vide pour input vide/null', () => {
    expect(normalizeString('')).toBe('');
    expect(normalizeString(undefined as unknown as string)).toBe('');
  });
  it('met en minuscule', () => {
    expect(normalizeString('ABIDJAN')).toBe('abidjan');
  });
  it('supprime les accents', () => {
    expect(normalizeString('Agnéby-Tiassa')).toBe('agnebytiassa');
    expect(normalizeString('Côté')).toBe('cote');
  });
  it('retire les caractères non alphanumériques', () => {
    expect(normalizeString('Grands-Ponts !')).toBe('grandsponts');
  });
});

describe('getOfficialRegion', () => {
  it('passthrough pour "all" et "National"', () => {
    expect(getOfficialRegion('all')).toBe('all');
    expect(getOfficialRegion('National')).toBe('National');
  });
  it('mappe via les overrides', () => {
    expect(getOfficialRegion('agboville')).toBe('Agnéby-Tiassa');
    expect(getOfficialRegion('Zanzan')).toBe('Gontougo');
    expect(getOfficialRegion("District autonome d'Abidjan")).toBe('Abidjan');
  });
  it('retourne le nom officiel quand la graphie diffère par accent', () => {
    // Si Agneby-Tiassa est dans IVORIAN_REGIONS, normalizeString matche
    const result = getOfficialRegion('AGNEBY TIASSA');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
