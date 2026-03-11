import { NewsItem } from "@/types/common";

export interface SystemHoliday {
    name: string;
    description: string;
    date: string; // YYYY-MM-DD
    category: 'Événement';
    imageUrl?: string;
}

/**
 * Returns a list of national and religious holidays in Ivory Coast for a given year.
 * Focuses on 2026 as per user context.
 */
export function getIvoryCoastHolidays(year: number): SystemHoliday[] {
    const holidays: SystemHoliday[] = [
        // Fixed Dates
        { name: "Jour de l'An", description: "Célébration du passage à la nouvelle année.", date: `${year}-01-01`, category: 'Événement', imageUrl: '/images/holidays/new_year.png' },
        { name: "Journée Internationale de la Femme", description: "Célébration des droits des femmes et de leur contribution à la société.", date: `${year}-03-08`, category: 'Événement', imageUrl: '/images/holidays/womens_day.png' },
        { name: "Fête du Travail", description: "Célébration annuelle des travailleurs et de leurs droits.", date: `${year}-05-01`, category: 'Événement', imageUrl: '/images/holidays/labor_day.png' },
        { name: "Fête de l'Indépendance", description: "Commémoration de l'indépendance de la Côte d'Ivoire (7 août 1960).", date: `${year}-08-07`, category: 'Événement', imageUrl: '/images/holidays/independence_day.png' },
        { name: "Assomption", description: "Fête chrétienne célébrant l'élévation de la Vierge Marie.", date: `${year}-08-15`, category: 'Événement' },
        { name: "Toussaint", description: "Fête de tous les saints dans le calendrier chrétien.", date: `${year}-11-01`, category: 'Événement' },
        { name: "Journée Nationale de la Paix", description: "Journée dédiée à la promotion de la paix et de la cohésion nationale.", date: `${year}-11-15`, category: 'Événement' },
        { name: "Noël", description: "Célébration de la naissance de Jésus-Christ.", date: `${year}-12-25`, category: 'Événement', imageUrl: '/images/holidays/christmas.png' },
    ];

    // Variable Dates for 2026 (approx based on Gregorian calendar)
    if (year === 2026) {
        holidays.push(
            { name: "Lundi de Pâques", description: "Lendemain du dimanche de Pâques.", date: "2026-04-06", category: 'Événement' },
            { name: "Ascension", description: "Fête chrétienne marquant la montée de Jésus au ciel.", date: "2026-05-14", category: 'Événement' },
            { name: "Lundi de Pentecôte", description: "Célébration de la descente du Saint-Esprit.", date: "2026-05-25", category: 'Événement' },
            { name: "Nuit du Destin (Laylat al-Qadr)", description: "Nuit sainte de l'Islam durant le mois de Ramadan.", date: "2026-04-14", category: 'Événement' },
            { name: "Aïd el-Fitr (Fin du Ramadan)", description: "Fête marquant la fin du mois de jeûne du Ramadan.", date: "2026-03-20", category: 'Événement', imageUrl: '/images/holidays/eid_al_fitr.png' },
            { name: "Aïd el-Kébir (Tabaski)", description: "La plus importante des fêtes islamiques, commémorant le sacrifice d'Ibrahim.", date: "2026-05-27", category: 'Événement' },
            { name: "Maouloud", description: "Commémoration de la naissance du prophète Mahomet.", date: "2026-08-26", category: 'Événement' }
        );
    }

    return holidays;
}

/**
 * Converts system holidays into virtual NewsItems for the feed.
 */
export function getHolidayNewsItems(year: number): NewsItem[] {
    const holidays = getIvoryCoastHolidays(year);
    const now = new Date().toISOString();

    return holidays.map(h => ({
        id: `holiday-${h.date}-${h.name.replace(/\s+/g, '-').toLowerCase()}`,
        title: h.name,
        summary: h.description,
        content: `<p>${h.description}</p>`,
        category: 'Événement',
        imageUrl: h.imageUrl, // Map the image URL
        eventDate: h.date,
        authorId: 'system',
        authorName: 'Système CNRCT',
        createdAt: now,
        updatedAt: now,
        published: true,
        viewCount: 0,
        tags: ['Férié', 'National', 'Calendrier']
    }));
}
