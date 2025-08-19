

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEmployee, updateEmployee } from "@/services/employee-service";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";


import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, User, Briefcase, BadgeCheck, Save, Upload, MapPin, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Status = 'Actif' | 'En congé' | 'Licencié' | 'Retraité' | 'Décédé';

export default function EmployeeEditPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [employee, setEmployee] = useState<Partial<Employe> | null>(null);
    const [departmentList, setDepartmentList] = useState<Department[]>([]);
    const [directionList, setDirectionList] = useState<Direction[]>([]);
    const [serviceList, setServiceList] = useState<Service[]>([]);

    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [skillsString, setSkillsString] = useState("");

    const [photoPreview, setPhotoPreview] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchEmployee() {
            try {
                const [data, depts, dirs, svcs] = await Promise.all([
                  getEmployee(id),
                  getDepartments(),
                  getDirections(),
                  getServices(),
                ]);
                setEmployee(data);
                if (data?.photoUrl) {
                    setPhotoPreview(data.photoUrl);
                }
                setDepartmentList(depts);
                setDirectionList(dirs);
                setServiceList(svcs);
                if (data?.skills) {
                    setSkillsString(data.skills.join(', '));
                }
            } catch (error) {
                console.error("Failed to fetch employee", error);
                toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données de l'employé." });
            } finally {
                setLoading(false);
            }
        }
        fetchEmployee();
    }, [id, toast]);

    const selectedDepartmentObject = useMemo(() => {
        if (!employee?.department) return null;
        return departmentList.find(d => d.name === employee.department);
    }, [employee?.department, departmentList]);

    const filteredDirections = useMemo(() => {
        if (!selectedDepartmentObject) return [];
        return directionList.filter(dir => dir.departmentId === selectedDepartmentObject.id);
    }, [selectedDepartmentObject, directionList]);
        
    const filteredServices = useMemo(() => {
        const selectedDir = directionList.find(d => d.name === employee?.direction);
        if (selectedDir) {
            return serviceList.filter(s => s.directionId === selectedDir.id);
        }
        if (selectedDepartmentObject) {
            return serviceList.filter(s => s.departmentId === selectedDepartmentObject.id);
        }
        return [];
    }, [employee?.direction, selectedDepartmentObject, directionList, serviceList]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEmployee(prev => (prev ? { ...prev, [name]: value } : null));
    };

    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEmployee(prev => {
            if (!prev) return null;
            const parsedValue = value === '' ? undefined : parseInt(value, 10);
            return { ...prev, [name]: isNaN(parsedValue as number) ? undefined : parsedValue };
        });
    };

     const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSelectChange = (name: string, value: string) => {
        const newState: Partial<Employe> = { ...employee, [name]: value };
        if (name === 'department') {
            newState.direction = '';
            newState.service = '';
        }
        if (name === 'direction') {
            newState.service = '';
        }
        setEmployee(newState);
    };

    const handleSave = async () => {
        if (!employee || typeof id !== 'string') return;
        setIsSaving(true);
        try {
            const fullName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
            const updatedData = {
                ...employee,
                name: fullName,
                skills: skillsString.split(',').map(s => s.trim()).filter(s => s)
            };
            await updateEmployee(id, updatedData, photoFile);
            toast({ title: "Succès", description: "Les informations de l'employé ont été mises à jour." });
            router.back();
        } catch (error) {
            console.error("Failed to save employee", error);
            toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };

    const fullName = employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.name || "Chargement..." : "Chargement...";


    if (loading) {
        return <EmployeeEditSkeleton />;
    }

    if (!employee) {
        return <div className="text-center py-10">Employé non trouvé.</div>;
    }

    return (
         <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier l'Employé</h1>
                    <p className="text-muted-foreground">{fullName}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Info */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><User className="h-5 w-5 text-primary"/> Informations Personnelles</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Photo</Label>
                            <div className="flex items-center gap-4">
                                 <Avatar className="h-20 w-20">
                                    <AvatarImage src={photoPreview} alt={employee.name} data-ai-hint="employee photo" />
                                    <AvatarFallback>{employee.name?.charAt(0) || 'E'}</AvatarFallback>
                                 </Avatar>
                                 <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
                                    <Upload className="mr-2 h-4 w-4" /> Changer
                                 </Button>
                                 <Input ref={photoInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange}/>
                            </div>
                        </div>
                         <div />
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Nom</Label>
                            <Input id="lastName" name="lastName" value={employee.lastName || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Prénom(s)</Label>
                            <Input id="firstName" name="firstName" value={employee.firstName || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="Date_Naissance">Date de Naissance</Label>
                            <Input id="Date_Naissance" name="Date_Naissance" type="date" value={employee.Date_Naissance || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="Lieu_Naissance">Lieu de Naissance</Label>
                            <Input id="Lieu_Naissance" name="Lieu_Naissance" value={employee.Lieu_Naissance || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" value={employee.email || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobile">Téléphone</Label>
                            <Input id="mobile" name="mobile" value={employee.mobile || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sexe">Sexe</Label>
                             <Select name="sexe" value={employee.sexe || ''} onValueChange={(v) => handleSelectChange('sexe', v)}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Homme">Homme</SelectItem>
                                    <SelectItem value="Femme">Femme</SelectItem>
                                    <SelectItem value="Autre">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="enfants">Nombre d'enfants</Label>
                            <Input id="enfants" name="enfants" type="number" value={employee.enfants ?? ''} onChange={handleNumberInputChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Info */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary"/> Informations Professionnelles</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="matricule">Matricule</Label>
                            <Input id="matricule" name="matricule" value={employee.matricule || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="poste">Poste</Label>
                            <Input id="poste" name="poste" value={employee.poste || ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                            <Input id="dateEmbauche" name="dateEmbauche" type="date" value={employee.dateEmbauche || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="Date_Immatriculation">Date d'immatriculation CNPS</Label>
                            <Input id="Date_Immatriculation" name="Date_Immatriculation" type="date" value={employee.Date_Immatriculation || ''} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Département</Label>
                            <Select name="department" value={employee.department || ''} onValueChange={(v) => handleSelectChange('department', v)}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent>
                                    {departmentList.map(dep => <SelectItem key={dep.id} value={dep.name}>{dep.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="direction">Direction</Label>
                            <Select name="direction" value={employee.direction || ''} onValueChange={(v) => handleSelectChange('direction', v)} disabled={!employee.department}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent>
                                    {filteredDirections.map(dir => <SelectItem key={dir.id} value={dir.name}>{dir.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="service">Service</Label>
                            <Select name="service" value={employee.service || ''} onValueChange={(v) => handleSelectChange('service', v)} disabled={!employee.department || filteredServices.length === 0}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent>
                                    {filteredServices.map(svc => <SelectItem key={svc.id} value={svc.name}>{svc.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="status">Statut</Label>
                             <Select name="status" value={employee.status || ''} onValueChange={(v) => handleSelectChange('status', v)}>
                                <SelectTrigger><SelectValue placeholder="Sélectionnez..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Actif">Actif</SelectItem>
                                    <SelectItem value="En congé">En congé</SelectItem>
                                    <SelectItem value="Licencié">Licencié</SelectItem>
                                    <SelectItem value="Retraité">Retraité</SelectItem>
                                    <SelectItem value="Décédé">Décédé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="Date_Depart">Date de départ</Label>
                            <Input id="Date_Depart" name="Date_Depart" type="date" value={employee.Date_Depart || ''} onChange={handleInputChange} />
                        </div>
                    </CardContent>
                </Card>

                 {/* Location Info for Board/Regional members */}
                <Card className="lg:col-span-3">
                     <CardHeader>
                        <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Informations de Localisation</CardTitle>
                        <CardDescription>Pertinent pour les membres du directoire et des comités régionaux.</CardDescription>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="Region">Région</Label>
                            <Input id="Region" name="Region" value={employee.Region || ''} onChange={handleInputChange} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="Village">Village</Label>
                            <Input id="Village" name="Village" value={employee.Village || ''} onChange={handleInputChange} />
                        </div>
                    </CardContent>
                </Card>

                {/* Skills */}
                 <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-primary"/> Compétences</CardTitle>
                        <CardDescription>Séparez les compétences par une virgule.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         <Textarea 
                            name="skills"
                            value={skillsString}
                            onChange={(e) => setSkillsString(e.target.value)}
                            rows={3}
                            placeholder="Gestion de projet, Leadership, Communication..."
                         />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function EmployeeEditSkeleton() {
    return (
         <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-10 w-32 ml-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-3">
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </CardContent>
                </Card>
                 <Card className="lg:col-span-3">
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent>
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
