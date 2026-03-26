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

    return (
        <form onSubmit={handleSubmit} className="space-y-8 pb-20">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold">Configuration de la Mission</h2>
                        <p className="text-sm text-muted-foreground">Modifier les paramètres et participants</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button type="submit" disabled={isSubmitting} className="bg-slate-900 rounded-lg h-10 px-6">
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Enregistrer les modifications
                    </Button>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-slate-100 p-1 rounded-xl">
                    <TabsTrigger value="general" className="rounded-lg gap-2">
                        <FileText className="h-4 w-4" /> Général
                    </TabsTrigger>
                    <TabsTrigger value="participants" className="rounded-lg gap-2">
                        <UserPlus className="h-4 w-4" /> Participants
                    </TabsTrigger>
                    <TabsTrigger value="logistics" className="rounded-lg gap-2">
                        <Car className="h-4 w-4" /> Logistique
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <Card className="border-none shadow-sm bg-slate-50">
                            <CardHeader>
                                <CardTitle className="text-md flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-blue-500" /> Informations de Base
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Titre de la mission</Label>
                                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description détaillée</Label>
                                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="bg-white" />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-none shadow-sm bg-slate-50">
                                <CardHeader>
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-emerald-500" /> Période & Lieu
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Date de début</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left bg-white", !startDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {startDate ? format(startDate, "dd MMM yyyy", { locale: fr }) : <span>Début</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date de fin</Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant={"outline"} className={cn("w-full justify-start text-left bg-white", !endDate && "text-muted-foreground")}>
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {endDate ? format(endDate, "dd MMM yyyy", { locale: fr }) : <span>Fin</span>}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lieu">Lieu / Destination</Label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input id="lieu" placeholder="Ex: Yamoussoukro, Abidjan..." value={lieuMission} onChange={(e) => setLieuMission(e.target.value)} className="pl-10 bg-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-slate-50">
                                <CardHeader>
                                    <CardTitle className="text-md flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-orange-500" /> État de la Mission
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Planifiée">Planifiée</SelectItem>
                                            <SelectItem value="En cours">En cours</SelectItem>
                                            <SelectItem value="Terminée">Terminée</SelectItem>
                                            <SelectItem value="Annulée">Annulée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="participants" className="mt-8 space-y-6">
                    <Card className="border-none shadow-sm bg-slate-50">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Equipe de Mission</CardTitle>
                                <CardDescription>Ajoutez les participants et gérez leurs rôles.</CardDescription>
                            </div>
                            <SearchableSelect
                                items={employees.map(emp => ({ value: emp.id, label: emp.name }))}
                                onValueChange={handleAddParticipant}
                                placeholder="Ajouter un participant"
                                searchPlaceholder="Rechercher un employé..."
                                className="w-64 bg-white"
                            />
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Employé</TableHead>
                                        <TableHead>Numéro d'ordre</TableHead>
                                        <TableHead>Moyen de Transport</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                                                Aucun participant ajouté à cette mission.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        participants.map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="font-medium">{p.employeeName}</TableCell>
                                                <TableCell>
                                                    <Input 
                                                        placeholder="N° Ordre" 
                                                        className="h-8 max-w-[120px] bg-white" 
                                                        value={p.numeroOrdre || ""} 
                                                        onChange={(e) => handleUpdateParticipant(i, { numeroOrdre: e.target.value })}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Select value={p.moyenTransport} onValueChange={(v: any) => handleUpdateParticipant(i, { moyenTransport: v })}>
                                                        <SelectTrigger className="h-8 w-44 bg-white">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Véhicule CNRCT">Véhicule CNRCT</SelectItem>
                                                            <SelectItem value="Véhicule personnel">Véhicule personnel</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => handleRemoveParticipant(i)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="logistics" className="mt-8 space-y-6">
                    <Card className="border-none shadow-sm bg-slate-50">
                        <CardHeader>
                            <CardTitle>Estimation Budgétaire & Logistique</CardTitle>
                            <CardDescription>Indemnités et frais prévus par participant.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Participant</TableHead>
                                        <TableHead className="flex items-center gap-2">
                                            <Car className="h-3 w-3" /> Transport
                                        </TableHead>
                                        <TableHead className="flex items-center gap-2">
                                            <Hotel className="h-3 w-3" /> Hébergement
                                        </TableHead>
                                        <TableHead className="flex items-center gap-2">
                                            <CreditCard className="h-3 w-3" /> Indemnités
                                        </TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((p, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{p.employeeName}</TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    className="h-8 w-28 bg-white" 
                                                    value={p.coutTransport || 0} 
                                                    onChange={(e) => handleUpdateParticipant(i, { coutTransport: Number(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    className="h-8 w-28 bg-white" 
                                                    value={p.coutHebergement || 0} 
                                                    onChange={(e) => handleUpdateParticipant(i, { coutHebergement: Number(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    type="number" 
                                                    className="h-8 w-28 bg-white" 
                                                    value={p.totalIndemnites || 0} 
                                                    onChange={(e) => handleUpdateParticipant(i, { totalIndemnites: Number(e.target.value) })}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                {((p.coutTransport || 0) + (p.coutHebergement || 0) + (p.totalIndemnites || 0)).toLocaleString()} F
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </form>
    );
}
