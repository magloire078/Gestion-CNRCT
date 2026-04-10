"use server";

import { getConflicts } from "./conflict-service";

export interface ThesisOptions {
  studentName: string;
  supervisorName: string;
  universityName: string;
  academicYear: string;
  title?: string;
}

/**
 * Service pour la génération du document Word (Mémoire de Soutenance) complet
 * Retourne le document en format Base64 pour être utilisé dans un composant client
 */
export async function generateThesisWordDocument(options: ThesisOptions): Promise<string> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, PageBreak } = await import("docx");
  const conflicts = await getConflicts();
  
  // STATISTIQUES DYNAMIQUES
  const totalConflicts = conflicts.length;
  
  const conflictsByType = conflicts.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const conflictsByRegion = conflicts.reduce((acc, c) => {
    const region = c.region || "Non précisée";
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const resolvedConflicts = conflicts.filter(c => c.status === "Résolu");
  const resolutionRate = totalConflicts > 0 
    ? ((resolvedConflicts.length / totalConflicts) * 100).toFixed(1) 
    : "0";

  const defaultTitle = "LA TRANSFORMATION NUMÉRIQUE DE LA GESTION DES CONFLITS COUTUMIERS : CAS DU SYSTÈME D'ALERTE PRÉCOCE (SAP-GC)";

  // DOCUMENT WORD
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // ==========================================
          // PAGE DE GARDE
          // ==========================================
          new Paragraph({
            text: options.universityName.toUpperCase(),
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            text: "--------------------------------------------------",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: "CHAMBRE NATIONALE DES ROIS ET CHEFS TRADITIONNELS (CNRCT)",
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 800 },
          }),
          
          new Paragraph({
            text: "MÉMOIRE DE FIN DE CYCLE",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "Pour l'obtention du diplôme de fin d'étude",
            alignment: AlignmentType.CENTER,
            spacing: { after: 600 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: options.title || defaultTitle,
                bold: true,
                size: 32,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 1200 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "Présenté par : ",italics: true }),
              new TextRun({ text: options.studentName, bold: true }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Sous la direction de : ", italics: true }),
              new TextRun({ text: options.supervisorName, bold: true }),
            ],
            alignment: AlignmentType.RIGHT,
            spacing: { after: 800 },
          }),

          new Paragraph({
            text: `Année Académique : ${options.academicYear}`,
            alignment: AlignmentType.CENTER,
            spacing: { before: 1000 },
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // DÉDICACES ET REMERCIEMENTS
          // ==========================================
          new Paragraph({
            text: "DÉDICACES",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "[Insérez vos dédicaces ici. Exemple : À mes parents, pour leur soutien indéfectible...]",
                italics: true,
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          new Paragraph({ children: [new PageBreak()] }),

          new Paragraph({
            text: "REMERCIEMENTS",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            text: "Je tiens à remercier tout particulièrement :",
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "• La Chambre Nationale des Rois et Chefs Traditionnels (CNRCT) pour m'avoir accueilli au sein de son institution.",
            bullet: { level: 0 },
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: `• Mon maître de stage, ${options.supervisorName}, pour ses précieux conseils et son encadrement.`,
            bullet: { level: 0 },
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: "• L'ensemble de l'équipe technique du projet SAP-GC pour leur collaboration.",
            bullet: { level: 0 },
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // SOMMAIRE (Placeholder)
          // ==========================================
          new Paragraph({
            text: "SOMMAIRE",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({ text: "INTRODUCTION GÉNÉRALE ..................................................... 1" }),
          new Paragraph({ text: "CHAPITRE 1 : CADRE INSTITUTIONNEL ..................................... 5" }),
          new Paragraph({ text: "CHAPITRE 2 : ANALYSE DES DONNÉES (SAP-GC) ........................ 15" }),
          new Paragraph({ text: "CHAPITRE 3 : RECOMMANDATIONS ........................................... 30" }),
          new Paragraph({ text: "CONCLUSION GÉNÉRALE ......................................................... 45" }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // INTRODUCTION GÉNÉRALE
          // ==========================================
          new Paragraph({
            text: "INTRODUCTION GÉNÉRALE",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun("Dans un contexte de modernisation de l'administration ivoirienne, la gestion des conflits communautaires et fonciers représente un défi majeur pour la cohésion sociale. Ce mémoire se propose d'étudier comment l'outil numérique "),
              new TextRun({ text: "SAP-GC (Système d'Alerte Précoce et de Gestion des Conflits)", bold: true }),
              new TextRun(" développé pour la CNRCT permet de transformer une gestion traditionnelle en une gouvernance axée sur les données."),
            ],
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // CHAPITRE 1 : CADRE INSTITUTIONNEL
          // ==========================================
          new Paragraph({
            text: "CHAPITRE 1 : CADRE INSTITUTIONNEL (CNRCT)",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            text: "1.1 Statut et Missions de la CNRCT",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            text: "La Chambre Nationale des Rois et Chefs Traditionnels est l'institution qui regroupe toutes les autorités traditionnelles de Côte d'Ivoire. Elle a pour mission de valoriser nos us et coutumes et de participer à la résolution des conflits au plus près des populations.",
            alignment: AlignmentType.JUSTIFIED,
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // CHAPITRE 2 : ANALYSE DES DONNÉES (DYNAMIQUE)
          // ==========================================
          new Paragraph({
            text: "CHAPITRE 2 : ANALYSE DES DONNÉES ET RÉSULTATS DU SAP-GC",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            children: [
              new TextRun("À date de génération de ce document, le système SAP-GC a permis d'enregistrer "),
              new TextRun({ text: `${totalConflicts} signalements`, bold: true, color: "1A237E" }),
              new TextRun(" avec un taux de résolution global de "),
              new TextRun({ text: `${resolutionRate}%`, bold: true, color: "2E7D32" }),
              new TextRun("."),
            ],
            spacing: { after: 400 },
          }),

          new Paragraph({
            text: "2.1 Répartition par Typologie de Conflit",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Type de Conflit", bold: true })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Nombre de Cas", bold: true })] })] }),
                ],
              }),
              ...Object.entries(conflictsByType).map(([type, count]) => (
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(type)] }),
                    new TableCell({ children: [new Paragraph(count.toString())] }),
                  ],
                })
              )),
            ],
          }),

          new Paragraph({
            text: "2.2 Concentration Géographique",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Région / District", bold: true })] })] }),
                  new TableCell({ shading: { fill: "F3F4F6" }, children: [new Paragraph({ children: [new TextRun({ text: "Signalements", bold: true })] })] }),
                ],
              }),
              ...Object.entries(conflictsByRegion).map(([region, count]) => (
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph(region)] }),
                    new TableCell({ children: [new Paragraph(count.toString())] }),
                  ],
                })
              )),
            ],
          }),

          new Paragraph({
            text: "2.3 Échantillonnage des Résolutions Récentes",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          ...resolvedConflicts.slice(0, 5).map(c => [
            new Paragraph({
                text: `• Conflit ${c.trackingId || c.id.substring(0, 8)} (${c.type})`,
                spacing: { before: 150 },
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Résolution : ", italics: true }),
                    new TextRun(c.resolutionDetails || "Accord documenté dans le système.")
                ],
                indent: { left: 720 }
            })
          ]).flat(),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // CHAPITRE 3 : RECOMMANDATIONS
          // ==========================================
          new Paragraph({
            text: "CHAPITRE 3 : ANALYSE CRITIQUE ET RECOMMANDATIONS",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            text: "Afin de rendre le système encore plus performant, nous recommandons :",
            spacing: { after: 200 },
          }),
          new Paragraph({
            text: "1. L'intégration de notifications SMS automatiques pour les chefs de village.",
            bullet: { level: 0 },
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: "2. Le renforcement de la formation des délégués régionaux sur l'utilisation du SAP-GC.",
            bullet: { level: 0 },
            spacing: { after: 150 },
          }),
          new Paragraph({
            text: "3. La mise en place d'un système de cartographie en temps réel plus précis (GIS).",
            bullet: { level: 0 },
          }),

          new Paragraph({ children: [new PageBreak()] }),

          // ==========================================
          // CONCLUSION GÉNÉRALE
          // ==========================================
          new Paragraph({
            text: "CONCLUSION GÉNÉRALE",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 400 },
          }),
          new Paragraph({
            text: "Le passage d'une gestion physique des dossiers à une base de données centralisée à la CNRCT marque un tournant historique. Au-delà de l'aspect technologique, c'est un outil de paix sociale durable qui permet d'anticiper les crises avant qu'elles ne s'aggravent.",
            alignment: AlignmentType.JUSTIFIED,
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer.toString('base64');
}

