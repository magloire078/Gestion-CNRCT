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
import { Upload, Loader2, Save, X, Trash2, UserCircle2, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Checkbox } from "@/components/ui/checkbox";

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

  const handleSelectChange = (id: keyof Employe, value: any) => {
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

  const handleValueChange = (id: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [id]: value }));
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
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">Modifier le profil</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Édition du dossier : {employee.name}</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting} className="h-10 rounded-lg border-slate-200 font-bold text-[10px] uppercase tracking-widest">
            <X className="mr-2 h-3.5 w-3.5" /> Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="h-10 rounded-lg bg-slate-900 font-bold text-[10px] uppercase tracking-widest">
            {isSubmitting ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
            Enregistrer
          </Button>
        </div>
      </div>

    <div className="space-y-10">
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* --- LEFT SIDEBAR: PROFILE & STATUS --- */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden sticky top-8">
            <CardHeader className="bg-slate-900 text-white p-6">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Profil & État</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex flex-col items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-2 bg-blue-500 rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-all duration-700" />
                  <Avatar className="h-40 w-40 rounded-xl border-4 border-white shadow-2xl relative z-10">
                    <AvatarImage src={photoPreview} alt={employee.name} className="object-cover" />
                    <AvatarFallback className="text-4xl font-black bg-slate-100 text-slate-400 uppercase">{employee.lastName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Button 
                    type="button" 
                    size="icon" 
                    className="absolute -bottom-1 -right-1 h-10 w-10 rounded-lg bg-slate-900 border-2 border-white shadow-2xl relative z-20 hover:scale-110 transition-transform" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 text-white" />
                  </Button>
                </div>
                <div className="text-center">
                   <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 leading-none">Matricule</p>
                   <p className="text-xl font-black text-slate-900 tracking-widest">{formData.matricule}</p>
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} title="Sélectionner une photo de profil" />
              </div>

              <div className="space-y-6 pt-6 border-t border-slate-100">
                <div className="space-y-3">
                  <Label htmlFor="status" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Statut Administratif</Label>
                  <Select value={formData.status} onValueChange={(v: Employe['status']) => handleSelectChange('status', v)}>
                    <SelectTrigger id="status" className={cn("h-12 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest shadow-sm", formData.status === 'Actif' ? 'text-emerald-600 bg-emerald-50/30 border-emerald-100' : 'text-slate-600')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                      <SelectItem value="Actif" className="font-bold py-3 uppercase text-[9px] tracking-widest text-emerald-600">Actif</SelectItem>
                      <SelectItem value="En congé" className="font-bold py-3 uppercase text-[9px] tracking-widest text-blue-600">En congé</SelectItem>
                      <SelectItem value="Licencié" className="font-bold py-3 uppercase text-[9px] tracking-widest text-rose-600">Licencié</SelectItem>
                      <SelectItem value="Retraité" className="font-bold py-3 uppercase text-[9px] tracking-widest text-slate-500">Retraité</SelectItem>
                      <SelectItem value="Décédé" className="font-bold py-3 uppercase text-[9px] tracking-widest">Décédé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="sexe" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Sexe / Genre</Label>
                  <Select value={formData.sexe} onValueChange={(v) => handleSelectChange('sexe', v)}>
                    <SelectTrigger id="sexe" className="h-12 rounded-xl border-slate-200 bg-white font-bold text-slate-900 shadow-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                      <SelectItem value="Homme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Homme</SelectItem>
                      <SelectItem value="Femme" className="font-bold py-3 uppercase text-[9px] tracking-widest">Femme</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- MAIN CONTENT: DETAILS TABS --- */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="identity" className="w-full space-y-6">
            <TabsList className="flex bg-white/40 backdrop-blur-xl border border-white/20 p-1.5 rounded-2xl shadow-xl shadow-slate-200/40 w-fit h-auto gap-1">
              <TabsTrigger value="identity" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                <UserCircle2 className="mr-2 h-4 w-4" /> Identity
              </TabsTrigger>
              <TabsTrigger value="job" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                <Briefcase className="mr-2 h-4 w-4" /> Career
              </TabsTrigger>
              <TabsTrigger value="finance" className="rounded-xl px-6 py-3 data-[state=active]:bg-slate-900 data-[state=active]:text-white font-black uppercase tracking-widest text-[9px] transition-all">
                <Save className="mr-2 h-4 w-4" /> Salary
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[600px] pr-4">
              <TabsContent value="identity" className="space-y-6 m-0 focus-visible:outline-none">
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Données Individuelles</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="lastName" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nom de famille</Label>
                      <DebouncedInput id="lastName" value={formData.lastName || ''} onChange={(val) => handleValueChange('lastName', val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold uppercase" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="firstName" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Prénom(s)</Label>
                      <DebouncedInput id="firstName" value={formData.firstName || ''} onChange={(val) => handleValueChange('firstName', val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Canal Email</Label>
                      <DebouncedInput id="email" type="email" value={formData.email || ''} onChange={(val) => handleValueChange('email', val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm italic" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="mobile" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Téléphone Mobile</Label>
                      <DebouncedInput id="mobile" value={formData.mobile || ''} onChange={(val) => handleValueChange('mobile', val as string)} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Date_Naissance" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Date de naissance</Label>
                      <Input id="Date_Naissance" type="date" value={formData.Date_Naissance || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Lieu_Naissance" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Lieu de naissance</Label>
                      <Input id="Lieu_Naissance" value={formData.Lieu_Naissance || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Origine & Résidence</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="Region" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Région Administrative</Label>
                      <Select 
                        value={formData.Region || ''} 
                        onValueChange={(v) => handleSelectChange('Region', v)}
                      >
                        <SelectTrigger id="Region" className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold">
                          <SelectValue placeholder="Choisir une région..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-3xl max-h-[300px]">
                          {IVORIAN_REGIONS.map(r => <SelectItem key={r} value={r} className="font-bold py-3 uppercase text-[9px] tracking-widest">{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Departement" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Département de résidence</Label>
                      <Input id="Departement" value={formData.Departement || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="subPrefecture" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Sous-Préfecture</Label>
                      <Input id="subPrefecture" value={formData.subPrefecture || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Village" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Village / Quartier</Label>
                      <Input id="Village" value={formData.Village || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white shadow-sm font-bold" />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="job" className="space-y-6 m-0 focus-visible:outline-none">
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Temporalité</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="poste" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Intitulé du Poste</Label>
                      <DebouncedInput id="poste" value={formData.poste || ''} onChange={(val) => handleValueChange('poste', val as string)} className="h-12 rounded-xl border-slate-200 bg-white font-black uppercase text-blue-600 shadow-sm" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="dateEmbauche" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Date d'engagement</Label>
                      <Input id="dateEmbauche" type="date" value={formData.dateEmbauche || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white font-bold" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Date_Depart" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Date de départ (Prévue)</Label>
                      <Input id="Date_Depart" type="date" value={formData.Date_Depart || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white font-bold text-rose-500" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="Num_Decision" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Référence Acte Administratif</Label>
                      <Input id="Num_Decision" value={formData.Num_Decision || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white font-mono font-bold" placeholder="DEC-..." />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Structure</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="departmentId" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Département Parent</Label>
                      <Select value={formData.departmentId} onValueChange={(v) => handleSelectChange('departmentId', v)}>
                        <SelectTrigger id="departmentId" className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                          {departmentList.map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-3 uppercase text-[9px] tracking-widest">{d.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="directionId" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Direction</Label>
                        <Select value={formData.directionId} onValueChange={(v) => handleSelectChange('directionId', v)} disabled={filteredDirections.length === 0}>
                          <SelectTrigger id="directionId" className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                            {filteredDirections.map(d => <SelectItem key={d.id} value={d.id} className="font-bold py-3 uppercase text-[8px] tracking-widest">{d.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="serviceId" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Unité / Service</Label>
                        <Select value={formData.serviceId} onValueChange={(v) => handleSelectChange('serviceId', v)} disabled={filteredServices.length === 0}>
                          <SelectTrigger id="serviceId" className="h-12 rounded-xl border-slate-200 bg-white font-bold"><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent className="rounded-xl border-slate-100 shadow-3xl">
                            {filteredServices.map(s => <SelectItem key={s.id} value={s.id} className="font-bold py-3 uppercase text-[8px] tracking-widest">{s.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="finance" className="space-y-6 m-0 focus-visible:outline-none">
                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Paiement</CardTitle></CardHeader>
                  <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="banque" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Établissement Bancaire</Label>
                      <Input id="banque" value={formData.banque || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white font-black italic tracking-widest" />
                    </div>
                    <div className="space-y-3">
                      <Label htmlFor="numeroCompte" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Numéro de Compte (RIP)</Label>
                      <Input id="numeroCompte" value={formData.numeroCompte || ''} onChange={handleInputChange} className="h-12 rounded-xl border-slate-200 bg-white font-mono font-black tracking-widest" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none bg-white/40 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-200/50 border border-white/20 overflow-hidden">
                  <CardHeader className="p-6 pb-3 border-b border-white/10 bg-slate-50/50"><CardTitle className="text-lg font-black uppercase tracking-tight text-slate-800">Social & Aptitudes</CardTitle></CardHeader>
                  <CardContent className="p-6 space-y-6">
                     <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex items-center space-x-4">
                          <Checkbox 
                            id="CNPS" 
                            checked={!!formData.CNPS} 
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, CNPS: !!checked }))}
                            className="h-8 w-8 rounded-xl border-blue-200 bg-white data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 shadow-xl transition-all"
                          />
                          <Label htmlFor="CNPS" className="text-[11px] font-black uppercase tracking-widest text-slate-700 cursor-pointer">Immatriculation CNPS Active</Label>
                        </div>
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                           <div className="space-y-2">
                             <Label htmlFor="Date_Immatriculation" className="text-[9px] font-black uppercase tracking-widest text-blue-600 ml-1">Date d'immatriculation</Label>
                             <Input 
                               id="Date_Immatriculation" 
                               type="date" 
                               value={formData.Date_Immatriculation || ''} 
                               onChange={handleInputChange} 
                               disabled={!formData.CNPS}
                               className="h-12 rounded-2xl border-blue-200 bg-white/60 font-bold"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label htmlFor="Date_Cessation_CNPS" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Cessation (Optionnel)</Label>
                             <Input 
                               id="Date_Cessation_CNPS" 
                               type="date" 
                               value={formData.Date_Cessation_CNPS || ''} 
                               onChange={handleInputChange} 
                               disabled={!formData.CNPS}
                               className="h-12 rounded-2xl border-slate-200 bg-white/60 font-bold"
                             />
                           </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <Label htmlFor="enfants" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Nombre d'enfants à charge</Label>
                        <Input id="enfants" type="number" value={formData.enfants || 0} onChange={(e) => setFormData(prev => ({ ...prev, enfants: parseInt(e.target.value) || 0 }))} className="h-12 rounded-xl border-slate-200 bg-white font-black" />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="skills" className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">Expertises Clefs (Séparées par ,)</Label>
                        <Textarea 
                          id="skills" 
                          value={Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')} 
                          onChange={handleInputChange} 
                          className="rounded-2xl border-slate-200 bg-white/60 min-h-[100px] p-6 text-sm font-medium focus-visible:ring-blue-500/50 shadow-inner" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </form>

      {/* --- STICKY ACTIONS FOOTER --- */}
      <div className="sticky bottom-6 left-0 right-0 z-50 px-4 md:px-0">
        <div className="max-w-5xl mx-auto bg-white/40 backdrop-blur-2xl border border-white/30 p-3 rounded-2xl shadow-3xl flex gap-3">
           <Button 
            variant="outline" 
            onClick={() => router.back()} 
            disabled={isSubmitting}
            className="h-12 flex-1 rounded-xl border-slate-200 bg-white font-black uppercase tracking-widest text-[9px] hover:bg-slate-50 shadow-xl"
          >
            <X className="mr-2 h-4 w-4 text-slate-400" /> Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="h-12 flex-[2] rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] hover:bg-black shadow-2xl shadow-black/20 group transition-all"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-5 w-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
            {isSubmitting ? "Enregistrement..." : "Sauvegarder le dossier"}
          </Button>
        </div>
      </div>
    </div>

    </div>
  );
}
