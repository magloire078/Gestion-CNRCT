import districtsData from '../../data/districts.json';
import regionsData from '../../data/regions.json';
import departementsData from '../../data/departements.json';
import sousPrefecturesData from '../../data/sous_prefectures.json';

// Types
export interface District {
  id: string;
  nom: string;
  type: string;
}

export interface Region {
  id: string;
  district_id: string;
  nom: string;
  chef_lieu: string;
}

export interface Departement {
  id: string;
  region_id: string;
  nom: string;
}

export interface SousPrefecture {
  id: string;
  departement_id: string;
  nom: string;
  localites: string[];
}

export const districts = districtsData as District[];
export const regions = regionsData as Region[];
export const departements = departementsData as Departement[];
export const sousPrefectures = sousPrefecturesData as SousPrefecture[];

export function getCompleteTerritorialTree() {
  return districts.map(district => {
    const districtRegions = regions.filter(r => r.district_id === district.id).map(region => {
      const regionDepts = departements.filter(d => d.region_id === region.id).map(dept => {
        const deptSPs = sousPrefectures.filter(sp => sp.departement_id === dept.id);
        return { ...dept, sous_prefectures: deptSPs };
      });
      return { ...region, departements: regionDepts };
    });
    return { ...district, regions: districtRegions };
  });
}

// Backward compatibility with legacy structure
export interface LegacyDivision {
  [region: string]: {
    [department: string]: {
      [subPrefecture: string]: string[];
    };
  };
}

export function buildLegacyDivisions(): LegacyDivision {
  const divisions: LegacyDivision = {};
  
  regions.forEach(region => {
    divisions[region.nom] = {};
    const regionDepts = departements.filter(d => d.region_id === region.id);
    
    regionDepts.forEach(dept => {
      divisions[region.nom][dept.nom] = {};
      const deptSPs = sousPrefectures.filter(sp => sp.departement_id === dept.id);
      
      deptSPs.forEach(sp => {
        divisions[region.nom][dept.nom][sp.nom] = sp.localites;
      });
    });
  });
  
  return divisions;
}
