"use server";

import { z } from "zod";
import { getNextDocumentNumber } from "@/services/document-service";
import { saveGeneratedDocument } from "@/services/document-history-service";

const formSchema = z.object({
  documentType: z.string().min(1, "Le type de document est requis."),
  documentContent: z.string().min(10, "Le contenu doit contenir au moins 10 caractères."),
  documentNumber: z.string().optional(),
  agentId: z.string().optional(),
  agentName: z.string().optional(),
  employeeId: z.string().optional(),
  employeeName: z.string().optional(),
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
    if (data[norm] !== undefined) {
      return data[norm].replace(/\\n/g, '\n');
    }
  }
  return defaultValue.replace(/\\n/g, '\n');
}

function generateDocument(type: string, content: string, docNo: string): string {
  const data = parseContent(content);
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const get = (keys: string[], fallback = "") => getField(data, keys, fallback);

  const civility = get(['civilite', 'sexe'], 'Monsieur');
  const name = get(['nom', 'employee', 'employe', 'nomcomplet']);
  const matricule = get(['matricule', 'nummatricule', 'matriculesolde']);
  const cnps = get(['matriculecnps', 'cnps', 'cnpsemploye']);
  const poste = get(['poste', 'fonction', 'qualite', 'postefonction']);
  
  // Format dates if found
  const dateEmbauche = formatDate(get(['datedembauche', 'dateprise', 'dateprisedeservice']));
  const dateDepart = formatDate(get(['datededepart', 'datedepart', 'datecessation', 'datefinconge', 'datefin']));
  const dateDebut = formatDate(get(['datedebutconge', 'datedebut', 'dateprise']));
  const lieuNaissance = get(['lieudenaissance', 'naissance', 'lieunaissance']);
  const baseSalary = get(['salariedebase', 'salairedebase', 'salaire', 'basesalary']);
  const banque = get(['banque', 'banquevirement']);
  const account = get(['compte', 'numerocompte', 'numcompte']);
  const motif = get(['motif', 'motifdepart', 'raison']);
  const nbJours = get(['nombrejours', 'jours']);
  const nbSemaines = get(['nombresemaines', 'semaines']);
  const observation = formatDate(get(['dateobservation', 'date', 'datedobservation']));

  const missionNo = get(['numeromission', 'missionno', 'mission']) || docNo;
  const missionType = get(['typemission', 'missiontype']);
  const destination = get(['destination']);
  const missionObject = get(['objetmission', 'objet', 'but']);
  const transport = get(['moyentransport', 'transport']);
  const immat = get(['immatriculation', 'vehicule']);

  // Signatory details
  const sigNom = get(['signatairenom', 'nomdusiignataire'], 'FATOGOMA YEO');
  const sigTitre = get(['signatairetitre', 'titredusignataire'], 'Préfet');
  const sigFonction = get(['signatairefonction', 'fonctiondusignataire'], 'P. Le Président du Directoire et P.O\nLe Secrétaire Général');

  // Specific variables for Attestation de Presence
  const prevPoste = get(['precedentposte', 'ancienposte']);
  const decisionPrev = get(['decisionprecedentposte', 'decisionancienposte']);
  const newPoste = get(['nouveauposte']) || poste;
  const decisionPromo = get(['decisionpromotion', 'decisionnomination', 'decision']) || (docNo ? `N° ${docNo}/CNRCT/DIR/P.` : "");

  switch (type) {
    case "Certificat de Travail":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            CERTIFICAT DE TRAVAIL
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie par la présente que :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            a été employé(e) au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) du <strong>${dateEmbauche || '[Date d\'embauche]'}</strong> au <strong>${dateDepart || 'ce jour'}</strong>.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Pendant toute la durée de son emploi, l'intéressé(e) a exercé ses fonctions avec dévouement et professionnalisme. Il/Elle quitte notre institution libre de tout engagement.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    case "Certificat de Prise de Service":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            CERTIFICAT DE PRISE DE SERVICE
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            a effectivement pris son service au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) le <strong>${dateEmbauche || '[Date de Prise de Service]'}</strong>, suite à la décision de nomination <strong>${decisionPromo || '[Numéro de Décision]'}</strong>.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    case "Certificat de Cessation de Service":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            CERTIFICAT DE CESSATION DE SERVICE
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            a cessé ses fonctions au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) à compter du <strong>${dateDepart || '[Date de cessation]'}</strong>, pour le motif suivant : <strong>${motif || '[Motif de la cessation]'}</strong>.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            L'intéressé(e) est en règle vis-à-vis des différents services de l'institution à la date de signature du présent certificat.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    case "Certificat de Cessation Definitive de Service":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            CERTIFICAT DE CESSATION DÉFINITIVE DE SERVICE
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Je soussigné, le Secrétaire Général de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), certifie que :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            a cessé définitivement de plein droit ses services au sein de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) le <strong>${dateDepart || '[Date de cessation définitive]'}</strong> pour le motif suivant : <strong>${motif || '[Motif: Retraite / Fin de mandat]'}</strong>.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            L'intéressé(e) est libre de tout engagement à l'égard de la Chambre à compter de cette date.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            En foi de quoi, le présent certificat lui est délivré pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    case "Attestation Irrevocable de Virement de Salaire":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; text-decoration: underline; margin-top: 25px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 0.5px;">
            ATTESTATION IRRÉVOCABLE DE VIREMENT DE SALAIRE
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) atteste par la présente que :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            bénéficie d'un contrat de travail au sein de notre institution avec un salaire de base mensuel de <strong>${baseSalary || '[Salaire de base]'}</strong> F CFA, conformément à la décision <strong>${decisionPromo || '[Référence Décision]'}</strong>.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Par la présente, nous prenons l'engagement ferme et irrévocable de virer mensuellement le salaire net de l'intéressé(e) au compte bancaire ouvert à son nom auprès de l'établissement suivant :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Banque : <strong>${banque || '[Nom de la banque]'}</strong><br/>
            Numéro de Compte : <strong>${account || '[Numéro de compte / RIB]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Cet engagement de virement irrévocable ne pourra être modifié, suspendu ou annulé par nos soins sans l'accord écrit préalable de la banque susvisée.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 30px;">
            En foi de quoi, la présente attestation lui est délivrée pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    case "Attestation de Presence Effective au Poste":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <div style="width: 220px; font-size: 10.5pt; line-height: 1.4; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 25px;">
            <div style="font-weight: bold; text-transform: uppercase; text-align: center;">Le Directoire</div>
            <div style="height: 1px; border-bottom: 1px dashed #666; margin: 1px 0;"></div>
            <div style="font-weight: bold; text-transform: uppercase; text-align: center;">Le Président</div>
            <div style="height: 1px; border-bottom: 1px dashed #666; margin: 1px 0;"></div>
            <div style="text-align: center; font-weight: bold; margin-top: 3px;">N° ${docNo || '___'} /CNRCT/DIR/PDT</div>
          </div>

          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; text-decoration: underline; margin-top: 20px; margin-bottom: 35px; text-transform: uppercase; letter-spacing: 0.5px;">
            ATTESTATION DE PRESENCE EFFECTIVE AU POSTE
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), soussigné, atteste que <strong>${civility || 'Monsieur/Madame'} ${name || '[Nom complet]'}</strong> (matricule Solde : <strong>${matricule || '[Matricule Solde]'}</strong> / matricule CNPS : <strong>${cnps || '[Matricule CNPS]'}</strong>), précédemment <strong>${prevPoste || '[Précédent Poste]'}</strong> conformément à la décision ${decisionPrev || '[Décision Précédent Poste]'}, a été promu(e) <strong>${newPoste || '[Nouveau Poste]'}</strong> de la Chambre Nationale des Rois et Chefs Traditionnels par décision <strong>${decisionPromo || '[Décision Promotion]'}</strong>. <strong>${civility === 'Mademoiselle' || civility === 'Madame' ? 'Elle' : 'Il'}</strong> a pris service à son poste en cette qualité le <strong>${dateEmbauche || '[Date Prise de Service]'}</strong> et y est effectivement présent(e) à ce jour.
          </p>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; line-height: 1.8; margin-bottom: 40px;">
            En foi de quoi, la présente attestation est établie pour servir et valoir ce que de droit.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Yamoussoukro, le <strong>${observation || today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 320px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">${sigFonction.replace(/\n/g, '<br/>')}</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">${sigNom}</div>
              <div style="font-style: italic; color: #555;">${sigTitre}</div>
            </div>
          </div>
        </div>
      `;

    case "Attestation de Virement":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 35px; margin-bottom: 40px; text-transform: uppercase; letter-spacing: 1px;">
            ATTESTATION DE VIREMENT
          </h2>
          
          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            Je soussigné, le Directeur de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), atteste que le salaire mensuel de :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 20px;">
            est régulièrement viré à son compte bancaire dont les coordonnées sont les suivantes :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Banque : <strong>${banque || '[Nom de la banque]'}</strong><br/>
            Numéro de Compte : <strong>${account || '[Numéro de compte]'}</strong><br/>
            Salaire de base : <strong>${baseSalary || '[Salaire de base]'}</strong> F CFA
          </div>

          <p style="text-align: justify; text-indent: 40px; font-size: 11pt; margin-bottom: 35px;">
            Cette attestation est délivrée à l'intéressé(e) pour servir et valoir ce que de droit, conformément à la Décision <strong>${decisionPromo || 'n°024/CNRCT/DIR/P. du 01 Août 2017'}</strong>.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Directeur Général</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nom du Directeur]</div>
            </div>
          </div>
        </div>
      `;

    case "Employment Contract":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            CONTRAT DE TRAVAIL
          </h2>
          
          <p style="font-size: 11pt; margin-bottom: 15px;">
            Entre les soussignés :
          </p>
          <p style="font-size: 11pt; margin-bottom: 20px; text-indent: 20px;">
            La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT), représentée par son Secrétaire Général, d'une part,
          </p>
          <p style="font-size: 11pt; margin-bottom: 10px;">
            Et,
          </p>
          <div style="margin-left: 20px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Né(e) à / le : <strong>${lieuNaissance || '[Lieu et date de naissance]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>
          <p style="font-size: 11pt; margin-bottom: 20px;">
            d'autre part,
          </p>
          <p style="font-size: 11pt; margin-bottom: 20px; font-style: italic;">
            Il a été convenu et arrêté ce qui suit :
          </p>

          <div style="font-size: 11pt; space-y-4; margin-bottom: 35px;">
            <p><strong>Article 1 : Engagement et Fonctions</strong><br/>
            L'employé est engagé à compter du <strong>${dateEmbauche || '[Date d\'embauche]'}</strong> en qualité de <strong>${poste || '[Poste]'}</strong>.</p>
            
            <p><strong>Article 2 : Rémunération</strong><br/>
            En contrepartie de ses services, l'employé percevra un salaire de base mensuel de <strong>${baseSalary || '[Salaire]'}</strong> F CFA.</p>
            
            <p><strong>Article 3 : Lieu de Travail</strong><br/>
            Le lieu de travail principal est fixé au siège de la CNRCT à Yamoussoukro.</p>
          </div>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 30px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; margin-left: 40px; margin-right: 40px;">
            <div style="text-align: center; width: 180px;">
              <span style="font-weight: bold; text-decoration: underline;">L'Employeur</span>
              <div style="height: 60px;"></div>
            </div>
            <div style="text-align: center; width: 180px;">
              <span style="font-weight: bold; text-decoration: underline;">L'Employé</span>
              <div style="height: 60px;"></div>
            </div>
          </div>
        </div>
      `;

    case "Ordre de Mission":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <div style="width: 220px; font-size: 10.5pt; line-height: 1.4; border-bottom: 1.5px solid #000; padding-bottom: 3px; margin-bottom: 25px;">
            <div style="font-weight: bold; text-transform: uppercase; text-align: center;">Le Directoire</div>
            <div style="height: 1px; border-bottom: 1px dashed #666; margin: 1px 0;"></div>
            <div style="font-weight: bold; text-transform: uppercase; text-align: center;">Le Président</div>
            <div style="height: 1px; border-bottom: 1px dashed #666; margin: 1px 0;"></div>
            <div style="text-align: center; font-weight: bold; margin-top: 3px;">N° ${missionNo}/CNRCT/DIR/PDT</div>
          </div>

          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 25px; margin-bottom: 5px; text-transform: uppercase;">
            ORDRE DE MISSION
          </h2>
          <div style="text-align: center; font-weight: bold; font-size: 12pt; margin-bottom: 30px;">
            Type : <strong>${missionType || '[Type de Mission]'}</strong>
          </div>
          
          <p style="font-size: 11pt; margin-bottom: 20px;">
            Il est ordonné à :
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Poste / Fonction : <strong>${poste || '[Poste]'}</strong>
          </div>

          <p style="font-size: 11pt; margin-bottom: 20px; text-indent: 40px;">
            de se rendre à : <strong>${destination || '[Destination]'}</strong> pour effectuer la mission suivante :
          </p>
          
          <p style="font-size: 11pt; margin-left: 60px; font-weight: bold; font-style: italic; margin-bottom: 25px;">
            ${missionObject || '[Objet de la Mission]'}
          </p>

          <div style="margin-left: 60px; font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            Moyen de transport : <strong>${transport || '[Moyen de Transport]'}</strong><br/>
            Immatriculation du véhicule : <strong>${immat || '[Immatriculation]'}</strong><br/>
            Date de départ prévue : <strong>${dateDebut || '[Date de départ]'}</strong><br/>
            Date de retour prévue : <strong>${dateDepart || '[Date de retour]'}</strong>
          </div>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 35px;">
            Les autorités administratives et de sécurité sont priées de faciliter le déplacement et le séjour de l'intéressé(e) dans l'exercice de ses fonctions.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 300px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Président du Directoire</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nom du Président]</div>
            </div>
          </div>
        </div>
      `;

    case "Decision de Cessation Definitive de Service":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-top: 25px; margin-bottom: 5px; text-transform: uppercase;">
            DÉCISION DE CESSATION DÉFINITIVE DE SERVICE
          </h2>
          <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 25px;">
            DÉCISION N° <strong>${docNo ? `${docNo}/CNRCT/DIR/P.` : '[Numéro de Décision]'}</strong>
          </div>

          <p style="font-size: 10.5pt; font-weight: bold; margin-bottom: 15px;">
            Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),
          </p>

          <div style="font-size: 10pt; line-height: 1.5; margin-bottom: 20px; font-style: italic; border-left: 2px solid #ccc; padding-left: 10px;">
            Vu la loi relative à l'organisation de la CNRCT ;<br/>
            Vu les nécessités de service,
          </div>

          <p style="font-size: 11pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 15px;">
            DÉCIDE :
          </p>

          <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 30px;">
            <p><strong>Article 1 :</strong><br/>
            Il est mis fin de manière définitive aux services de :<br/>
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong><br/>
            à compter du <strong>${dateDepart || '[Date de cessation]'}</strong>, pour le motif suivant : <strong>${motif || '[Motif]'}</strong>.</p>
            
            <p><strong>Article 2 :</strong><br/>
            L'intéressé(e) cessera d'être comptabilisé(e) dans les effectifs du personnel de la Chambre à compter de la date susmentionnée.</p>
            
            <p><strong>Article 3 :</strong><br/>
            Le Secrétaire Général est chargé de l'exécution de la présente décision.</p>
          </div>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Président du Directoire</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nom du Président]</div>
            </div>
          </div>
        </div>
      `;

    case "Decision d Octroi de Conge Annuel":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-top: 25px; margin-bottom: 5px; text-transform: uppercase;">
            DÉCISION D'OCTROI DE CONGÉ ANNUEL
          </h2>
          <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 25px;">
            DÉCISION N° <strong>${docNo ? `${docNo}/CNRCT/DIR/P.` : '[Numéro de Décision]'}</strong>
          </div>

          <p style="font-size: 10.5pt; font-weight: bold; margin-bottom: 15px;">
            Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),
          </p>

          <div style="font-size: 10pt; line-height: 1.5; margin-bottom: 20px; font-style: italic; border-left: 2px solid #ccc; padding-left: 10px;">
            Vu le Code du Travail ;<br/>
            Vu le Règlement Intérieur de la CNRCT,
          </div>

          <p style="font-size: 11pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 15px;">
            DÉCIDE :
          </p>

          <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 30px;">
            <p><strong>Article 1 :</strong><br/>
            Un congé annuel d'une durée de <strong>${nbJours || '30'}</strong> jours est octroyé à :<br/>
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>.</p>
            
            <p><strong>Article 2 :</strong><br/>
            La période de ce congé s'étend du <strong>${dateDebut || '[Date début]'}</strong> au <strong>${dateDepart || '[Date fin]'}</strong> inclus.</p>
            
            <p><strong>Article 3 :</strong><br/>
            L'intéressé(e) reprendra effectivement son service le premier jour ouvrable suivant la date de fin de congé.</p>
            
            <p><strong>Article 4 :</strong><br/>
            Le Secrétaire Général est chargé de l'exécution de la présente décision.</p>
          </div>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Président du Directoire</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nom du Président]</div>
            </div>
          </div>
        </div>
      `;

    case "Decision d Octroi de Conge de Maternite":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-top: 25px; margin-bottom: 5px; text-transform: uppercase;">
            DÉCISION D'OCTROI DE CONGÉ DE MATERNITÉ
          </h2>
          <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 25px;">
            DÉCISION N° <strong>${docNo ? `${docNo}/CNRCT/DIR/P.` : '[Numéro de Décision]'}</strong>
          </div>

          <p style="font-size: 10.5pt; font-weight: bold; margin-bottom: 15px;">
            Le Président du Directoire de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT),
          </p>

          <div style="font-size: 10pt; line-height: 1.5; margin-bottom: 20px; font-style: italic; border-left: 2px solid #ccc; padding-left: 10px;">
            Vu le Code du Travail ;<br/>
            Vu les certificats médicaux fournis,
          </div>

          <p style="font-size: 11pt; font-weight: bold; text-decoration: underline; text-transform: uppercase; margin-bottom: 15px;">
            DÉCIDE :
          </p>

          <div style="font-size: 11pt; line-height: 1.6; margin-bottom: 30px;">
            <p><strong>Article 1 :</strong><br/>
            Un congé de maternité d'une durée réglementaire de <strong>${nbSemaines || '14'}</strong> semaines est octroyé à :<br/>
            Madame / Monsieur : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Qualité / Poste : <strong>${poste || '[Poste / Fonction]'}</strong>.</p>
            
            <p><strong>Article 2 :</strong><br/>
            Ce congé de maternité s'étend du <strong>${dateDebut || '[Date début]'}</strong> au <strong>${dateDepart || '[Date fin]'}</strong> inclus.</p>
            
            <p><strong>Article 3 :</strong><br/>
            Pendant toute la durée de ce congé, l'intéressée conserve l'intégralité de ses droits et de sa rémunération.</p>
            
            <p><strong>Article 4 :</strong><br/>
            Le Secrétaire Général est chargé de l'exécution de la présente décision.</p>
          </div>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Président du Directoire</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">[Nom du Président]</div>
            </div>
          </div>
        </div>
      `;

    case "Company Policy":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 1px;">
            POLITIQUE D'ENTREPRISE
          </h2>
          
          <div style="font-size: 11pt; margin-bottom: 25px; line-height: 1.8;">
            <strong>Type de document :</strong> Politique d'entreprise<br/>
            <strong>Objet :</strong> Règlement et Lignes Directrices CNRCT
          </div>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 20px;">
            Le présent document a pour but de définir les règles de fonctionnement et de déontologie au sein de la Chambre Nationale des Rois et Chefs Traditionnels.
          </p>

          <div style="text-align: justify; font-size: 11pt; line-height: 1.8; margin-bottom: 35px; border-top: 1px solid #eee; pt: 15px;">
            ${content.replace(/\n/g, '<br/>')}
          </div>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">La Direction Générale</div>
              <div style="height: 60px;"></div>
            </div>
          </div>
        </div>
      `;

    case "Warning Letter":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 35px; text-transform: uppercase; letter-spacing: 1px;">
            LETTRE D'AVERTISSEMENT
          </h2>
          
          <div style="font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            À l'attention de : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 25px; border-bottom: 1px solid #000; padding-bottom: 5px;">
            Objet : Avertissement de travail
          </div>

          <p style="font-size: 11pt; margin-bottom: 15px;">
            Madame / Monsieur,
          </p>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 20px;">
            Par la présente, nous vous notifions un avertissement formel suite aux faits signalés et constatés suivants :
          </p>

          <div style="text-align: justify; font-size: 11pt; line-height: 1.8; margin-bottom: 30px; padding: 10px; background-color: #fcfcfc; border-left: 3px solid #f87171;">
            ${content.replace(/\n/g, '<br/>')}
          </div>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 35px;">
            Nous vous demandons de prendre toutes les mesures nécessaires afin de corriger cette situation et de veiller au strict respect de vos obligations professionnelles.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">La Direction des Ressources Humaines</div>
              <div style="height: 60px;"></div>
            </div>
          </div>
        </div>
      `;

    case "Termination Letter":
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 15pt; text-decoration: underline; margin-top: 30px; margin-bottom: 35px; text-transform: uppercase; letter-spacing: 1px;">
            LETTRE DE LICENCIEMENT
          </h2>
          
          <div style="font-size: 11pt; line-height: 1.8; margin-bottom: 25px;">
            À l'attention de : <strong>${name || '[Nom complet]'}</strong><br/>
            Matricule : <strong>${matricule || '[Matricule]'}</strong><br/>
            Poste : <strong>${poste || '[Poste / Fonction]'}</strong>
          </div>

          <div style="font-size: 11pt; font-weight: bold; margin-bottom: 25px; border-bottom: 1px solid #000; padding-bottom: 5px;">
            Objet : Notification de licenciement
          </div>

          <p style="font-size: 11pt; margin-bottom: 15px;">
            Madame / Monsieur,
          </p>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 20px;">
            Nous vous notifions par la présente notre décision de procéder à votre licenciement de la Chambre Nationale des Rois et Chefs Traditionnels (CNRCT).
          </p>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 20px;">
            Cette mesure prendra effet à compter du <strong>${dateDepart || '[Date d\'effet]'}</strong>, conformément aux dispositions réglementaires en vigueur et pour les motifs suivants décrits dans vos informations clés :
          </p>

          <div style="text-align: justify; font-size: 11pt; line-height: 1.8; margin-bottom: 25px; padding: 10px; background-color: #fcfcfc; border-left: 3px solid #ef4444;">
            ${content.replace(/\n/g, '<br/>')}
          </div>

          <p style="text-align: justify; font-size: 11pt; margin-bottom: 35px;">
            Vous êtes invité(e) à vous présenter au service des Ressources Humaines pour le retrait de votre solde de tout compte et de votre certificat de travail.
          </p>

          <div style="text-align: right; font-size: 11pt; margin-bottom: 25px; margin-right: 40px;">
            Fait à Yamoussoukro, le <strong>${today}</strong>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-right: 40px;">
            <div style="width: 280px; text-align: center; font-size: 11pt; line-height: 1.5;">
              <div style="font-weight: bold; text-decoration: underline;">Le Secrétaire Général</div>
              <div style="height: 60px;"></div>
              <div style="font-weight: bold; text-decoration: underline; text-transform: uppercase;">FATOGOMA YEO</div>
              <div style="font-style: italic; color: #555;">Préfet</div>
            </div>
          </div>
        </div>
      `;

    default:
      return `
        <div style="font-family: 'Times New Roman', Times, serif; color: #000; padding: 10px; line-height: 1.6;">
          <h2 style="text-align: center; font-weight: bold; font-size: 14pt; margin-bottom: 20px; text-transform: uppercase;">${type}</h2>
          <div style="font-size: 11pt; line-height: 1.8; whitespace: pre-wrap;">
            ${content.replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
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
        documentNumber: formData.documentNumber as string,
      }
    };
  }

  // Determine doc number: if provided manually, use it. Otherwise, increment counter.
  let docNo = parsed.data.documentNumber?.trim() || "";
  if (!docNo) {
    try {
      const nextNo = await getNextDocumentNumber(parsed.data.documentType);
      docNo = String(nextNo).padStart(3, '0');
    } catch (err) {
      console.error("Failed to generate document number:", err);
      // Fallback
      docNo = String(Math.floor(Math.random() * 100) + 1).padStart(3, '0');
    }
  }

  const generatedDoc = generateDocument(parsed.data.documentType, parsed.data.documentContent, docNo);

  // Save to history in Firestore
  try {
    await saveGeneratedDocument({
      documentType: parsed.data.documentType,
      documentNumber: docNo,
      employeeId: parsed.data.employeeId || "",
      employeeName: parsed.data.employeeName || "Inconnu",
      content: parsed.data.documentContent,
      generatedText: generatedDoc,
      generatedBy: parsed.data.agentId || "system",
      generatedByName: parsed.data.agentName || "Système",
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to save generated document to history:", err);
  }

  return {
    message: "Document généré avec succès.",
    document: generatedDoc,
    fields: {
      documentType: parsed.data.documentType,
      documentContent: parsed.data.documentContent,
      documentNumber: docNo,
    }
  };
}
