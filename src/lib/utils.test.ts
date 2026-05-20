import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, numberToWords } from './utils';

describe('cn', () => {
  it('concatène les classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });
  it('ignore les valeurs falsy', () => {
    expect(cn('a', false && 'b', null, undefined, 'c')).toBe('a c');
  });
  it('fusionne les conflits Tailwind (twMerge)', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});

describe('formatCurrency', () => {
  it('formate les entiers', () => {
    expect(formatCurrency(1000)).toMatch(/1\s?000 FCFA/);
  });
  it('formate les grands montants', () => {
    expect(formatCurrency(1234567)).toMatch(/1\s?234\s?567 FCFA/);
  });
  it('retourne "0 FCFA" pour null/undefined/NaN', () => {
    expect(formatCurrency(null)).toBe('0 FCFA');
    expect(formatCurrency(undefined)).toBe('0 FCFA');
    expect(formatCurrency('abc')).toBe('0 FCFA');
  });
  it('accepte une string numérique', () => {
    expect(formatCurrency('1500')).toMatch(/1\s?500 FCFA/);
  });
});

describe('numberToWords (français)', () => {
  it('zéro', () => {
    expect(numberToWords(0)).toBe('ZÉRO');
  });
  it('chiffres simples', () => {
    expect(numberToWords(1)).toBe('UN');
    expect(numberToWords(7)).toBe('SEPT');
  });
  it('dizaines', () => {
    expect(numberToWords(10)).toBe('DIX');
    expect(numberToWords(21)).toBe('VINGT ET UN');
    expect(numberToWords(80)).toBe('QUATRE-VINGTS');
    expect(numberToWords(71)).toBe('SOIXANTE-ET-ONZE');
  });
  it('centaines', () => {
    expect(numberToWords(100)).toBe('CENT');
    expect(numberToWords(200)).toBe('DEUX CENTS');
    expect(numberToWords(250)).toBe('DEUX CENT CINQUANTE');
  });
  it('milliers', () => {
    expect(numberToWords(1000)).toBe('MILLE');
    expect(numberToWords(2000)).toBe('DEUX MILLE');
    expect(numberToWords(1234)).toBe('MILLE DEUX CENT TRENTE-QUATRE');
  });
  it('millions et milliards', () => {
    expect(numberToWords(1000000)).toContain('MILLION');
    expect(numberToWords(1000000000)).toContain('MILLIARD');
  });
});
