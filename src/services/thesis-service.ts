import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from "docx";
import { getConflicts } from "./conflict-service";

/**
 * Service pour la génération du document Word (Mémoire) enrichi
 */
export async function generateThesisWordDocument(): Promise<Blob> {
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

  // DOCUMENT WORD
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // page de titre / en-tête
          new Paragraph({
            text: "SYSTÈME D'ALERTE PRÉCOCE ET DE GESTION DES CONFLITS (SAP-GC)",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          new Paragraph({
            text: "RAPPORT DYNAMIQUE GÉNÉRÉ POUR LE MÉMOIRE DE FIN D'ÉTUDE",
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 },
          }),

          // Section 1 : Introduction
          new Paragraph({
            text: "1. Introduction et Objectifs",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun("Le présent document synthétise les données opérationnelles issues de la plateforme de gestion du CNRCT. Ce module vise à faciliter la "),
              new TextRun({ text: "prévention", bold: true }),
              new TextRun(" et la "),
              new TextRun({ text: "résolution pacifique", bold: true }),
              new TextRun(" des litiges fonciers et communautaires en Côte d'Ivoire."),
            ],
          }),

          // Section 2 : Analyse Statistique
          new Paragraph({
            text: "2. Analyse des Données Réelles",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: [
              new TextRun("À date de génération, le système dénombre "),
              new TextRun({ text: `${totalConflicts} signalements`, bold: true, color: "1A237E" }),
              new TextRun(" enregistrés avec un taux de résolution global de "),
              new TextRun({ text: `${resolutionRate}%`, bold: true, color: "2E7D32" }),
              new TextRun("."),
            ],
          }),

          // 2.1 Répartition par Typologie
          new Paragraph({
            text: "2.1 Répartition par Typologie de Conflit",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
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

          // 2.2 Analyse Géographique
          new Paragraph({
            text: "2.2 Concentration Géographique par Région",
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 100 },
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

          // Section 3 : Mécanisme de Résolution
          new Paragraph({
            text: "3. Analyse Qualitative des Résolutions",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "L'efficacité de la médiation repose sur la documentation systématique des accords conclus. Voici un échantillon des résolutions récentes documentées dans le système :",
          }),

          ...resolvedConflicts.slice(0, 5).map(c => [
            new Paragraph({
                text: `• Conflit ${c.trackingId || c.id.substring(0, 8)} (${c.type})`,
                spacing: { before: 150 },
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Détails de résolution : ", italics: true }),
                    new TextRun(c.resolutionDetails || "Accord à l'amiable non détaillé.")
                ],
                indent: { left: 720 }
            })
          ]).flat(),

          // Section 4 : Traçabilité et Preuve
          new Paragraph({
            text: "4. Traçabilité Numérique (Logs de Médiation)",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            text: "Chaque interaction, visite sur le terrain ou réunion est consignée dans un journal de bord horodaté. Cette rigueur garantit qu'aucune étape du processus de paix ne soit ignorée, constituant une archive juridique et historique pour le CNRCT.",
          }),

          // Conclusion
          new Paragraph({
            text: "Conclusion Générale",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 600, after: 200 },
          }),
          new Paragraph({
            text: "L'intégration de la gestion des conflits au sein de la base de données du CNRCT transforme une gestion artisanale en une administration moderne, capable de fournir des indicateurs de performance précis pour l'élaboration de politiques publiques de cohésion sociale.",
          }),
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
