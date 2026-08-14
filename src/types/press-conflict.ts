export const PRESS_CONFLICT_CATEGORIES = [
  "Conflit",
  "Fait signalé",
  "Alerte",
  "Tension communautaire",
  "Autre"
] as const;
export type PressConflictCategory = typeof PRESS_CONFLICT_CATEGORIES[number];

export const PRESS_CONFLICT_TYPES = [
  "Foncier",
  "Affrontement intercommunautaire",
  "Désignation des chefs",
  "Problème de justice",
  "Orpaillage",
  "Succession",
  "Politique",
  "Affaires civiles",
  "Autre"
] as const;
export type PressConflictType = typeof PRESS_CONFLICT_TYPES[number];

export const PRESS_CONFLICT_STATUSES = [
  "En cours",
  "À suivre",
  "Résolu",
  "Résolu (juridiquement)",
  "Résolu (médiation)",
  "Résolu (calme revenu)",
  "En cours (appel)",
  "Clos (décès)",
  "Clos (drame)",
  "Classé sans suite"
] as const;
export type PressConflictStatus = typeof PRESS_CONFLICT_STATUSES[number];

export interface PressConflict {
  id: string;
  orderNumber?: number; // N°
  trackingId?: string; // Ex: VEILLE-2026-001
  dateOfFacts: string; // Date des faits
  source: string; // Source / Journal
  region: string; // Région
  locality: string; // Localité
  department?: string; // Département
  subPrefecture?: string; // Sous-préfecture
  latitude?: number; // Latitude
  longitude?: number; // Longitude
  category: PressConflictCategory; // Catégorie
  conflictType: PressConflictType; // Type de conflit
  description: string; // Description des faits
  status: PressConflictStatus; // Statut du suivi
  observations?: string; // Observations
  attachmentUrl?: string; // Lien pièce jointe / scan
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_PRESS_CONFLICTS: Omit<PressConflict, "id">[] = [
  {
    orderNumber: 1,
    trackingId: "VEILLE-2026-001",
    dateOfFacts: "09/04/2026",
    source: "L'Avenir n°1417",
    region: "Région du Sud-Comoé",
    locality: "Grand-Bassam",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Cas sensible : un souverain en exercice, débouté jusqu'au Conseil d'État, continuerait d'occuper des terres litigieuses au nom de l'étendue de son règne. L'inexécution des décisions de justice est ici le vrai problème elle expose l'institution traditionnelle au reproche de se placer au-dessus du droit, dans un dossier qui recoupe directement le thème « problème de justice ».",
    status: "En cours",
    observations: "Litige foncier opposant des propriétaires terriens du village de Modeste"
  },
  {
    orderNumber: 2,
    trackingId: "VEILLE-2026-002",
    dateOfFacts: "16/07/2026",
    source: "Notre Voie n°7950",
    region: "Région du Guémon",
    locality: "Gblapleu / Guitrozon (Duékoué)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Différend sur les limites territoriales entre les deux villages. Les cultivateurs de Gblapleu dénoncent des agressions et la destruction/confiscation de leurs récoltes par des individus de Guitrozon qui revendiquent des droits coutumiers. Le chef de Gblapleu, Koué Antoine, alerte sur un climat d'insécurité permanent.",
    status: "En cours",
    observations: "Risque d'escalade sans médiation. Contexte national de sécurisation du foncier rural (AFOR, PRESFOR)."
  },
  {
    orderNumber: 3,
    trackingId: "VEILLE-2026-003",
    dateOfFacts: "16/07/2026",
    source: "Notre Voie n°7950",
    region: "District Autonome d'Abidjan",
    locality: "Éloka-To (Bingerville)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Ventes illicites de centaines de terrains du lotissement « Ato Lagoona » par Akosso Abé Jacob, ex porte-parole de la chefferie Dougbo, qui continuait de signer des attestations d'attribution alors que le pouvoir de sa génération avait pris fin en 2020. Écroué depuis le 27/05/2026 pour faux et usage de faux, plainte de la chefferie Tchagba. Préjudice estimé à plusieurs centaines de millions FCFA.",
    status: "En cours",
    observations: "Recoupe désignation des chefs (usurpation) et justice (détention, procédure pénale)."
  },
  {
    orderNumber: 4,
    trackingId: "VEILLE-2026-004",
    dateOfFacts: "03-14/07/2026",
    source: "Le Patriote n°7942 ; Le Nouveau Réveil n°7139 ; L'Inter n°8400",
    region: "District Autonome d'Abidjan",
    locality: "Bidjan-Té / Attecoubé Village",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Crise ouverte à la chefferie : destitution du chef Ahizi Eliam Djagoua Guy prononcée le 03/07/2026 par les contestataires (doyen Nanan Biégot Laurent, porte-parole Akébi Jean-Baptiste) pour gestion opaque des terres et baux signés (Frankgain, Addoha, Djé Loukou) sans validation de la notabilité. Le chef conteste la légitimité de la destitution (coutume Tchaman) et affirme qu'Akébi a été suspendu dès mars 2026 pour faux et usage de faux ; justice saisie des deux côtés.",
    status: "En cours",
    observations: "Versions frontalement opposées ; recoupe désignation des chefs et justice."
  },
  {
    orderNumber: 5,
    trackingId: "VEILLE-2026-005",
    dateOfFacts: "07/07/2026",
    source: "Fraternité Matin n°18448",
    region: "District Autonome d'Abidjan",
    locality: "M'Badon / Koumassi Campement",
    category: "Conflit",
    conflictType: "Foncier",
    description: "La chefferie de M'Badon revendique la propriété des terres du quartier Campement, acquises selon elle par les ancêtres au XIXe siècle. Des destructions d'habitations ont eu lieu (Procureur saisi) ; le 04/07, la notabilité a remis 4 tonnes de vivres aux déguerpis.",
    status: "En cours",
    observations: "La chefferie s'en remet aux magistrats sur les destructions."
  },
  {
    orderNumber: 6,
    trackingId: "VEILLE-2026-006",
    dateOfFacts: "22/06/2026",
    source: "Soir Info n°9482",
    region: "District Autonome d'Abidjan",
    locality: "Port-Bouët (Vridi 3, Vridi Canal, Cité Perdue, Toviato, Alaya)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Démolitions massives menées depuis le 03/06/2026 par le District autonome d'Abidjan ; les chefs de communautés (porte-parole Nanan Jean Martin Abolé N'Gbé) dénoncent des milliers de familles à la rue en saison des pluies, mairie écartée de la planification.",
    status: "En cours",
    observations: "Demandes : arrêt des démolitions sans relogement, plateforme de dialogue."
  },
  {
    orderNumber: 7,
    trackingId: "VEILLE-2026-007",
    dateOfFacts: "11/05/2026",
    source: "L'Inter n°8351",
    region: "Région de l'Agnéby-Tiassa",
    locality: "Bodo (commune de N'Douci)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Violences le 09/05/2026 lors de la visite du ministre Pierre Dimba pour le projet de Plateforme économique au PK 108 : 2 gendarmes blessés, 50 interpellations, résidence du chef du village incendiée, ministre exfiltré. Populations spoliées de leurs terres par le projet.",
    status: "En cours",
    observations: ""
  },
  {
    orderNumber: 8,
    trackingId: "VEILLE-2026-008",
    dateOfFacts: "12/05/2026",
    source: "L'Inter n°8352",
    region: "Région du Gôh",
    locality: "Gagnoa / Gnagbodougnoa (30 villages)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Chefferies et populations de 30 villages exigent des comptes face à la société Lagune Exploration Afrique, dont le sous-traitant chinois IMR a démarré des forages sans concertation locale. Arrêt forcé des travaux depuis un mois ; mea culpa public du PDG Moumini Bictogo.",
    status: "En cours",
    observations: "Revendications : rencontres village par village, indemnisation, protection des sites sacrés."
  },
  {
    orderNumber: 9,
    trackingId: "VEILLE-2026-009",
    dateOfFacts: "16/06/2026",
    source: "L'Inter n°8379",
    region: "À vérifier (région non précisée)",
    locality: "Lopouafla",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Le chef du village You Bi Trazié et le géomètre Goulizan Bi Irié répondent aux accusations du colonel Jean-Claude Tibé (appropriation de terres, profanation de cimetière) dans le cadre d'un lotissement. Une décision de justice exécutoire reconnaît les droits de la famille Bonan sur les parcelles contestées.",
    status: "En cours",
    observations: "Versions contradictoires ; recoupe justice."
  },
  {
    orderNumber: 10,
    trackingId: "VEILLE-2026-010",
    dateOfFacts: "23/06/2026",
    source: "Notre Voie n°7933",
    region: "Région du Gbôklé",
    locality: "Canton Kébé, 10 villages riverains du CNRA (Sassandra)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Dix villages réclament le déclassement des terres occupées par le CNRA depuis 115 ans, qu'ils qualifient d'expropriation. Le CNRA maintient qu'elles relèvent du domaine public. Le chef de Kadrokpa 1 dénonce aussi l'orpaillage illégal sur le fleuve et les campements érigés en villages sans consultation des chefs coutumiers.",
    status: "En cours",
    observations: "Marches et interruptions d'activité du centre ; recoupe orpaillage et désignation des chefs."
  },
  {
    orderNumber: 11,
    trackingId: "VEILLE-2026-011",
    dateOfFacts: "06/05/2026 (faits 2022)",
    source: "Le Mandat n°4327",
    region: "Région du Sud-Comoé",
    locality: "Assomlan",
    category: "Conflit",
    conflictType: "Foncier",
    description: "En 2022, 3 hectares de mangrove rasés sur les terres coutumières d'Assomlan pour remblayage. Frayère principale détruite, revenus de pêche passés de 3-4M FCFA/an à moins de 400 000 FCFA. Le Conseil d'État a annulé le certificat foncier à l'origine du désastre.",
    status: "Résolu (juridiquement)",
    observations: "Dommage écologique irréversible malgré la victoire juridique."
  },
  {
    orderNumber: 12,
    trackingId: "VEILLE-2026-012",
    dateOfFacts: "03/07/2026",
    source: "Fraternité Matin n°18445",
    region: "District Autonome d'Abidjan",
    locality: "Elokato (Bingerville)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Un cratère d'érosion, provoqué selon la chefferie par le bitumage mal conçu du tronçon Bingerville-Elokato-Ebra (fin 2021), menace d'isoler ce village-presqu'île de 3 000 habitants. Cimetière à une dizaine de mètres du ravin ; école et dispensaire difficilement accessibles.",
    status: "En cours",
    observations: "Appel direct au Président de la République pour remblayage et caniveaux."
  },
  {
    orderNumber: 13,
    trackingId: "VEILLE-2026-013",
    dateOfFacts: "10/07/2026",
    source: "L'Inter n°8400",
    region: "District Autonome d'Abidjan",
    locality: "Elokaté",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Le patriarche Nanan Akomian Akandan (101 ans) relance un litige foncier avec la société Palmafrique sur plus de 1 260 hectares, mis à disposition de l'État dans les années 1960 avec rétrocession promise jamais honorée. Palmafrique conteste et qualifie l'affaire de « vieux dossier ».",
    status: "En cours",
    observations: "À vérifier : les faits sur l'accord verbal des années 1960 ne reposent que sur les déclarations du patriarche, non confirmés indépendamment."
  },
  {
    orderNumber: 14,
    trackingId: "VEILLE-2026-014",
    dateOfFacts: "16/06/2026 (faits en cours)",
    source: "Le Mandat n°4353",
    region: "District Autonome d'Abidjan",
    locality: "Anan (Bingerville)",
    category: "Conflit",
    conflictType: "Foncier",
    description: "Un ex-député de Touba, Dr Sako Mamadou, accusé d'avoir extorqué plus de 125 millions FCFA à la chefferie d'Anan en se faisant passer pour un émissaire du chef de l'État lors d'un conflit de succession coutumière, avec attestations de vente de terres antidatées. Un membre du comité foncier local est en détention depuis octobre 2025.",
    status: "En cours",
    observations: "Recoupe désignation des chefs et justice ; procédé reproduit dans d'autres villages Atchan."
  },
  {
    orderNumber: 15,
    trackingId: "VEILLE-2026-015",
    dateOfFacts: "25/04 au 08/07/2026 (dossier continu)",
    source: "L'Inter n°8341, n°8352, n°8382, n°8405",
    region: "Région du Cavally",
    locality: "Forêt classée de Goin-Débé (Guiglo)",
    category: "Conflit",
    conflictType: "Affrontement intercommunautaire",
    description: "Crise à quatre acteurs (groupe Ehousou Fabrice, Alliance Wê ~9000 ha revendiqués, riverains-ONG, « frustrés »). Médiation le 25/04 par Sa Majesté Guidy 5, rencontre d'urgence le 02/05 (mise en garde contre une « Alliance Wê » visant à chasser les allochtones par la force), comité de pilotage annoncé le 18/06 avec Palmci comme partenaire agroforestier, puis affrontements les 6-8/07/2026 : au moins 9 blessés, cases incendiées, camp de l'Alliance Wê brûlé. Gendarmerie intervenue.",
    status: "En cours",
    observations: "Dossier le plus documenté du corpus ; recoupe foncier (plantations en forêt classée) et orpaillage (recrudescence signalée par le ministre)."
  },
  {
    orderNumber: 16,
    trackingId: "VEILLE-2026-016",
    dateOfFacts: "21-26/06/2026",
    source: "Fraternité Matin n°18436, n°18439",
    region: "Région de la Bagoué",
    locality: "Kouto / Samorossoba",
    category: "Conflit",
    conflictType: "Affrontement intercommunautaire",
    description: "Conflit foncier ancien (parcelle rizicole de 1 000 hectares sur les berges du fleuve Bagoué) ayant dégénéré le 21/06 en affrontements à la machette : une vingtaine de blessés. Calme revenu 5 jours après (patrouilles mixtes, sous-préfet sur le terrain), populations invitées à attendre la décision de justice.",
    status: "En cours",
    observations: "Des heurts similaires avaient eu lieu en 2025 ; conflit qui s'embrase à chaque campagne agricole."
  },
  {
    orderNumber: 17,
    trackingId: "VEILLE-2026-017",
    dateOfFacts: "25/04/2026",
    source: "L'Inter n°8341",
    region: "Région de l'Iffou",
    locality: "Kouassi-Diétèkro (près de Kongoti)",
    category: "Conflit",
    conflictType: "Affrontement intercommunautaire",
    description: "Une bagarre entre orpailleurs clandestins a dégénéré en conflit opposant autochtones et allogènes. Plusieurs blessés dans les deux camps ; calme ramené par l'escadron mobile de la gendarmerie.",
    status: "Résolu (calme revenu)",
    observations: "Recoupe orpaillage ; la région connaît des tensions récurrentes liées à l'orpaillage clandestin et à la drogue."
  },
  {
    orderNumber: 18,
    trackingId: "VEILLE-2026-018",
    dateOfFacts: "08/06/2026",
    source: "Soir Info n°9479",
    region: "District Autonome d'Abidjan",
    locality: "Île Boulay 2 (Séguikro)",
    category: "Conflit",
    conflictType: "Affrontement intercommunautaire",
    description: "Tensions entre habitants et communauté béninoise après l'agression à l'arme blanche du ressortissant béninois Lokossou Promice dans la nuit du 08/06. Démarche d'apaisement du CCBCI auprès du chef central Emmanuel Kouao Kouao, qui a posé une condition : laisser la justice faire son travail.",
    status: "En cours",
    observations: "Origine : différend familial ayant dégénéré ; dimension communautaire à nuancer."
  },
  {
    orderNumber: 19,
    trackingId: "VEILLE-2026-019",
    dateOfFacts: "25/03/2026 (décision)",
    source: "Le Mandat n°4316",
    region: "District Autonome d'Abidjan",
    locality: "Yopougon-Kouté",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Le Conseil d'État a annulé l'arrêté préfectoral nommant Apiti Apiti Clément chef du village, la procédure ayant violé les us et coutumes du peuple Atchan (surclassement sans consensus). Reprise du processus de désignation ; transition sous l'autorité du Nanan du village et du doyen de la génération Tchagba.",
    status: "En cours",
    observations: "Recoupe justice (décision du Conseil d'État en cours d'application)."
  },
  {
    orderNumber: 20,
    trackingId: "VEILLE-2026-020",
    dateOfFacts: "07/06/2026",
    source: "L'Inter n°8375",
    region: "Région du Guémon",
    locality: "Kiriao (commune de Facobly)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Vacance de la chefferie depuis deux ans (intérim Lucien Oulaï). Le 07/06/2026, les chefs de familles ont désigné le Pr Jean Pohé (ancien maire de Facobly, lignée de la chefferie). Rapport transmis à la Chambre régionale des rois et chefs du Guémon, verdict attendu.",
    status: "À suivre",
    observations: "Pas de conflit signalé à ce stade."
  },
  {
    orderNumber: 21,
    trackingId: "VEILLE-2026-021",
    dateOfFacts: "03-06/06/2026",
    source: "L'Inter n°8351 (08/06)",
    region: "Région du Gbêké",
    locality: "Diabo et Languibounou (département de Botro)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Des chefs de villages, tribus et cantons ont publiquement contesté la gestion de Nanan N'Goran Koffi 2, président de la Chambre régionale du Gbêké, lui reprochant des ingérences dans la désignation de certains chefs. Médiation traditionnelle engagée le 06/06 à Bouaké.",
    status: "Résolu (médiation)",
    observations: "Le ministre Jacques Assahoré Konan a condamné la sortie publique (vidéo virale)."
  },
  {
    orderNumber: 22,
    trackingId: "VEILLE-2026-022",
    dateOfFacts: "22/06/2026",
    source: "L'Inter n°8384",
    region: "Région de la Nawa",
    locality: "Buyo-ville",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Zagbaï Lognon Sébastien, désigné chef par consensus le 16/02/2026, a adressé un avertissement aux communautés qui envisageraient d'introniser leurs propres chefs sans son aval.",
    status: "À suivre",
    observations: "Signe d'un risque de chefferies parallèles."
  },
  {
    orderNumber: 23,
    trackingId: "VEILLE-2026-023",
    dateOfFacts: "22/06/2026",
    source: "Le Patriote n°7923",
    region: "District Autonome d'Abidjan",
    locality: "Yopougon (chefferie Wê)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Lors de l'inauguration du siège de la chefferie Wê, les chefs ont demandé une meilleure reconnaissance institutionnelle des chefferies communautaires et dénoncé l'existence de chefferies parallèles.",
    status: "À suivre",
    observations: ""
  },
  {
    orderNumber: 24,
    trackingId: "VEILLE-2026-024",
    dateOfFacts: "03/07/2026",
    source: "Le Patriote n°7942",
    region: "Région du Bounkani",
    locality: "Bouna et Doropo (chefferie Lobi)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Les chefs Lobi contestent le processus de désignation des représentants à la Chambre nationale, demandent la suspension des désignations pour Bouna et Doropo (motion au préfet, articles 12 et 21 de la loi n°2014-428). Dénoncent une marginalisation de la communauté Lobi.",
    status: "En cours",
    observations: "Avertissement sur le risque de fragilisation des équilibres sociaux dans cette région frontalière."
  },
  {
    orderNumber: 25,
    trackingId: "VEILLE-2026-025",
    dateOfFacts: "25/04/2026 (faits)",
    source: "Soir Info n°9440 (28/04)",
    region: "District Autonome de Yamoussoukro",
    locality: "N'Gokro (Yamoussoukro)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Succession bloquée après le décès du dernier chef. Ampoh N'Guessan Jean Pierre Omer plaide pour l'intronisation rapide du chef déjà désigné par les chefs de lignage (accord du chef de canton Akouè), au sein de la famille du patriarche Kouassi N'Goh.",
    status: "En cours",
    observations: "Distinct du N'Gokro d'Alépé (autre localité homonyme)."
  },
  {
    orderNumber: 26,
    trackingId: "VEILLE-2026-026",
    dateOfFacts: "04/04/2026 (procédure lancée)",
    source: "L'Intelligent n°5884 (06/05)",
    region: "Région du Gbêké",
    locality: "Akawa (canton N'dranouan, Bouaké)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Procédure de destitution engagée depuis le 04/04/2026 par la mutuelle de développement locale contre Brou N'Guessan Jean-Paul (Nanan Mougoh II), chef depuis 2014, accusé de lotissement illégal et vente de parcelles. Le chef dément et a porté plainte contre la mutuelle.",
    status: "En cours",
    observations: "Recoupe foncier et justice."
  },
  {
    orderNumber: 27,
    trackingId: "VEILLE-2026-027",
    dateOfFacts: "15/06/2026",
    source: "Notre Voie n°7929",
    region: "Région du Gôh",
    locality: "Krogbopa (Ouragahio)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "L'ancien chef intérimaire du village, Okou Antoine, retrouvé pendu le 15/06/2026, plusieurs jours après sa disparition. Il n'aurait pas supporté sa destitution du poste de chef intérimaire.",
    status: "Clos (décès)",
    observations: "Cas le plus grave du corpus sur ce thème : coût humain direct d'un conflit de succession."
  },
  {
    orderNumber: 28,
    trackingId: "VEILLE-2026-028",
    dateOfFacts: "08-09/05/2026",
    source: "L'Expression n°4556",
    region: "Région de l'Indénié-Djuablin",
    locality: "Zamaka (Abengourou)",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Après 15 ans d'incertitude et de blocages, intronisation de Nanan Kouakou Kouassi Nicolas à la tête de la tribu Ayoko-Kwabre.",
    status: "Résolu",
    observations: "Cas de référence pour la durée possible d'un blocage de succession."
  },
  {
    orderNumber: 29,
    trackingId: "VEILLE-2026-029",
    dateOfFacts: "28/05/2026",
    source: "Notre Voie n°7923",
    region: "Région du Haut-Sassandra",
    locality: "Issia",
    category: "Conflit",
    conflictType: "Désignation des chefs",
    description: "Désignation consensuelle de deux représentants départementaux à la CNRCT (Pierre Michel Ipaud-Lago et Yoh Gama), après plusieurs séances de médiation, en remplacement de deux chefs décédés en 2025.",
    status: "Résolu",
    observations: ""
  },
  {
    orderNumber: 30,
    trackingId: "VEILLE-2026-030",
    dateOfFacts: "29/04/2026 (verdict)",
    source: "Soir Info n°9445",
    region: "Région du Sud-Comoé",
    locality: "Ebrah (Grand-Bassam)",
    category: "Conflit",
    conflictType: "Problème de justice",
    description: "Verdict rendu le 29/04/2026, sept ans après les manifestations de 2019 déclenchées par la profanation d'un tam-tam sacré (Attoumgblan) à la veille d'une intronisation royale. 12 condamnés à 10-15 ans avec sursis et 100 millions FCFA d'amende ; 2 relaxés. Appel annoncé.",
    status: "En cours (appel)",
    observations: ""
  },
  {
    orderNumber: 31,
    trackingId: "VEILLE-2026-031",
    dateOfFacts: "25/04/2026 (décès)",
    source: "Soir Info n°9479",
    region: "Région du Guémon",
    locality: "Zéo (département de Bangolo)",
    category: "Conflit",
    conflictType: "Problème de justice",
    description: "Séa Ferdinand, chef du village de Zéo, décédé le 25/04/2026 en prison où il purgeait 5 ans ferme, condamné après la mort en 2024 de l'instituteur Bomayé Luc Valène (ligoté et laissé sans assistance, soupçonné de vol). Domicile du chef incendié par les proches de la victime en 2024.",
    status: "Clos (décès)",
    observations: ""
  },
  {
    orderNumber: 32,
    trackingId: "VEILLE-2026-032",
    dateOfFacts: "30/04/2026 (lettre ouverte)",
    source: "L'Inter n°8344",
    region: "Région du Guémon",
    locality: "Duékoué",
    category: "Conflit",
    conflictType: "Problème de justice",
    description: "Lettre ouverte d'Achille Dodé au Président de la République : reconnaissance des massacres commis contre le peuple Wê depuis 2002, enquêtes indépendantes, réparations, réconciliation, mécanismes de protection.",
    status: "À suivre",
    observations: ""
  },
  {
    orderNumber: 33,
    trackingId: "VEILLE-2026-033",
    dateOfFacts: "25/06/2026",
    source: "L'Intelligent n°5713",
    region: "Région des Grands-Ponts",
    locality: "Dabou / Lopou",
    category: "Conflit",
    conflictType: "Problème de justice",
    description: "Le président du comité régional de la Chambre des rois et chefs, chef du village de Lopou (ancien ministre, 82 ans), dément des accusations de perception de 100 millions FCFA d'une société dans des conflits internes à la chefferie ; indique avoir porté plainte et obtenu des condamnations.",
    status: "En cours",
    observations: "Son nom n'apparaît pas explicitement dans la fiche source - à vérifier avant citation."
  },
  {
    orderNumber: 34,
    trackingId: "VEILLE-2026-034",
    dateOfFacts: "28/06/2026 (réunion)",
    source: "L'Expression n°4595 (09/07)",
    region: "Région du Gontougo",
    locality: "Kroupikro, N'Zuassé, Benanon, Sokoura N'Détiesso (Transua)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Réunion des chefs traditionnels le 28/06/2026 sur l'orpaillage illégal sévissant dans ces villages. Nanan Obeng Kouakou Ignace a mis en cause la responsabilité de certains chefs de village (complicité ou perte d'autorité). Rappel des voies légales d'exploitation.",
    status: "En cours",
    observations: ""
  },
  {
    orderNumber: 35,
    trackingId: "VEILLE-2026-035",
    dateOfFacts: "22/06/2026 (réunion)",
    source: "Fraternité Matin n°18437 (24/06)",
    region: "Région du Gontougo",
    locality: "Bondoukou",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Réunion de sensibilisation le 22/06/2026 à l'initiative du sous-préfet Sonh Laurent. Seulement 4 autorisations minières en règle dans la sous-préfecture. Cours d'eau ayant changé de couleur sous l'effet des exploitations clandestines. Renforcement annoncé des contrôles.",
    status: "En cours",
    observations: ""
  },
  {
    orderNumber: 36,
    trackingId: "VEILLE-2026-036",
    dateOfFacts: "13/07/2026",
    source: "Le Nouveau Réveil n°7142",
    region: "Région du Worodougou",
    locality: "Kouego (département de Séguéla)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Opération de déguerpissement du GSLOI dégénérée en affrontements avec des orpailleurs clandestins : plusieurs blessés, un décédé pendant son évacuation. Site dans le périmètre du permis de Roxgold Séguéla. Équipements de la compagnie vandalisés en représailles.",
    status: "En cours",
    observations: "Cas le plus grave du corpus en orpaillage (un mort)."
  },
  {
    orderNumber: 37,
    trackingId: "VEILLE-2026-037",
    dateOfFacts: "25/06/2026",
    source: "L'Inter n°8390 (29/06)",
    region: "Région du Worodougou",
    locality: "District du Woroba (étape Séguéla)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Tournée nationale de sensibilisation du ministre des Mines : le Worodougou concentrerait 60% des sites clandestins du district ; 80% des revenus de l'orpaillage illégal captés par des filières étrangères contre 7% pour les communautés locales. Plus de 800 autorisations artisanales délivrées en 3 ans.",
    status: "En cours",
    observations: "Trois semaines avant le drame de Kouego, dans le même département."
  },
  {
    orderNumber: 38,
    trackingId: "VEILLE-2026-038",
    dateOfFacts: "26/04/2026",
    source: "Soir Info n°9440 (29/04)",
    region: "Région du Moronou",
    locality: "Abongoua (Kotobi, département d'Arrah)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Deux enfants d'une même mère (13 et 15 ans) morts noyés le 26/04/2026 dans un puits abandonné par des orpailleurs clandestins sur le site « Agbonou », en tentant de se secourir mutuellement. Corps repêchés le lendemain.",
    status: "Clos (drame)",
    observations: "Second décès du corpus directement imputable à l'orpaillage illégal."
  },
  {
    orderNumber: 39,
    trackingId: "VEILLE-2026-039",
    dateOfFacts: "08/07/2026 (tournée)",
    source: "Soir Info n°9498 (10/07) ; L'Inter n°8404 (15/07)",
    region: "Région du Sud-Comoé",
    locality: "Kouakro (département d'Aboisso)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Le préfet de région Ibrahima Cissé a averti que tout chef de village dont la complicité dans l'orpaillage clandestin serait établie serait immédiatement destitué. Dispositif d'investigation annoncé.",
    status: "En cours",
    observations: "Tournée à poursuivre à Maféré et Adjouan."
  },
  {
    orderNumber: 40,
    trackingId: "VEILLE-2026-040",
    dateOfFacts: "08/07/2026",
    source: "L'Inter n°8400 (10/07)",
    region: "Région du Gôh",
    locality: "Gagnoa (filière cacao)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Le chef Diby Koffi Diby alerte que la mévente des stocks de cacao pousse les fils de planteurs vers l'orpaillage illégal faute d'argent, fixant un ultimatum au 07/08 pour l'enlèvement des stocks résiduels.",
    status: "À suivre",
    observations: "Lien causal direct entre crise cacaoère et orpaillage."
  },
  {
    orderNumber: 41,
    trackingId: "VEILLE-2026-041",
    dateOfFacts: "23/04/2026",
    source: "Notre Voie n°7896 (27/04)",
    region: "Région du Cavally",
    locality: "Parcs de Taï et du Cavally (Guiglo)",
    category: "Conflit",
    conflictType: "Orpaillage",
    description: "Les comités de gestion locaux des aires protégées ont identifié les pressions foncières et l'orpaillage clandestin comme principaux défis, avec recommandations de sensibilisation et de projets alternatifs générateurs de revenus.",
    status: "À suivre",
    observations: "Mention générale, pas un incident ponctuel."
  }
];
