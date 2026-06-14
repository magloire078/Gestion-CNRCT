import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { majorGroups, ethnicities, getEthnicitiesByMajorGroup } from '@/lib/ivory-coast-ethnicities';
import { Users, MapPin, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function EthniesPage() {
    return (
        <div className="container mx-auto p-4 md:p-8 space-y-8 max-w-7xl">
            <div className="flex flex-col gap-4">
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cartographie Ethnographique</h1>
                <p className="text-slate-500 max-w-3xl">
                    Découvrez les groupes ethniques et les ethnies de Côte d'Ivoire. Cette base de données répertorie les 4 grands groupes officiels et leurs principales subdivisions pour vous aider à mieux comprendre la diversité culturelle et le maillage traditionnel ivoirien.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {majorGroups.map(group => {
                    const eths = getEthnicitiesByMajorGroup(group);
                    return (
                        <Card key={group} className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
                            <CardHeader className="bg-slate-50/50 rounded-t-xl border-b pb-4">
                                <CardTitle className="flex items-center gap-2 text-xl font-black text-slate-800">
                                    <Users className="h-5 w-5 text-blue-600" />
                                    {group}
                                </CardTitle>
                                <CardDescription>
                                    {eths.length} ethnies répertoriées
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="max-h-[350px] overflow-y-auto p-4 space-y-3">
                                    {eths.map(eth => (
                                        <div key={eth.id} className="group p-3 rounded-xl bg-white border hover:border-blue-200 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-slate-800">{eth.name}</span>
                                                {eth.subGroup && (
                                                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full">
                                                        {eth.subGroup}
                                                    </span>
                                                )}
                                            </div>
                                            {eth.geographicalZones && eth.geographicalZones.length > 0 && (
                                                <div className="flex items-start gap-1.5 mt-2">
                                                    <MapPin className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                                                    <span className="text-xs text-slate-500 line-clamp-2">
                                                        {eth.geographicalZones.join(', ')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 p-6 bg-blue-50/50 rounded-2xl border border-blue-100">
                <h3 className="text-lg font-bold text-blue-900 mb-2">Note sur la répartition</h3>
                <p className="text-sm text-blue-800/80 leading-relaxed">
                    Les zones géographiques indiquées correspondent aux foyers d'implantation historiques (Régions). 
                    Aujourd'hui, en raison des migrations internes et du développement économique, toutes les ethnies de Côte d'Ivoire sont présentes sur l'ensemble du territoire national.
                </p>
            </div>
        </div>
    );
}
