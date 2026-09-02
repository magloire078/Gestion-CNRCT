import { getEmployees } from './employee-service';
import { getChiefs } from './chief-service';
import { getConflicts } from './conflict-service';
import { getMissions } from './mission-service';
import { getVillages } from './village-service';
import { getHeritageAssets } from './heritage-service';

export type SearchResultType = 'employee' | 'chief' | 'conflict' | 'mission' | 'village' | 'heritage';

export interface SearchResult {
    id: string;
    type: SearchResultType;
    title: string;
    subtitle?: string;
    url: string;
    icon?: string;
}

export async function globalSearch(queryText: string, hasPermission: (p: string) => boolean): Promise<SearchResult[]> {
    if (!queryText || queryText.length < 2) return [];
    
    const lowerQuery = queryText.toLowerCase();
    const results: SearchResult[] = [];
    
    // Execute all permitted fetch operations in parallel
    const promises: Promise<void>[] = [];

    // 1. Employees
    if (hasPermission('employees:read')) {
        promises.push(
            getEmployees().then(employees => {
                const matches = employees.filter(e => 
                    (e.name?.toLowerCase() || '').includes(lowerQuery) ||
                    (e.matricule?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(e => {
                    results.push({
                        id: e.id!,
                        type: 'employee',
                        title: e.name || 'Employé inconnu',
                        subtitle: `${e.matricule || ''} - ${e.poste || ''}`,
                        url: `/employees/${e.id}`
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch employees", e))
        );
    }

    // 2. Chiefs
    if (hasPermission('chiefs:read')) {
        promises.push(
            getChiefs().then(chiefs => {
                const matches = chiefs.filter(c => 
                    (c.name?.toLowerCase() || '').includes(lowerQuery) ||
                    (c.village?.toLowerCase() || '').includes(lowerQuery) ||
                    (c.region?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(c => {
                    results.push({
                        id: c.id!,
                        type: 'chief',
                        title: c.name || 'Chef inconnu',
                        subtitle: `${c.role || 'Chef'} - ${c.village || c.region || ''}`,
                        url: `/chiefs/${c.id}`
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch chiefs", e))
        );
    }

    // 3. Conflicts
    if (hasPermission('conflicts:read')) {
        promises.push(
            getConflicts().then(conflicts => {
                const matches = conflicts.filter(c => 
                    (c.title?.toLowerCase() || '').includes(lowerQuery) ||
                    (c.region?.toLowerCase() || '').includes(lowerQuery) ||
                    (c.parties?.join(' ')?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(c => {
                    results.push({
                        id: c.id!,
                        type: 'conflict',
                        title: c.title || 'Conflit sans titre',
                        subtitle: `${c.region || ''} - ${c.status || ''}`,
                        url: `/conflicts/${c.id}`
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch conflicts", e))
        );
    }

    // 4. Missions
    if (hasPermission('missions:read')) {
        promises.push(
            getMissions().then(missions => {
                const matches = missions.filter(m => 
                    (m.title?.toLowerCase() || '').includes(lowerQuery) ||
                    (m.destination?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(m => {
                    results.push({
                        id: m.id!,
                        type: 'mission',
                        title: m.title || 'Mission',
                        subtitle: m.destination || '',
                        url: `/missions/${m.id}`
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch missions", e))
        );
    }

    // 5. Villages
    if (hasPermission('villages:read')) {
        promises.push(
            getVillages().then(villages => {
                const matches = villages.filter(v => 
                    (v.name?.toLowerCase() || '').includes(lowerQuery) ||
                    (v.subPrefecture?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(v => {
                    results.push({
                        id: v.id!,
                        type: 'village',
                        title: v.name || 'Village',
                        subtitle: `${v.subPrefecture || ''} - ${v.department || ''}`,
                        url: `/villages` // Assuming no detail page
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch villages", e))
        );
    }

    // 6. Heritage (Patrimoine)
    if (hasPermission('heritage:read')) {
        promises.push(
            getHeritageAssets().then(assets => {
                const matches = assets.filter(a => 
                    (a.name?.toLowerCase() || '').includes(lowerQuery) ||
                    (a.category?.toLowerCase() || '').includes(lowerQuery)
                ).slice(0, 5);
                
                matches.forEach(a => {
                    results.push({
                        id: a.id!,
                        type: 'heritage',
                        title: a.name || 'Patrimoine',
                        subtitle: a.category || '',
                        url: `/heritage/${a.id}`
                    });
                });
            }).catch(e => console.warn("Global Search: Failed to fetch heritage", e))
        );
    }

    await Promise.all(promises);

    return results;
}
