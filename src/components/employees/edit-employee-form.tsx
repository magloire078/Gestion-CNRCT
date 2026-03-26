"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Employe, Department, Direction, Service } from "@/lib/data";
import { getDepartments } from "@/services/department-service";
import { getDirections } from "@/services/direction-service";
import { getServices } from "@/services/service-service";
import { updateEmployee } from "@/services/employee-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2, Save, X, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IVORIAN_REGIONS } from "@/constants/regions";

interface EditEmployeeFormProps {
  employee: Employe;
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<Employe>>(employee);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(employee.photoUrl || `https://placehold.co/100x100.png`);
  
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [directionList, setDirectionList] = useState<Direction[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [depts, dirs, svcs] = await Promise.all([
          getDepartments(),
          getDirections(),
          getServices(),
        ]);
        setDepartmentList(depts);
        setDirectionList(dirs);
        setServiceList(svcs);
      } catch (err) {
        console.error("Failed to fetch organizational data", err);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger les structures de l'organisation.",
        });
      } finally {
        setLoadingMetadata(false);
      }
    }
    fetchMetadata();
  }, [toast]);

  const filteredDirections = useMemo(() => {
    if (!formData.departmentId) return [];
    return directionList.filter(d => d.departmentId === formData.departmentId);
  }, [formData.departmentId, directionList]);

  const filteredServices = useMemo(() => {
    if (formData.directionId) {
      return serviceList.filter(s => s.directionId === formData.directionId);
    }
    if (formData.departmentId) {
      return serviceList.filter(s => s.departmentId === formData.departmentId && !s.directionId);
    }
    return [];
  }, [formData.departmentId, formData.directionId, serviceList]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof Employe, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [id]: value };
      if (id === 'departmentId') {
        newData.directionId = undefined;
        newData.serviceId = undefined;
      } else if (id === 'directionId') {
        newData.serviceId = undefined;
      }
      return newData;
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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      if (typeof dataToSave.skills === 'string') {
        dataToSave.skills = (dataToSave.skills as string).split(',').map(s => s.trim()).filter(Boolean);
      }
      
      await updateEmployee(employee.id, dataToSave, photoFile);
      toast({
        title: "Succès",
        description: "Les informations de l'employé ont été mises à jour.",
      });
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de mettre à jour l'employé.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le profil</h1>
          <p className="text-muted-foreground">Mise à jour des informations de {employee.name}</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            <X className="mr-2 h-4 w-4" /> Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Colonne Photo & Statut */}
        <div className="space-y-6">
          <Card className="overflow-hidden border-none shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">Avatar & Statut</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-40 w-40 rounded-2xl border-4 border-white shadow-xl">
                    <AvatarImage src={photoPreview} alt={employee.name} className="object-cover" />
                    <AvatarFallback className="text-3xl bg-slate-100">{employee.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="text-white h-8 w-8" />
                  </div>
                </div>
                <div className="flex gap-2 w-full">
                  <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Photo
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="flex-1 invisible">
                  </Button>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut de l'employé</Label>
                  <Select value={formData.status} onValueChange={(v: Employe['status']) => handleSelectChange('status', v)}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
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
                  <Label htmlFor="sexe">Sexe</Label>
                  <Select value={formData.sexe} onValueChange={(v) => handleSelectChange('sexe', v)}>
                    <SelectTrigger id="sexe"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Homme">Homme</SelectItem>
                      <SelectItem value="Femme">Femme</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Colonne Détails (Tabs) */}
        <div className="md:col-span-2">
          <Tabs defaultValue="identity" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-slate-100/50 p-1 rounded-xl">
              <TabsTrigger value="identity" className="rounded-lg font-bold text-xs uppercase tracking-widest">Identité</TabsTrigger>
              <TabsTrigger value="job" className="rounded-lg font-bold text-xs uppercase tracking-widest">Poste & Structure</TabsTrigger>
              <TabsTrigger value="finance" className="rounded-lg font-bold text-xs uppercase tracking-widest">Finance & Social</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[600px] pr-4">
              <TabsContent value="identity" className="space-y-6 m-0">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Informations Personnelles</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom de famille</Label>
                      <Input id="lastName" value={formData.lastName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom(s)</Label>
                      <Input id="firstName" value={formData.firstName || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email professionnel</Label>
                      <Input id="email" type="email" value={formData.email || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">Contact mobile</Label>
                      <Input id="mobile" value={formData.mobile || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Date_Naissance">Date de naissance</Label>
                      <Input id="Date_Naissance" type="date" value={formData.Date_Naissance || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Lieu_Naissance">Lieu de naissance</Label>
                      <Input id="Lieu_Naissance" value={formData.Lieu_Naissance || ''} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Origine & Résidence</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="Region">Région</Label>
                      <Select 
                        value={formData.Region || ''} 
                        onValueChange={(v) => handleSelectChange('Region', v)}
                      >
                        <SelectTrigger id="Region"><SelectValue placeholder="Sélectionnez une région..." /></SelectTrigger>
                        <SelectContent>
                          {IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Village">Village</Label>
                      <Input id="Village" value={formData.Village || ''} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="job" className="space-y-6 m-0">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Détails du Poste</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="matricule">Matricule</Label>
                      <Input id="matricule" value={formData.matricule || ''} onChange={handleInputChange} className="bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="poste">Poste actuel</Label>
                      <Input id="poste" value={formData.poste || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                      <Input id="dateEmbauche" type="date" value={formData.dateEmbauche || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Date_Depart">Date de départ / Retraite</Label>
                      <Input id="Date_Depart" type="date" value={formData.Date_Depart || ''} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Structure Organisationnelle</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Département / Groupe</Label>
                      <Select value={formData.departmentId} onValueChange={(v) => handleSelectChange('departmentId', v)}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {departmentList.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Direction</Label>
                      <Select value={formData.directionId} onValueChange={(v) => handleSelectChange('directionId', v)} disabled={filteredDirections.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {filteredDirections.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Service</Label>
                      <Select value={formData.serviceId} onValueChange={(v) => handleSelectChange('serviceId', v)} disabled={filteredServices.length === 0}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent>
                          {filteredServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="finance" className="space-y-6 m-0">
                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Détails Bancaires</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="banque">Nom de la banque</Label>
                      <Input id="banque" value={formData.banque || ''} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="numeroCompte">Numéro de compte</Label>
                      <Input id="numeroCompte" value={formData.numeroCompte || ''} onChange={handleInputChange} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-lg">Informations Sociales</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex items-center space-x-2 pt-8">
                       <input 
                        type="checkbox" 
                        id="CNPS" 
                        checked={!!formData.CNPS} 
                        onChange={(e) => setFormData(prev => ({ ...prev, CNPS: e.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                       />
                       <Label htmlFor="CNPS">Déclaré à la CNPS</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="Date_Cessation_CNPS">Date de cessation CNPS</Label>
                      <Input 
                        id="Date_Cessation_CNPS" 
                        type="date" 
                        value={formData.Date_Cessation_CNPS || ''} 
                        onChange={handleInputChange} 
                        disabled={!formData.CNPS}
                      />
                      <p className="text-[10px] text-muted-foreground italic">Laissez vide si toujours actif.</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enfants">Nombre d'enfants</Label>
                      <Input id="enfants" type="number" value={formData.enfants || 0} onChange={(e) => setFormData(prev => ({ ...prev, enfants: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="skills">Compétences (séparées par des virgules)</Label>
                      <Textarea 
                        id="skills" 
                        value={Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')} 
                        onChange={handleInputChange} 
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </form>

    </div>
  );
}
