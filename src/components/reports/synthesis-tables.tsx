import React from 'react';
import { VillageEntry } from '@/types/village';
import { Chief } from '@/types/chief';

export const GlobalSynthesisTable = ({ 
    villages, 
    chiefs 
}: { 
    villages?: VillageEntry[], 
    chiefs?: Chief[] 
}) => {
    // Determine data source
    const hasVillages = !!villages;
    
    // Group by Region -> Department
    const stats: Record<string, Record<string, { sps: Set<string>, villages: number, occupied: number, vacant: number }>> = {};

    if (hasVillages && villages) {
        villages.forEach(v => {
            const region = v.village.region || 'Non définie';
            const dept = v.village.department || 'Non défini';
            const sp = v.village.subPrefecture || v.village.commune || 'Non définie';
            
            if (!stats[region]) stats[region] = {};
            if (!stats[region][dept]) stats[region][dept] = { sps: new Set(), villages: 0, occupied: 0, vacant: 0 };
            
            stats[region][dept].sps.add(sp);
            stats[region][dept].villages++;
            if (v.currentChief) stats[region][dept].occupied++;
            else stats[region][dept].vacant++;
        });
    } else if (chiefs) {
        chiefs.forEach(c => {
            const region = c.region || 'Non définie';
            const dept = c.department || 'Non défini';
            const sp = c.subPrefecture || 'Non définie';
            
            if (!stats[region]) stats[region] = {};
            if (!stats[region][dept]) stats[region][dept] = { sps: new Set(), villages: 0, occupied: 0, vacant: 0 };
            
            stats[region][dept].sps.add(sp);
            stats[region][dept].villages++; // Each chief entry represents an authority
            // We consider all listed chiefs as occupied seats
            stats[region][dept].occupied++; 
        });
    }

    const regions = Object.keys(stats).sort();
    if (regions.length === 0) return null;

    return (
        <div className="page-break w-full p-12 print:p-5 bg-white min-h-screen">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4 border-b-4 border-slate-900 pb-2">
                Tableau de Synthèse Global
            </h2>
            <table className="w-full border-collapse border-2 border-slate-900 text-sm">
                <thead>
                    <tr className="bg-slate-900 text-white uppercase font-black print:bg-transparent print:text-slate-900 print:border-b-2 print:border-slate-900">
                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Région</th>
                        <th className="p-3 text-left border-r border-slate-700 print:border-slate-300">Département</th>
                        <th className="p-3 text-center border-r border-slate-700">Sous-préfectures</th>
                        <th className="p-3 text-center border-r border-slate-700">{hasVillages ? 'Localités' : 'Autorités'}</th>
                        {hasVillages && (
                            <>
                                <th className="p-3 text-center border-r border-slate-700">Sièges Pourvus</th>
                                <th className="p-3 text-center">Vacances</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {regions.map((region, rIdx) => {
                        const depts = Object.keys(stats[region]).sort();
                        return depts.map((dept, dIdx) => (
                            <tr key={`${region}-${dept}`} className="border-b border-slate-300">
                                {dIdx === 0 && (
                                    <td rowSpan={depts.length} className="p-3 font-black text-slate-900 uppercase border-r border-slate-300 align-middle bg-slate-50">
                                        {region}
                                    </td>
                                )}
                                <td className="p-3 font-bold text-slate-700 uppercase border-r border-slate-300">
                                    {dept}
                                </td>
                                <td className="p-3 text-center font-bold text-slate-600 border-r border-slate-300">
                                    {stats[region][dept].sps.size}
                                </td>
                                <td className="p-3 text-center font-black text-slate-800 border-r border-slate-300">
                                    {stats[region][dept].villages}
                                </td>
                                {hasVillages && (
                                    <>
                                        <td className="p-3 text-center font-bold text-emerald-600 border-r border-slate-300">
                                            {stats[region][dept].occupied}
                                        </td>
                                        <td className="p-3 text-center font-bold text-red-600">
                                            {stats[region][dept].vacant}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ));
                    })}
                </tbody>
            </table>
        </div>
    );
};

export const RegionSynthesisTable = ({ 
    region, 
    villages, 
    chiefs 
}: { 
    region: string, 
    villages?: VillageEntry[], 
    chiefs?: Chief[] 
}) => {
    // Similar to global but for a single region, not breaking page, just a small table
    const hasVillages = !!villages;
    const stats: Record<string, { sps: Set<string>, villages: number, occupied: number, vacant: number }> = {};

    if (hasVillages && villages) {
        villages.forEach(v => {
            const dept = v.village.department || 'Non défini';
            const sp = v.village.subPrefecture || v.village.commune || 'Non définie';
            if (!stats[dept]) stats[dept] = { sps: new Set(), villages: 0, occupied: 0, vacant: 0 };
            stats[dept].sps.add(sp);
            stats[dept].villages++;
            if (v.currentChief) stats[dept].occupied++;
            else stats[dept].vacant++;
        });
    } else if (chiefs) {
        chiefs.forEach(c => {
            const dept = c.department || 'Non défini';
            const sp = c.subPrefecture || 'Non définie';
            if (!stats[dept]) stats[dept] = { sps: new Set(), villages: 0, occupied: 0, vacant: 0 };
            stats[dept].sps.add(sp);
            stats[dept].villages++;
            stats[dept].occupied++;
        });
    }

    const depts = Object.keys(stats).sort();
    
    // Only show synthesis if there are multiple departments to summarize
    if (depts.length <= 1) return null;

    return (
        <div className="mb-4 mt-4 bg-slate-50 border border-slate-200 p-4 rounded-xl break-inside-avoid">
            <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-widest mb-3 border-b border-slate-200 pb-2">
                Synthèse Régionale - {region}
            </h4>
            <table className="w-full border-collapse text-[10px]">
                <thead>
                    <tr className="border-b-2 border-slate-300">
                        <th className="p-2 text-left uppercase font-bold text-slate-600">Département</th>
                        <th className="p-2 text-center uppercase font-bold text-slate-600">Sous-préfectures</th>
                        <th className="p-2 text-center uppercase font-bold text-slate-600">{hasVillages ? 'Localités' : 'Autorités'}</th>
                        {hasVillages && (
                            <>
                                <th className="p-2 text-center uppercase font-bold text-emerald-600">Pourvus</th>
                                <th className="p-2 text-center uppercase font-bold text-red-600">Vacants</th>
                            </>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {depts.map(dept => (
                        <tr key={dept} className="border-b border-slate-200 last:border-0">
                            <td className="p-2 font-black uppercase text-slate-800">{dept}</td>
                            <td className="p-2 text-center font-bold text-slate-600">{stats[dept].sps.size}</td>
                            <td className="p-2 text-center font-black text-slate-800">{stats[dept].villages}</td>
                            {hasVillages && (
                                <>
                                    <td className="p-2 text-center font-bold text-emerald-600">{stats[dept].occupied}</td>
                                    <td className="p-2 text-center font-bold text-red-600">{stats[dept].vacant}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
