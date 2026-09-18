export interface ComiteRegionalMember {
  num: number;
  region: string;
  department: string;
  nom: string;
  prenoms: string;
  nomComplet: string;
  fonctionLocalite: string;
  contacts: string;
  profile: 'Nouveau' | 'Reconduit' | string;
}

import comitesData from '../../data/comites_regionaux_actifs_2026.json';

function normalizeStr(str: string): string {
  return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "").trim();
}

export const comitesRegionaux2026List: ComiteRegionalMember[] = (comitesData as any[]).map((item: any) => ({
  num: item.num,
  region: item.region,
  department: item.department,
  nom: item.lastName,
  prenoms: item.firstName,
  nomComplet: `${item.lastName} ${item.firstName}`.replace(/\s+/g, ' ').trim(),
  fonctionLocalite: item.role || item.qualite || '',
  contacts: item.contact || '',
  profile: item.profile || ''
})).filter(item => item.nomComplet.length > 0);

const comitesByNormName = new Map<string, ComiteRegionalMember>();
const comitesByRegionDept = new Map<string, ComiteRegionalMember[]>();
const memberLookupCache = new Map<string, ComiteRegionalMember | null>();
const chiefStatusCache = new Map<string, ChiefStatusType[]>();

comitesRegionaux2026List.forEach(item => {
  const normFullName = normalizeStr(item.nomComplet);
  const normReverseName = normalizeStr(`${item.prenoms} ${item.nom}`);
  const normNom = normalizeStr(item.nom);
  
  if (normFullName) comitesByNormName.set(normFullName, item);
  if (normReverseName) comitesByNormName.set(normReverseName, item);
  if (normNom && !comitesByNormName.has(normNom)) comitesByNormName.set(normNom, item);

  const regDeptKey = `${normalizeStr(item.region)}_${normalizeStr(item.department)}`;
  if (!comitesByRegionDept.has(regDeptKey)) {
    comitesByRegionDept.set(regDeptKey, []);
  }
  comitesByRegionDept.get(regDeptKey)!.push(item);
});

export function findComiteRegionalMember(nameOrFullName: string, region?: string, department?: string): ComiteRegionalMember | undefined {
  if (!nameOrFullName) return undefined;
  const cacheKey = `${nameOrFullName}_${region || ''}_${department || ''}`;
  if (memberLookupCache.has(cacheKey)) {
    return memberLookupCache.get(cacheKey) || undefined;
  }

  const norm = normalizeStr(nameOrFullName);
  if (!norm) {
    memberLookupCache.set(cacheKey, null);
    return undefined;
  }
  
  if (comitesByNormName.has(norm)) {
    const res = comitesByNormName.get(norm);
    memberLookupCache.set(cacheKey, res || null);
    return res;
  }

  // Tokenize input
  const rawTokens = nameOrFullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(t => t.length >= 2);

  // 1. Direct match or Substring match
  for (let i = 0; i < comitesRegionaux2026List.length; i++) {
    const item = comitesRegionaux2026List[i];
    const itemNorm = normalizeStr(item.nomComplet);
    const itemReverseNorm = normalizeStr(`${item.prenoms} ${item.nom}`);
    if (norm === itemNorm || norm === itemReverseNorm) {
      memberLookupCache.set(cacheKey, item);
      return item;
    }
    if (itemNorm.length >= 5 && (norm.includes(itemNorm) || itemNorm.includes(norm))) {
      memberLookupCache.set(cacheKey, item);
      return item;
    }
  }

  // 2. Token overlap match (e.g. "KAREKE" + "CHRISTOPHE")
  if (rawTokens.length >= 2) {
    for (let i = 0; i < comitesRegionaux2026List.length; i++) {
      const item = comitesRegionaux2026List[i];
      const itemNomNorm = normalizeStr(item.nom);
      const itemPrenomsNorm = normalizeStr(item.prenoms);
      
      const hasNom = rawTokens.some(t => itemNomNorm.includes(t) || t.includes(itemNomNorm));
      const hasPrenom = rawTokens.some(t => itemPrenomsNorm.includes(t) || t.includes(itemPrenomsNorm));
      
      if (hasNom && hasPrenom) {
        memberLookupCache.set(cacheKey, item);
        return item;
      }
    }
  }

  // 3. Region + Department scoped lookup
  if (region || department) {
    const normReg = normalizeStr(region || '');
    const normDept = normalizeStr(department || '');

    for (let i = 0; i < comitesRegionaux2026List.length; i++) {
      const item = comitesRegionaux2026List[i];
      const itemRegNorm = normalizeStr(item.region);
      const itemDeptNorm = normalizeStr(item.department);
      
      const regMatch = !normReg || itemRegNorm.includes(normReg) || normReg.includes(itemRegNorm);
      const deptMatch = !normDept || itemDeptNorm.includes(normDept) || normDept.includes(itemDeptNorm);

      if (regMatch || deptMatch) {
        const itemNomNorm = normalizeStr(item.nom);
        if (itemNomNorm.length >= 3 && rawTokens.some(t => t === itemNomNorm || itemNomNorm.includes(t))) {
          memberLookupCache.set(cacheKey, item);
          return item;
        }
      }
    }
  }

  // 4. Single token match if specific enough
  for (let i = 0; i < comitesRegionaux2026List.length; i++) {
    const item = comitesRegionaux2026List[i];
    const itemNomNorm = normalizeStr(item.nom);
    if (itemNomNorm.length >= 5 && rawTokens.includes(itemNomNorm)) {
      memberLookupCache.set(cacheKey, item);
      return item;
    }
  }

  memberLookupCache.set(cacheKey, null);
  return undefined;
}

