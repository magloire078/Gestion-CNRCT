export type MajorGroup = 'Akan' | 'Krou' | 'Mandé' | 'Gour (Voltaïque)';

export interface Ethnicity {
  id: string;
  name: string;
  majorGroup: MajorGroup;
  subGroup?: string;
  description?: string;
  geographicalZones?: string[]; // Principales régions d'implantation
}

export const majorGroups: MajorGroup[] = ['Akan', 'Krou', 'Mandé', 'Gour (Voltaïque)'];

export const ethnicities: Ethnicity[] = [
  // ====================
  // GROUPE AKAN
  // ====================
  { id: 'baoule', name: 'Baoulé', majorGroup: 'Akan', subGroup: 'Akan de l\'intérieur', geographicalZones: ['Bélier', 'Gbêkê', 'Iffou', 'N’Zi', 'Moronou'] },
  { id: 'agni', name: 'Agni', majorGroup: 'Akan', subGroup: 'Akan de l\'intérieur', geographicalZones: ['Indénié-Djuablin', 'Moronou', 'Sud-Comoé'] },
  { id: 'abron', name: 'Abron', majorGroup: 'Akan', subGroup: 'Akan de l\'intérieur', geographicalZones: ['Gontougo'] },
  { id: 'attie', name: 'Attié', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['La Mé'] },
  { id: 'abbey', name: 'Abbey', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Agnéby-Tiassa'] },
  { id: 'abidji', name: 'Abidji', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Agnéby-Tiassa'] },
  { id: 'krobou', name: 'Krobou', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Agnéby-Tiassa'] },
  { id: 'ebrie', name: 'Ebrié', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Abidjan', 'Grands-Ponts'] },
  { id: 'aboure', name: 'Abouré', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Sud-Comoé'] },
  { id: 'nzima', name: 'Nzima (Appolo)', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Sud-Comoé'] },
  { id: 'essouma', name: 'Essouma', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Sud-Comoé'] },
  { id: 'adoukrou', name: 'Adioukrou', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Grands-Ponts'] },
  { id: 'alladian', name: 'Alladian', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Grands-Ponts'] },
  { id: 'avikam', name: 'Avikam', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['Grands-Ponts'] },
  { id: 'm-batto', name: 'M\'Batto (Gwa)', majorGroup: 'Akan', subGroup: 'Akan lagunaires', geographicalZones: ['La Mé'] },
  { id: 'koulango_akan', name: 'Koulango', majorGroup: 'Akan', subGroup: 'Akan de l\'intérieur', geographicalZones: ['Gontougo', 'Bounkani'] }, // Parfois classés Gour, très liés aux Abrons

  // ====================
  // GROUPE KROU
  // ====================
  { id: 'bete', name: 'Bété', majorGroup: 'Krou', geographicalZones: ['Gôh', 'Lôh-Djiboua', 'Haut-Sassandra'] },
  { id: 'dida', name: 'Dida', majorGroup: 'Krou', geographicalZones: ['Lôh-Djiboua'] },
  { id: 'we_guere', name: 'Wê (Guéré)', majorGroup: 'Krou', geographicalZones: ['Cavally', 'Guémon'] },
  { id: 'we_wobe', name: 'Wê (Wobé)', majorGroup: 'Krou', geographicalZones: ['Guémon'] },
  { id: 'gouro_krou', name: 'Gouro', majorGroup: 'Krou', geographicalZones: ['Marahoué'] }, // Historiquement Mande du sud, mais fortes influences Krou, classés généralement Mandé du Sud, mais à préciser. Wait, Gouro is Mandé du Sud. I'll move it.
  { id: 'bakwe', name: 'Bakwé', majorGroup: 'Krou', geographicalZones: ['San-Pédro', 'Nawa'] },
  { id: 'kroumen', name: 'Kroumen', majorGroup: 'Krou', geographicalZones: ['San-Pédro'] },
  { id: 'godie', name: 'Godié', majorGroup: 'Krou', geographicalZones: ['Gbôklé', 'Lôh-Djiboua'] },
  { id: 'neyo', name: 'Néyo', majorGroup: 'Krou', geographicalZones: ['Gbôklé'] },
  { id: 'wene', name: 'Wéné', majorGroup: 'Krou', geographicalZones: [] },
  { id: 'niaboua', name: 'Niaboua', majorGroup: 'Krou', geographicalZones: ['Haut-Sassandra'] },
  { id: 'kouzya', name: 'Kouzié', majorGroup: 'Krou', geographicalZones: [] },
  
  // ====================
  // GROUPE MANDE
  // ====================
  // Mandé du Nord
  { id: 'malinke', name: 'Malinké', majorGroup: 'Mandé', subGroup: 'Mandé du Nord', geographicalZones: ['Folon', 'Kabadougou', 'Bafing', 'Béré', 'Worodougou'] },
  { id: 'dioula', name: 'Dioula', majorGroup: 'Mandé', subGroup: 'Mandé du Nord', geographicalZones: ['Poro', 'Tchologo', 'Bagoué', 'Hambol'] },
  { id: 'mahou', name: 'Mahou', majorGroup: 'Mandé', subGroup: 'Mandé du Nord', geographicalZones: ['Bafing'] },
  { id: 'koyaka', name: 'Koyaka', majorGroup: 'Mandé', subGroup: 'Mandé du Nord', geographicalZones: ['Béré'] },
  // Mandé du Sud
  { id: 'dan_yacouba', name: 'Dan (Yacouba)', majorGroup: 'Mandé', subGroup: 'Mandé du Sud', geographicalZones: ['Tonkpi'] },
  { id: 'gouro', name: 'Gouro', majorGroup: 'Mandé', subGroup: 'Mandé du Sud', geographicalZones: ['Marahoué'] },
  { id: 'toura', name: 'Toura', majorGroup: 'Mandé', subGroup: 'Mandé du Sud', geographicalZones: ['Tonkpi'] },
  { id: 'gagou', name: 'Gagou (Gban)', majorGroup: 'Mandé', subGroup: 'Mandé du Sud', geographicalZones: ['Gôh', 'Marahoué'] },
  { id: 'ngain', name: 'N\'Gain', majorGroup: 'Mandé', subGroup: 'Mandé du Sud', geographicalZones: ['Moronou', 'Iffou'] },

  // ====================
  // GROUPE GOUR (VOLTAÏQUE)
  // ====================
  { id: 'senoufo', name: 'Sénoufo', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Poro', 'Tchologo', 'Bagoué'] },
  { id: 'tagbana', name: 'Tagbana', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Hambol'] },
  { id: 'djimini', name: 'Djimini', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Hambol'] },
  { id: 'lobi', name: 'Lobi', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Bounkani'] },
  { id: 'birifor', name: 'Birifor', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Bounkani'] },
  { id: 'koulango_gour', name: 'Koulango', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Gontougo', 'Bounkani'] },
  { id: 'lorhon', name: 'Lorhon', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Bounkani'] },
  { id: 'camara', name: 'Camara', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Bounkani'] },
  { id: 'niarafolo', name: 'Niarafolo', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Tchologo'] },
  { id: 'tiembara', name: 'Tiembara', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Poro'] },
  { id: 'nafana', name: 'Nafana', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Gontougo'] },
  { id: 'degha', name: 'Dégha', majorGroup: 'Gour (Voltaïque)', geographicalZones: ['Gontougo'] },
];

export function getEthnicitiesByMajorGroup(group: MajorGroup): Ethnicity[] {
  return ethnicities.filter(e => e.majorGroup === group).sort((a, b) => a.name.localeCompare(b.name));
}

export function searchEthnicities(query: string): Ethnicity[] {
  const lowerQuery = query.toLowerCase();
  return ethnicities.filter(e => 
    e.name.toLowerCase().includes(lowerQuery) || 
    e.majorGroup.toLowerCase().includes(lowerQuery) ||
    (e.subGroup && e.subGroup.toLowerCase().includes(lowerQuery))
  );
}

export function getEthnicityById(id: string): Ethnicity | undefined {
  return ethnicities.find(e => e.id === id);
}

export function getEthnicityByName(name: string): Ethnicity | undefined {
  return ethnicities.find(e => e.name.toLowerCase() === name.toLowerCase());
}
