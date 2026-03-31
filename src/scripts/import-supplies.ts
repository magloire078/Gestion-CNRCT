
import { db } from '../lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

const suppliesData = [
  // AG-AG: Agrafage (Fournitures de bureau)
  { code: "AG-AG-001", name: "Agrafe (Kangaro 8mm)", supplierReference: "Kangaro Staples, 8mm (5/16R)", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AG-AG-002", name: "Agrafe (Kangaro 23,10-H)", supplierReference: "Kangaro Staples 23,10-H", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AG-AG-003", name: "Agrafe (Bébé 8/4)", supplierReference: "Bébé 8/4", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AG-AG-004", name: "Agrafe Top 24/6", supplierReference: "Top 24/6", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AG-AG-005", name: "Agrafeuse Kangaro HP-8/4", supplierReference: "Kangaro HP-8 /4", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "AG-AG-006", name: "Agrafeuse Europlier 8-10", supplierReference: "Europlier 8-10", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "AG-AG-007", name: "Agrafeuse Eurplier maertri", supplierReference: "Eurplier maertri", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "AG-AG-008", name: "Ote agrafe Maped", supplierReference: "Maped office Kangaro Remover", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },

  // AT-AT: Attaches et Clips
  { code: "AT-AT-001", name: "Attache-Lettres Tecno 25mm", supplierReference: "Tecno 25mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-002", name: "Attache-Lettres Tecno 32mm", supplierReference: "Tecno 32mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-003", name: "Attache géante Fermagali", supplierReference: "Fermagali géante", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-004", name: "Attache Maped X100", supplierReference: "Maped X100", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-005", name: "Attache Rexel", supplierReference: "Rexel", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-006", name: "Attaches croisées N°47x53", supplierReference: "N° 47 X 53", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-007", name: "Attaches croisées N°10,40mm", supplierReference: "N° 10 ,43, n 10,40mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-AT-008", name: "Attaches croisées N°20,60mm", supplierReference: "N° 20,60mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-EL-001", name: "Elastiques Burotix 1000g", supplierReference: "Elastiques burotix 1000g", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "AT-EL-002", name: "Elastiques Burotix 100g", supplierReference: "Elastiques burotix 100g", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "AT-CL-001", name: "Clamps papier clips petit format", supplierReference: "Foska ,25 MM", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-CL-002", name: "Clamps papier clips moyen format", supplierReference: "Foska 40MM", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-CL-003", name: "Clamps papier clips grand format", supplierReference: "Binder clips2\" (51mm)", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-001", name: "Trombone colorées 33mm Paper clips", supplierReference: "Paper clips 33 mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-002", name: "Trombone colorées 33mm Open", supplierReference: "Open 33mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-003", name: "Trombone colorées 32mm", supplierReference: "Paper clips 32 MM,TE-0096", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-004", name: "Trombone colorées 26mm", supplierReference: "Paper clips,26 mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-005", name: "Trombone colorées unistar 41mm", supplierReference: "unistar 41 MM", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-TR-006", name: "Trombone Foska 40mm", supplierReference: "Foska,40 mm", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-PU-001", name: "Punaise acier Burotix", supplierReference: "Burotix 100pcs", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },
  { code: "AT-PU-002", name: "Punaise colorée Foska", supplierReference: "Foska", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Boîte" },

  // ST-BI: Stylo et Ecriture
  { code: "ST-BI-001", name: "Bic bleu Schneider (50/pqt)", supplierReference: "Schneider et autres", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "ST-BI-002", name: "Bic noir Trio cello", supplierReference: "Trio cello", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-003", name: "Bic vert Trio cello", supplierReference: "Trio cello", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-004", name: "Bic rouge Trio cello", supplierReference: "Trio cello", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-005", name: "Bic feutre noir Pentel", supplierReference: "Pentel", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-006", name: "Bic feutre bleu Pentel", supplierReference: "Pentel", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-007", name: "Bic feutre rouge Pentel", supplierReference: "Pentel", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-008", name: "Bic feutre bleu Reynold", supplierReference: "Reynold", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-009", name: "Bic feutre rouge Reynold", supplierReference: "Reynold", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-BI-010", name: "Bic feutre noir Reynold", supplierReference: "Reynold", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-001", name: "Marker noir Permanent", supplierReference: "Permanent", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-002", name: "Marker rouge Permanent", supplierReference: "Permanent", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-003", name: "Marker bleu Permanent", supplierReference: "Permanent", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-004", name: "Marker noir Bic", supplierReference: "Bic", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-005", name: "Marker rouge Bic", supplierReference: "Bic", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-006", name: "Marker vert Bic", supplierReference: "Bic", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "ST-MA-007", name: "Marker bleu S.T.A", supplierReference: "S.T.A", category: "Fournitures de bureau", quantity: 0, reorderLevel: 10, unit: "Unité" },

  // PA-PA: Papeterie
  { code: "PA-PA-001", name: "Rame A4 Double A4 80g", supplierReference: "Double A4, 80g", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Rame" },
  { code: "PA-PA-002", name: "Rame A3 Double A3 80g", supplierReference: "Double A3, 80g", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Rame" },
  { code: "PA-CH-001", name: "Chemise cartonnée (100/pqt)", supplierReference: "Buro+B61tix JO 208 24x32 cm", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "PA-CH-002", name: "Sous-chemise (250/pqt)", supplierReference: "ex-compta , 22x31 cm/A4, 60g", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "PA-CH-003", name: "Chemise à rabat (12/pqt)", supplierReference: "Trio", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "PA-CH-004", name: "Chemise à sangle couleur", supplierReference: "Trio", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "PA-EN-001", name: "Enveloppes A3", supplierReference: "Techno qualité KM 9x123 /A3", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "PA-EN-002", name: "Enveloppes A4", supplierReference: "Tecno A4", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Paquet" },
  { code: "PA-RE-001", name: "Registre 4 mains format A4 noir", supplierReference: "Format A4 (noir)", category: "Papeterie", quantity: 0, reorderLevel: 10, unit: "Unité" },

  // CI: Consommables Informatiques (Nouvelle Liste)
  { code: "CI-US-001", name: "Clé USB 16 Go", supplierReference: "Standard", category: "Consommables Informatiques", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "CI-US-002", name: "Clé USB 4 Go", supplierReference: "Standard", category: "Consommables Informatiques", quantity: 7, reorderLevel: 10, unit: "Unité" },
  { code: "CI-LI-001", name: "Licence Windows 7", supplierReference: "Microsoft", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Licence" },
  { code: "CI-LI-002", name: "Licence Windows 10", supplierReference: "Microsoft", category: "Consommables Informatiques", quantity: 14, reorderLevel: 10, unit: "Licence" },
  { code: "CI-LI-003", name: "Licence Windows 8.1", supplierReference: "Microsoft", category: "Consommables Informatiques", quantity: 14, reorderLevel: 10, unit: "Licence" },
  { code: "CI-TO-001", name: "Toner Canon C-EXV 40", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-002", name: "Toner HP 83 A", supplierReference: "HP", category: "Consommables Informatiques", quantity: 5, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-003", name: "Toner HP80A", supplierReference: "HP", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-004", name: "Toner HP 222 A Noir", supplierReference: "HP", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-005", name: "Toner HP 222 A Bleu", supplierReference: "HP", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-006", name: "Toner HP 222 A Rouge", supplierReference: "HP", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-007", name: "Toner HP 222 A Jaune", supplierReference: "HP", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-008", name: "GPR 22", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-009", name: "Toner Canon C-EXV 18/32", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 4, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-010", name: "Toner HP 130 A Noir", supplierReference: "HP", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-011", name: "Toner HP 130 A Bleu(Cyan)", supplierReference: "HP", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-012", name: "Toner HP 130 A Yellow", supplierReference: "HP", category: "Consommables Informatiques", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-013", name: "Toner HP 130 A Rouge (Maagenta)", supplierReference: "HP", category: "Consommables Informatiques", quantity: 1, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-014", name: "Toner Canon C-EXV 40 Noir", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-015", name: "Toner Canon C-EXV 32 noir", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 9, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-016", name: "Toner HP 216 Noir", supplierReference: "HP", category: "Consommables Informatiques", quantity: 6, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-017", name: "Toner HP 216 Jaune", supplierReference: "HP", category: "Consommables Informatiques", quantity: 4, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-018", name: "Toner HP 216 rouge", supplierReference: "HP", category: "Consommables Informatiques", quantity: 4, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-019", name: "Toner HP 207 A Noir original", supplierReference: "HP", category: "Consommables Informatiques", quantity: 7, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-020", name: "Toner 207 A bleu", supplierReference: "HP", category: "Consommables Informatiques", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-021", name: "Toner 207 A jaune", supplierReference: "HP", category: "Consommables Informatiques", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-022", name: "Toner HP207A (Rouge)Magenta original", supplierReference: "HP", category: "Consommables Informatiques", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-023", name: "Canon Genuine 46 Noir", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 13, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-024", name: "Canon Genuine 46 Rouge", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-025", name: "Canon Genuine 46 Jaune", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TO-026", name: "Canon Genuine 46 Bleu", supplierReference: "Canon", category: "Consommables Informatiques", quantity: 2, reorderLevel: 10, unit: "Unité" },
  { code: "CI-TE-001", name: "KX-FA C 283 ECN", supplierReference: "Panasonic", category: "Consommables Informatiques", quantity: 0, reorderLevel: 10, unit: "Unité" },

  // MN: Matériel de Nettoyage (Nouvelle Liste)
  { code: "MN-MA-001", name: "Cache nez orthopédique", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 9, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-002", name: "Balai intérieur Ordinaire", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 6, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-003", name: "Balai WC", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 6, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-004", name: "Brosse toilette à Violon Chiendent", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 7, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-001", name: "Désodorisant cool wind Air", supplierReference: "cool wind Air", category: "Matériel de nettoyage", quantity: 32, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-002", name: "Désodorisant Bombe Brise 300 ml", supplierReference: "Bombe Brise", category: "Matériel de nettoyage", quantity: 15, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-003", name: "Désodorisant FEBREZE", supplierReference: "FEBREZE", category: "Matériel de nettoyage", quantity: 132, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-004", name: "Désodorisant karma lavande", supplierReference: "karma lavande", category: "Matériel de nettoyage", quantity: 94, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-005", name: "Désodorisant cool wind Magma", supplierReference: "Magma", category: "Matériel de nettoyage", quantity: 55, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-006", name: "Désodorisant green world air 300 ML", supplierReference: "green world", category: "Matériel de nettoyage", quantity: 91, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-007", name: "Désodorisant framboise et fraise 300 ml", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 64, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-008", name: "Dépoussiérant meubles à la cire d'abeille", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 25, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-005", name: "Ensemble sceau+serpillière", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-009", name: "Epge Végtle Grd carrée (5/Pack)", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 1, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-PR-010", name: "Epge vgtle splendelli(4/pack)", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 4, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-PR-011", name: "Insecticide Baygon 300 ml", supplierReference: "Baygon", category: "Matériel de nettoyage", quantity: 9, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-012", name: "Javel 12° C en carton de 1lx12x1c x4c", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 66, reorderLevel: 10, unit: "Carton" },
  { code: "MN-PR-013", name: "Javel 12° C en carton de 4l", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 54, reorderLevel: 10, unit: "Carton" },
  { code: "MN-PR-014", name: "Nettoyant essuie Vitre Prix gagnant", supplierReference: "Prix gagnant", category: "Matériel de nettoyage", quantity: 12, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-015", name: "Nettoyant essuie Vitre AJAX", supplierReference: "AJAX", category: "Matériel de nettoyage", quantity: 15, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-016", name: "Ajax poudre", supplierReference: "AJAX", category: "Matériel de nettoyage", quantity: 17, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-017", name: "Tête de lion (nettoyant)", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 6, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-018", name: "Nettoyant bi-javellisant 1 kg", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 3, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-019", name: "Omo poudre en sachet 25g x120 en sac", supplierReference: "Omo", category: "Matériel de nettoyage", quantity: 71, reorderLevel: 10, unit: "Sac" },
  { code: "MN-PA-001", name: "Papier Hygiénique Lotus 10x10 L 92/ en packs", supplierReference: "Lotus", category: "Matériel de nettoyage", quantity: 33, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-PA-002", name: "Papier mouchoir lotus boite de 50/ en boites", supplierReference: "Lotus", category: "Matériel de nettoyage", quantity: 29, reorderLevel: 10, unit: "Boîte" },
  { code: "MN-MA-006", name: "Pelle Plastique avec bavette", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 12, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-007", name: "Raclette Complète Ordinaire", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 7, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-020", name: "Savon liquide désinfectant toilette Super Clean bidon 4l", supplierReference: "Super Clean", category: "Matériel de nettoyage", quantity: 0, reorderLevel: 10, unit: "Bidon" },
  { code: "MN-MA-008", name: "Sac Poubelle Petit Sanitex 10L", supplierReference: "Sanitex", category: "Matériel de nettoyage", quantity: 4, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-MA-009", name: "Sac Poubelle Grand Sanitex 120 L", supplierReference: "Sanitex", category: "Matériel de nettoyage", quantity: 20, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-MA-010", name: "Sac Poubelle Grand Sanitex 100 l", supplierReference: "Sanitex", category: "Matériel de nettoyage", quantity: 61, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-MA-011", name: "Sac poubelle 30 L", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 31, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-MA-012", name: "Sac Poubelle Grand Sanitex 50 l", supplierReference: "Sanitex", category: "Matériel de nettoyage", quantity: 33, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-PR-021", name: "Savon liquide désinfectant mains frés 350 ml", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 101, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-022", name: "Savon liquide cleanol", supplierReference: "Cleanol", category: "Matériel de nettoyage", quantity: 38, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-013", name: "Sceau de 12 L en Plastique", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 11, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-014", name: "Serpillière Ordinaire", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 8, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-015", name: "Serviette Ordinaire-Torchon", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 0, reorderLevel: 10, unit: "Unité" },
  { code: "MN-MA-016", name: "Serviette de table Okay 100 (2plis)", supplierReference: "Okay", category: "Matériel de nettoyage", quantity: 16, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-PR-023", name: "Savon en poudre (Hélios 1kg)", supplierReference: "Hélios", category: "Matériel de nettoyage", quantity: 15, reorderLevel: 10, unit: "Paquet" },
  { code: "MN-MA-017", name: "Sceau en plastique(Unbreakable)", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 6, reorderLevel: 10, unit: "Unité" },
  { code: "MN-PR-024", name: "Acide muriatique(cartons) 4L", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 22, reorderLevel: 10, unit: "Carton" },
  { code: "MN-MA-018", name: "Gant de ménage large", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 15, reorderLevel: 10, unit: "Paire" },
  { code: "MN-MA-019", name: "Gant de ménage petit", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 39, reorderLevel: 10, unit: "Paire" },
  { code: "MN-MA-021", name: "Torchon", supplierReference: "Standard", category: "Matériel de nettoyage", quantity: 24, reorderLevel: 10, unit: "Unité" }
];

export async function bulkImportSupplies() {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'supplies');
    
    suppliesData.forEach((item) => {
        // Use the code as the document ID to prevent duplicates
        const docRef = doc(collectionRef, item.code);
        batch.set(docRef, {
            ...item,
            lastRestockDate: new Date().toISOString().split('T')[0]
        }, { merge: true });
    });
    
    await batch.commit();
}