export type ChiefStatusType = "Chef de Canton" | "Chef de Tribu" | "Chef de Village" | "Roi" | "Chef de Province" | "Chef Central";

export const ALL_CHIEF_STATUSES: ChiefStatusType[] = [
  "Chef de Canton",
  "Chef de Tribu",
  "Chef de Village",
  "Roi",
  "Chef de Province",
  "Chef Central"
];

export function extractChiefStatuses(text: string): ChiefStatusType[] {
  if (!text) return [];
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const statuses = new Set<ChiefStatusType>();

  if (norm.includes("canton") || norm.includes("caton")) {
    statuses.add("Chef de Canton");
  }
  if (norm.includes("tribu")) {
    statuses.add("Chef de Tribu");
  }
  if (norm.includes("village")) {
    statuses.add("Chef de Village");
  }
  if (norm.includes("roi") || norm.includes("royaume")) {
    statuses.add("Roi");
  }
  if (norm.includes("province")) {
    statuses.add("Chef de Province");
  }
  if (norm.includes("central")) {
    statuses.add("Chef Central");
  }

  // Fallback if mentioned chef but no specific level
  if (statuses.size === 0 && norm.includes("chef")) {
    statuses.add("Chef de Village");
  }

  return Array.from(statuses);
}

export function getMemberChiefStatuses(emp: any): ChiefStatusType[] {
  if (!emp) return [];
  const empKey = emp.id || `${emp.matricule || ''}_${emp.lastName || ''}_${emp.firstName || ''}`;
  if (chiefStatusCache.has(empKey)) {
    return chiefStatusCache.get(empKey)!;
  }

  if (Array.isArray(emp.statutChef) && emp.statutChef.length > 0) {
    chiefStatusCache.set(empKey, emp.statutChef);
    return emp.statutChef;
  }
  if (Array.isArray(emp.titresCoutumiers) && emp.titresCoutumiers.length > 0) {
    chiefStatusCache.set(empKey, emp.titresCoutumiers);
    return emp.titresCoutumiers;
  }
  if (Array.isArray(emp.additionalRoles) && emp.additionalRoles.length > 0) {
    chiefStatusCache.set(empKey, emp.additionalRoles);
    return emp.additionalRoles;
  }
  
  const fullName = `${emp.lastName || ''} ${emp.firstName || ''}`.trim() || emp.name || '';
  const comite = findComiteRegionalMember(fullName, emp.Region || emp.region, emp.Departement || emp.departement);
  if (comite?.fonctionLocalite) {
    const extracted = extractChiefStatuses(comite.fonctionLocalite);
    if (extracted.length > 0) {
      chiefStatusCache.set(empKey, extracted);
      return extracted;
    }
  }
  
  const rawRole = emp.poste || emp.title || emp.role || emp.fonctionLocalite || '';
  const result = extractChiefStatuses(rawRole);
  chiefStatusCache.set(empKey, result);
  return result;
}
