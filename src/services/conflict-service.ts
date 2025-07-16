
import type { Conflict } from '@/lib/data';
import { conflictData } from '@/lib/data';

export async function getConflicts(): Promise<Conflict[]> {
  return Promise.resolve(conflictData);
}

export async function addConflict(conflictDataToAdd: Omit<Conflict, 'id'>): Promise<Conflict> {
    const newConflict: Conflict = { 
        id: `CNF${Math.floor(Math.random() * 1000)}`, 
        ...conflictDataToAdd 
    };
    conflictData.push(newConflict);
    return Promise.resolve(newConflict);
}
