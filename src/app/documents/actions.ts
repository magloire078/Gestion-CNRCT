"use server";

import { z } from "zod";

const formSchema = z.object({
  documentType: z.string().min(1, "Le type de document est requis."),
  documentContent: z.string().min(10, "Le contenu doit contenir au moins 10 caractères."),
});

export type FormState = {
  message: string;
  document?: string;
  fields?: Record<string, string>;
  issues?: string[];
};

// Helper to normalize keys for lookups
function normalize(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex !== -1) {
      const key = normalize(line.substring(0, colonIndex));
      const value = line.substring(colonIndex + 1).trim();
      result[key] = value;
    }
  }
  return result;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  // Try to parse YYYY-MM-DD
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  return dateStr;
}

function getField(data: Record<string, string>, keys: string[], defaultValue = ""): string {
  for (const k of keys) {
    const norm = normalize(k);
    if (data[norm] !== undefined) return data[norm];
  }
  return defaultValue;
}

function generateDocument(type: string, content: string): string {
  const data = parseContent(content);
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const get = (keys: string[], fallback = "") => getField(data, keys, fallback);

  const name = get(['nom', 'employee', 'employe', 'nomcomplet']);
  const matricule = get(['matricule', 'nummatricule']);
  const poste = get(['poste', 'fonction', 'qualite', 'postefonction']);
  
  // Format dates if found
  const dateEmbauche = formatDate(get(['datedembauche', 'dateprise', 'dateprisedeservice']));
  const dateDepart = formatDate(get(['datededepart', 'datedepart', 'datecessation', 'datefinconge', 'datefin']));
  const dateDebut = formatDate(get(['datedebutconge', 'datedebut', 'dateprise']));
  const lieuNaissance = get(['lieudenaissance', 'naissance', 'lieunaissance']);
  const baseSalary = get(['salariedebase', 'salairedebase', 'salaire', 'basesalary']);
  const banque = get(['banque', 'banquevirement']);
  const account = get(['compte', 'numerocompte', 'numcompte']);
  const decision = get(['decision', 'numdecision', 'decisiondenomination', 'decisionnumero']);
  const motif = get(['motif', 'motifdepart', 'raison']);
  const nbJours = get(['nombrejours', 'jours']);
  const nbSemaines = get(['nombresemaines', 'semaines']);
  const observation = formatDate(get(['dateobservation', 'date', 'datedobservation']));

  const missionNo = get(['numeromission', 'missionno', 'mission']);
  const missionType = get(['typemission', 'missiontype']);
  const destination = get(['destination']);
  const missionObject = get(['objetmission', 'objet', 'but']);
  const transport = get(['moyentransport', 'transport']);
  const immat = get(['immatriculation', 'vehicule']);

  switch (type) {
    case "Certificat de Travail":
      return `                               CERTIFICAT DE TRAVAIL
                               
Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie par la présente que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

a été employé(e) au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) du ${dateEmbauche || '[Date d\'embauche]'} au ${dateDepart || 'ce jour'}.

Pendant toute la durée de son emploi, l'intéressé(e) a exercé ses fonctions avec dévouement et professionnalisme. Il/Elle quitte notre institution libre de tout engagement.

En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Certificat de Prise de Service":
      return `                          CERTIFICAT DE PRISE DE SERVICE
                               

Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

a effectivement pris son service au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) le ${dateEmbauche || '[Date de Prise de Service]'}, suite à la décision de nomination ${decision || '[Numéro de Décision]'}.

En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Certificat de Cessation de Service":
      return `                         CERTIFICAT DE CESSATION DE SERVICE
                               

Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

a cessé ses fonctions au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) à compter du ${dateDepart || '[Date de cessation]'}, pour le motif suivant : ${motif || '[Motif de la cessation]'}.

L'intéressé(e) est en règle vis-à-vis des différents services de l'institution à la date de signature du présent certificat.

En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Certificat de Cessation Definitive de Service":
      return `                    CERTIFICAT DE CESSATION DÉFINITIVE DE SERVICE
                               

Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

a cessé définitivement de plein droit ses services au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) le ${dateDepart || '[Date de cessation définitive]'} pour le motif suivant : ${motif || '[Motif: Retraite / Fin de mandat]'}.

L'intéressé(e) est libre de tout engagement à l'égard de la Chambre à compter de cette date.

