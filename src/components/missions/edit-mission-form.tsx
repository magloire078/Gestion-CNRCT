"use client";

import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    CalendarIcon, Loader2, Plus, 
    Trash2, UserPlus, MapPin, 
    Calendar, FileText, Settings,
    Car, Hotel, CreditCard, Save, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Mission, MissionParticipant, Employe } from "@/lib/data";
import { subscribeToEmployees } from "@/services/employee-service";
import { cn } from "@/lib/utils";
import { SearchableSelect } from "@/components/ui/searchable-select";

interface EditMissionFormProps {
    mission: Mission;
    onUpdateMission: (id: string, data: Partial<Mission>) => Promise<void>;
}

export function EditMissionForm({ mission, onUpdateMission }: EditMissionFormProps) {
    const [title, setTitle] = useState(mission.title);
    const [description, setDescription] = useState(mission.description);
    const [lieuMission, setLieuMission] = useState(mission.lieuMission || "");
    const [startDate, setStartDate] = useState<Date | undefined>(mission.startDate ? parseISO(mission.startDate) : undefined);
    const [endDate, setEndDate] = useState<Date | undefined>(mission.endDate ? parseISO(mission.endDate) : undefined);
    const [status, setStatus] = useState<Mission['status']>(mission.status);
    const [participants, setParticipants] = useState<MissionParticipant[]>(mission.participants || []);
    
    const [employees, setEmployees] = useState<Employe[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("general");

    useEffect(() => {
        const unsubscribe = subscribeToEmployees((fetched) => {
            setEmployees(fetched);
        }, (err) => console.error(err));
        return () => unsubscribe();
    }, []);

    const handleAddParticipant = (employeeId: string) => {
        const emp = employees.find(e => e.id === employeeId);
        if (!emp) return;
        
        if (participants.find(p => p.employeeId === employeeId)) return;

        const newParticipant: MissionParticipant = {
            employeeId: emp.id,
            employeeName: emp.name,
            moyenTransport: 'Véhicule CNRCT',
            coutTransport: 0,
            coutHebergement: 0,
            totalIndemnites: 0
        };
        setParticipants([...participants, newParticipant]);
    };

    const handleRemoveParticipant = (index: number) => {
        setParticipants(participants.filter((_, i) => i !== index));
    };

    const handleUpdateParticipant = (index: number, updates: Partial<MissionParticipant>) => {
        const newParticipants = [...participants];
        newParticipants[index] = { ...newParticipants[index], ...updates };
        setParticipants(newParticipants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onUpdateMission(mission.id, {
                title,
                description,
                lieuMission,
                startDate: startDate ? format(startDate, "yyyy-MM-dd") : mission.startDate,
                endDate: endDate ? format(endDate, "yyyy-MM-dd") : mission.endDate,
                status,
                participants
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (        <form onSubmit={handleSubmit} className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl sticky top-4 z-20 gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-transform">
                        <Settings className="h-7 w-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Configuration Mission</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {mission.numeroMission || 'NO-REF'}
                            </Badge>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Paramétrage technique & Équipage</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => router.back()}
                        className="h-12 px-6 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-500 hover:bg-slate-100"
                    >
                        <X className="mr-2 h-4 w-4" /> Abandonner
                    </Button>
                    <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="flex-1 md:flex-none h-12 px-8 rounded-xl bg-slate-900 shadow-xl shadow-slate-900/20 font-black uppercase tracking-widest text-[11px] hover:bg-black active:scale-95 transition-all text-white"
                    >
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Valider les Rectifications
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex w-full max-w-2xl mx-auto bg-slate-100/50 backdrop-blur-md p-1.5 rounded-[1.5rem] border border-slate-200/50">
                    <TabsTrigger value="general" className="flex-1 rounded-[1rem] data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 font-black uppercase text-[10px] tracking-widest transition-all">
                        <FileText className="h-4 w-4" /> Dossier
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="flex-1 rounded-[1rem] data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 font-black uppercase text-[10px] tracking-widest transition-all">
                        <UserPlus className="h-4 w-4" /> Équipage
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="flex-1 rounded-[1rem] data-[state=active]:bg-white data-[state=active]:shadow-lg py-3 gap-2 font-black uppercase text-[10px] tracking-widest transition-all">
                        <Car className="h-4 w-4" /> Logistique
                    </TabsTrigger>
                </TabsList>


                <TabsContent value="general" className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <Card className="lg:col-span-2 border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
                            <CardHeader className="p-8 border-b border-white/10 bg-slate-900/5">
                                <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                    Détails Opérationnels
                                </CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                    Spécifications techniques de la mission
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-3">
                                    <Label htmlFor="title" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Désignation de la Mission</Label>
                                    <Input 
                                        id="title" 
                                        value={title} 
                                        onChange={(e) => setTitle(e.target.value)} 
                                        className="h-14 rounded-2xl border-slate-200 bg-white/50 font-black text-slate-900 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-sm px-6" 
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="description" className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Note de Synthèse</Label>
                                    <Textarea 
                                        id="description" 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        rows={8} 
                                        className="rounded-2xl border-slate-200 bg-white/50 font-medium text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all text-sm p-6" 
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-8">
                            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
                                <CardHeader className="p-8 border-b border-white/10 bg-slate-900/5">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                        <MapPin className="h-5 w-5 text-blue-500" />
                                        Logistique
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Zone Géographique</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                                            <Input 
                                                id="lieu" 
                                                value={lieuMission} 
                                                onChange={(e) => setLieuMission(e.target.value)} 
                                                className="h-12 pl-12 rounded-xl border-slate-200 bg-white/50 font-bold text-sm" 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Début</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className="h-12 w-full justify-start text-left bg-white/50 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-tight">
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                        {startDate ? format(startDate, "dd MMM yyyy", { locale: fr }) : <span>Début</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                                                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[11px] font-black uppercase tracking-widest text-slate-500 pl-1">Fin</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className="h-12 w-full justify-start text-left bg-white/50 rounded-xl border-slate-200 font-bold text-xs uppercase tracking-tight">
                                                        <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                                                        {endDate ? format(endDate, "dd MMM yyyy", { locale: fr }) : <span>Fin</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
                                                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 shadow-xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2rem]">
                                <CardHeader className="p-8 border-b border-white/10 bg-slate-900/5">
                                    <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3">
                                        <Settings className="h-5 w-5 text-orange-500" />
                                        Statut
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="h-12 bg-white/50 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-[0.2em]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl shadow-2xl">
                                            <SelectItem value="Planifiée" className="font-bold py-3 uppercase text-[10px] tracking-widest">Planifiée</SelectItem>
                                            <SelectItem value="En cours" className="font-bold py-3 uppercase text-[10px] tracking-widest">En cours</SelectItem>
                                            <SelectItem value="Terminée" className="font-bold py-3 uppercase text-[10px] tracking-widest">Terminée</SelectItem>
                                            <SelectItem value="Annulée" className="font-bold py-3 uppercase text-[10px] tracking-widest">Annulée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="participants" className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="p-8 md:p-12 border-b border-white/10 bg-slate-900/5">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Équipage Mobilisé</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Gérez le personnel assigné à cette mission</CardDescription>
                                </div>
                                <SearchableSelect
                                    items={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                    onValueChange={handleAddParticipant}
                                    placeholder="ADJOINDRE UN AGENT..."
                                    searchPlaceholder="NOM OU ID AGENT..."
                                    className="w-full md:w-80 h-12 bg-white rounded-xl shadow-lg border-slate-200"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="py-6 px-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Nom & Prénoms</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Référence Ordre</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Mode de Transport</TableHead>
                                            <TableHead className="text-right px-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {participants.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-24">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <UserPlus className="h-10 w-10 text-slate-200" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Aucun membre d'équipage assigné</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            participants.map((p, i) => (
                                                <TableRow key={i} className="hover:bg-white/40 transition-colors group h-20">
                                                    <TableCell className="px-12">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center font-black text-white text-xs">
                                                                {p.employeeName.charAt(0)}
                                                            </div>
                                                            <span className="font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{p.employeeName}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input 
                                                            placeholder="N° ORDRE" 
                                                            className="h-10 w-32 rounded-lg border-slate-200 bg-white/50 font-bold text-[10px] tracking-widest transition-all focus:bg-white" 
                                                            value={p.numeroOrdre || ""} 
                                                            onChange={(e) => handleUpdateParticipant(i, { numeroOrdre: e.target.value })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Select value={p.moyenTransport} onValueChange={(v: any) => handleUpdateParticipant(i, { moyenTransport: v })}>
                                                            <SelectTrigger className="h-10 w-48 rounded-lg border-slate-200 bg-white/50 font-bold text-[10px] tracking-widest transition-all focus:bg-white uppercase">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl shadow-2xl">
                                                                <SelectItem value="Véhicule CNRCT" className="font-bold py-3 uppercase text-[9px] tracking-widest">Véhicule CNRCT</SelectItem>
                                                                <SelectItem value="Véhicule personnel" className="font-bold py-3 uppercase text-[9px] tracking-widest">Véhicule personnel</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="text-right px-12">
                                                        <Button type="button" variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors" onClick={() => handleRemoveParticipant(i)}>
                                                            <Trash2 className="h-5 w-5" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logistics" className="mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-white/10 shadow-2xl bg-card/40 backdrop-blur-md overflow-hidden rounded-[2.5rem]">
                        <CardHeader className="p-8 md:p-12 border-b border-white/10 bg-slate-900/5">
                            <CardTitle className="text-2xl font-black uppercase tracking-tight text-slate-900">Enveloppe Logistique</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Évaluation budgétaire par membre d'équipage</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="py-6 px-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Bénéficiaire</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Carburant/Transport</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Hébergement</TableHead>
                                            <TableHead className="font-black uppercase text-[10px] tracking-widest text-slate-500">Indemnités (Journalier)</TableHead>
                                            <TableHead className="text-right px-12 font-black uppercase text-[10px] tracking-widest text-slate-500">Montant Total Global</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {participants.map((p, i) => (
                                            <TableRow key={i} className="hover:bg-white/40 transition-colors border-border/10 h-24">
                                                <TableCell className="px-12 font-black uppercase tracking-tight text-slate-900 text-sm">
                                                    {p.employeeName}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative w-36">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <Input 
                                                            type="number" 
                                                            className="h-12 pl-10 rounded-xl border-slate-200 bg-white/50 font-black text-sm transition-all focus:bg-white" 
                                                            value={p.coutTransport || 0} 
                                                            onChange={(e) => handleUpdateParticipant(i, { coutTransport: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative w-36">
                                                        <Hotel className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <Input 
                                                            type="number" 
                                                            className="h-12 pl-10 rounded-xl border-slate-200 bg-white/50 font-black text-sm transition-all focus:bg-white" 
                                                            value={p.coutHebergement || 0} 
                                                            onChange={(e) => handleUpdateParticipant(i, { coutHebergement: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="relative w-36">
                                                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                                        <Input 
                                                            type="number" 
                                                            className="h-12 pl-10 rounded-xl border-slate-200 bg-white/50 font-black text-sm transition-all focus:bg-white" 
                                                            value={p.totalIndemnites || 0} 
                                                            onChange={(e) => handleUpdateParticipant(i, { totalIndemnites: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right px-12">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-md font-black text-slate-900 tracking-tighter">
                                                            {((p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0)).toLocaleString()} <span className="text-[10px] text-slate-400 ml-1">F CFA</span>
                                                        </span>
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Calcul Automatique</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );
}
