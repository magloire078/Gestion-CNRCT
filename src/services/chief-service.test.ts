import { describe, it, expect } from 'vitest';
import { buildCurrentChiefIndex } from './chief-service';
import type { Chief } from '@/types/chief';

const mkChief = (overrides: Partial<Chief>): Chief => ({
    id: 'c1',
    name: 'X',
    title: 'Chef',
    role: 'Chef de Village',
    region: 'R',
    department: 'D',
    subPrefecture: 'SP',
    village: 'V',
    contact: '+225',
    bio: '',
    photoUrl: '',
    ...overrides,
});

describe('buildCurrentChiefIndex', () => {
    it('ignore les chefs sans villageId', () => {
        const idx = buildCurrentChiefIndex([
            mkChief({ id: 'c1' }),
            mkChief({ id: 'c2', villageId: 'v2', status: 'actif' }),
        ]);
        expect(idx.size).toBe(1);
        expect(idx.get('v2')?.id).toBe('c2');
    });

    it('ignore les chefs archivés, décédés et démissionnaires', () => {
        const idx = buildCurrentChiefIndex([
            mkChief({ id: 'c1', villageId: 'v1', status: 'archive' }),
            mkChief({ id: 'c2', villageId: 'v2', status: 'decede' }),
            mkChief({ id: 'c3', villageId: 'v3', status: 'demissionnaire' }),
        ]);
        expect(idx.size).toBe(0);
    });

    it('considère les chefs à vie comme en fonction', () => {
        const idx = buildCurrentChiefIndex([
            mkChief({ id: 'c1', villageId: 'v1', status: 'a_vie' }),
        ]);
        expect(idx.get('v1')?.id).toBe('c1');
    });

    it('en cas de plusieurs chefs actifs pour le même village, garde le premier', () => {
        const idx = buildCurrentChiefIndex([
            mkChief({ id: 'c1', villageId: 'v1', status: 'actif' }),
            mkChief({ id: 'c2', villageId: 'v1', status: 'actif' }),
        ]);
        expect(idx.get('v1')?.id).toBe('c1');
    });

    it('accepte les chefs sans status (legacy)', () => {
        const idx = buildCurrentChiefIndex([
            mkChief({ id: 'c1', villageId: 'v1' }),
        ]);
        expect(idx.get('v1')?.id).toBe('c1');
    });

    it('O(n) — indexe correctement un volume', () => {
        const chiefs: Chief[] = [];
        for (let i = 0; i < 1000; i++) {
            chiefs.push(mkChief({ id: `c${i}`, villageId: `v${i}`, status: 'actif' }));
        }
        const idx = buildCurrentChiefIndex(chiefs);
        expect(idx.size).toBe(1000);
    });
});
