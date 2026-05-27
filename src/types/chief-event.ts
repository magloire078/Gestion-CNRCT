export type ChiefEventType =
  | "Intronisation"
  | "Fête traditionnelle"
  | "Réunion CNRCT"
  | "Médiation"
  | "Mission"
  | "Commémoration"
  | "Autre";

export type ChiefEvent = {
  id: string;
  title: string;
  type: ChiefEventType;
  date: string;             // ISO date string  "YYYY-MM-DD"
  endDate?: string;         // Optional end date for multi-day events
  villageId?: string;
  villageName?: string;
  region?: string;
  department?: string;
  chiefId?: string;
  chiefName?: string;
  description?: string;
  location?: string;        // Lieu précis de l'événement
  recursYearly?: boolean;   // Récurrence annuelle (fêtes, cérémonies)
  color?: string;           // Optional override color tag
  createdAt?: string;
  updatedAt?: string;
};