En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Attestation Irrevocable de Virement de Salaire":
      return `                ATTESTATION IRRÉVOCABLE DE VIREMENT DE SALAIRE
                               

La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) atteste par la présente que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

bénéficie d'un contrat de travail au sein de notre institution avec un salaire de base mensuel de ${baseSalary || '[Salaire de base]'} F CFA, conformément à la décision ${decision || '[Référence Décision]'}.

Par la présente, nous prenons l'engagement ferme et irrévocable de virer mensuellement le salaire net de l'intéressé(e) au compte bancaire ouvert à son nom auprès de l'établissement suivant :

Banque : ${banque || '[Nom de la banque]'}
Numéro de Compte : ${account || '[Numéro de compte / RIB]'}

Cet engagement de virement irrévocable ne pourra être modifié, suspendu ou annulé par nos soins sans l'accord écrit préalable de la banque susvisée.

En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Attestation de Presence Effective au Poste":
      return `                 ATTESTATION DE PRÉSENCE EFFECTIVE AU POSTE
                               

Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

est en service au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) depuis le ${dateEmbauche || '[Date d\'embauche]'} et qu'il/elle est présent(e) de manière effective et régulière à son poste de travail à la date du ${observation || today}.

En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    case "Attestation de Virement":
      return `                            ATTESTATION DE VIREMENT
                               

Je soussigné, le Directeur de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), atteste que le salaire mensuel de :

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

est régulièrement viré à son compte bancaire dont les coordonnées sont les suivantes :

Banque : ${banque || '[Nom de la banque]'}
Numéro de Compte : ${account || '[Numéro de compte]'}
Salaire de base : ${baseSalary || '[Salaire de base]'} F CFA

Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, conformément à la Décision ${decision || 'n°024/CNRCT/DIR/P. du 01 Août 2017'}.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Directeur Général
`;

    case "Employment Contract":
      return `                              CONTRAT DE TRAVAIL
                               

Entre les soussignés :

La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), représentée par son Secrétaire Général, d'une part,

Et,
Madame / Monsieur : ${name || '[Nom complet]'}
Né(e) à / le : ${lieuNaissance || '[Lieu et date de naissance]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}
d'autre part,

Il a été convenu et arrêté ce qui suit :

Article 1 : Engagement et Fonctions
L'employé est engagé à compter du ${dateEmbauche || '[Date d\'embauche]'} en qualité de ${poste || '[Poste]'}.

Article 2 : Rémunération
En contrepartie de ses services, l'employé percevra un salaire de base mensuel de ${baseSalary || '[Salaire]'} F CFA.

Article 3 : Lieu de Travail
Le lieu de travail principal est fixé au siège de la CNRCT à Yamoussoukro.


                                                   Fait à Yamoussoukro, le ${today}


   L'Employeur                                                         L'Employé
`;

    case "Ordre de Mission":
      return `                               ORDRE DE MISSION
                               
                               Mission N° ${missionNo || '[Numéro Mission]'}
                               Type : ${missionType || '[Type de Mission]'}

Il est ordonné à :

Madame / Monsieur : ${name || '[Nom complet]'}
Poste / Fonction : ${poste || '[Poste]'}

de se rendre à : ${destination || '[Destination]'}
pour effectuer la mission suivante :
${missionObject || '[Objet de la Mission]'}

Moyen de transport : ${transport || '[Moyen de Transport]'}
Immatriculation du véhicule : ${immat || '[Immatriculation]'}

Date de départ prévue : ${dateDebut || '[Date de départ]'}
Date de retour prévue : ${dateDepart || '[Date de retour]'}

Les autorités administratives et de sécurité sont priées de faciliter le déplacement et le séjour de l'intéressé(e) dans l'exercice de ses fonctions.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Président du Directoire
`;

    case "Decision de Cessation Definitive de Service":
      return `              DÉCISION DE CESSATION DÉFINITIVE DE SERVICE
              
                           DÉCISION N° ${decision || '[Numéro de Décision]'}

Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),

Vu la loi relative à l'organisation de la CNRCT,
Vu les nécessités de service,

DÉCIDE :

Article 1 :
Il est mis fin de manière définitive aux services de :
Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}
à compter du ${dateDepart || '[Date de cessation]'}, pour le motif suivant : ${motif || '[Motif]'}.

Article 2 :
L'intéressé(e) cessera d'être comptabilisé(e) dans les effectifs du personnel de la Chambre à compter de la date susmentionnée.

Article 3 :
Le Secrétaire Général est chargé de l'exécution de la présente décision.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Président du Directoire
`;

    case "Decision d Octroi de Conge Annuel":
      return `                   DÉCISION D'OCTROI DE CONGÉ ANNUEL
              
                           DÉCISION N° ${decision || '[Numéro de Décision]'}

Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),

Vu le Code du Travail,
Vu le Règlement Intérieur de la CNRCT,

DÉCIDE :

Article 1 :
Un congé annuel d'une durée de ${nbJours || '30'} jours est octroyé à :
Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

Article 2 :
La période de ce congé s'étend du ${dateDebut || '[Date début]'} au ${dateDepart || '[Date fin]'} inclus.

Article 3 :
L'intéressé(e) reprendra effectivement son service le premier jour ouvrable suivant la date de fin de congé.

Article 4 :
Le Secrétaire Général est chargé de l'exécution de la présente décision.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Président du Directoire
`;

    case "Decision d Octroi de Conge de Maternite":
      return `                 DÉCISION D'OCTROI DE CONGÉ DE MATERNITÉ
              
                           DÉCISION N° ${decision || '[Numéro de Décision]'}

Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),

Vu le Code du Travail,
Vu les certificats médicaux fournis,

DÉCIDE :

Article 1 :
Un congé de maternité d'une durée réglementaire de ${nbSemaines || '14'} semaines est octroyé à :
Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Qualité / Poste : ${poste || '[Poste / Fonction]'}

Article 2 :
Ce congé de maternité s'étend du ${dateDebut || '[Date début]'} au ${dateDepart || '[Date fin]'} inclus.

Article 3 :
Pendant toute la durée de ce congé, l'intéressée conserve l'intégralité de ses droits et de sa rémunération.

Article 4 :
Le Secrétaire Général est chargé de l'exécution de la présente décision.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Président du Directoire
`;

    case "Company Policy":
      return `                           POLITIQUE D'ENTREPRISE
                               

Type de document : Politique d'entreprise
Objet : Règlement et Lignes Directrices CNRCT

Le présent document a pour but de définir les règles de fonctionnement et de déontologie au sein de la Chambre Nationale des Rois et Chefs Traditionnels.

Contenu et directives définis par l'administration :
${content}


                                                   Fait à Yamoussoukro, le ${today}

                                                   La Direction Générale
`;

    case "Warning Letter":
      return `                           LETTRE D'AVERTISSEMENT
                               

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Poste : ${poste || '[Poste / Fonction]'}

Objet : Avertissement de travail

Madame / Monsieur,

Par la présente, nous vous notifions un avertissement formel suite aux faits signalés et constatés suivants :
${content}

Nous vous demandons de prendre toutes les mesures nécessaires afin de corriger cette situation et de veiller au strict respect de vos obligations professionnelles.


                                                   Fait à Yamoussoukro, le ${today}

                                                   La Direction des Ressources Humaines
`;

    case "Termination Letter":
      return `                         LETTRE DE LICENCIEMENT
                               

Madame / Monsieur : ${name || '[Nom complet]'}
Matricule : ${matricule || '[Matricule]'}
Poste : ${poste || '[Poste / Fonction]'}

Objet : Notification de licenciement

Madame / Monsieur,

Nous vous notifions par la présente notre décision de procéder à votre licenciement de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT).

Cette mesure prendra effet à compter du ${dateDepart || '[Date d\'effet]'}, conformément aux dispositions réglementaires en vigueur et pour les motifs suivants décrits dans vos informations clés :
${content}

Vous êtes invité(e) à vous présenter au service des Ressources Humaines pour le retrait de votre solde de tout compte et de votre certificat de travail.


                                                   Fait à Yamoussoukro, le ${today}

                                                   Le Secrétaire Général
`;

    default:
      return `Type: ${type}\n\nContenu:\n${content}`;
  }
}

export async function generateDocumentAction(
  prevState: FormState,
  data: FormData
): Promise<FormState> {
  const formData = Object.fromEntries(data);
  const parsed = formSchema.safeParse(formData);

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return {
      message: "Formulaire invalide.",
      issues,
      fields: {
        documentType: formData.documentType as string,
        documentContent: formData.documentContent as string,
      }
    };
  }

  const generatedDoc = generateDocument(parsed.data.documentType, parsed.data.documentContent);

  return {
    message: "Document généré avec succès.",
    document: generatedDoc,
    fields: {
      documentType: parsed.data.documentType,
      documentContent: parsed.data.documentContent,
    }
  };
}
