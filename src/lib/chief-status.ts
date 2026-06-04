import type { Chief } from "@/types/chief";

/**
 * Libellé lisible pour le statut d'un chef.
 * Utilisé dans les rapports, badges, sélecteurs.
 */
export function formatChiefStatus(status?: Chief["status"]): string {
    switch (status) {
        case "actif":
            return "En Exercice";
        case "a_vie":
            return "À Vie";
        case "decede":
            return "Décédé";
        case "demissionnaire":
            return "Démissionnaire / Retraité";
        case "archive":
            return "Archivé";
        default:
            return "Inconnu";
    }
}

/**
 * Indique si un statut place le chef en fonction actuellement.
 */
export function isChiefCurrentlyInOffice(status?: Chief["status"]): boolean {
    return !status || status === "actif" || status === "a_vie";
}
