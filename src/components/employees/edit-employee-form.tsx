"use client";

import { useState, useRef, useEffect, useMemo, useCallback, startTransition, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { updateEmployee, getEmployeeDirectory } from "@/services/employee-service";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Upload, 
  Loader2, 
  Save, 
  X, 
  UserCircle2, 
  Briefcase, 
  Check, 
  Crown, 
  Layers, 
  Wallet, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  ChevronLeft,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IVORIAN_REGIONS } from "@/constants/regions";
import { divisions } from "@/lib/ivory-coast-divisions";
import { getOfficialRegion, getOfficialDepartment, getRegionFromDepartment } from "@/lib/normalization-utils";
import { ALL_CHIEF_STATUSES, getMemberChiefStatuses, type ChiefStatusType } from "@/lib/comites-regionaux-2026";
import { isTraditionalAuthorityOrMember } from "@/lib/employee-utils";
import { DebouncedInput } from "@/components/ui/debounced-input";
import { Checkbox } from "@/components/ui/checkbox";
import { VillageCombobox } from "@/components/chiefs/village-combobox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";

const MILITARY_RANKS = [
  "Soldat de 2ème classe",
  "Soldat de 1ère classe",
  "Caporal",
  "Caporal-Chef",
  "Gendarme",
  "Sergent",
  "Sergent-Chef",
  "Maréchal des Logis (MDL)",
  "Maréchal des Logis-Chef (MDL-Chef)",
  "Adjudant",
  "Adjudant-Chef",
  "Adjudant-Chef Major",
  "Aspirant",
  "Sous-Lieutenant",
  "Lieutenant",
  "Commandant",
  "Lieutenant-Colonel",
  "Colonel"
];

const CIVILITIES = [
  "M.",
  "Mme",
  "Mlle",
  "Dr",
  "Pr",
  "Sa Majesté",
  "Nanan",
  "Honorable",
  "Vénérable"
];

const MARITAL_STATUSES = [
  "Célibataire",
  "Marié(e)",
  "Divorcé(e)",
  "Veuf/Veuve",
  "Union libre"
];

interface EditEmployeeFormProps {
  employee: Employe;
}

export function EditEmployeeForm({ employee }: EditEmployeeFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  
  const [activeTab, setActiveTab] = useState("identity");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(employee.photoUrl || "");
  
  const [departmentList, setDepartmentList] = useState<Department[]>([]);
  const [directionList, setDirectionList] = useState<Direction[]>([]);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [inactiveEmployees, setInactiveEmployees] = useState<Employe[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(true);

  // Initialize traditional mode based on strict detection
  const initialTraditional = useMemo(() => {
    if ((employee as any).isTraditional === false) return false;
    if ((employee as any).isTraditional === true) return true;
    return isTraditionalAuthorityOrMember(employee, employee.department);
  }, [employee]);

  const [isTraditionalMode, setIsTraditionalMode] = useState<boolean>(initialTraditional);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Employe>>(() => {
    const rawReg = employee.Region || (employee as any).region || '';
    const normReg = getOfficialRegion(rawReg);
    const reg = (normReg && (IVORIAN_REGIONS as readonly string[]).includes(normReg))
      ? normReg
      : (getRegionFromDepartment(employee.Departement || (employee as any).departement || employee.department || '') || rawReg);

    const rawDept = employee.Departement || (employee as any).departement || '';
    const dept = reg ? getOfficialDepartment(reg, rawDept) : rawDept;

    const initialStatuts = (employee.statutChef && employee.statutChef.length > 0)
      ? employee.statutChef
      : (initialTraditional ? getMemberChiefStatuses(employee) : []);

    return {
      ...employee,
      Region: reg,
      Departement: dept,
      sexe: employee.sexe || 'H',
      statutChef: initialStatuts,
      civilite: employee.civilite || 'M.',
      situationMatrimoniale: employee.situationMatrimoniale || 'Célibataire',
      enfants: employee.enfants ?? 0,
    };
  });

  useEffect(() => {
    async function fetchMetadata() {
      try {
        const [depts, dirs, svcs, employees] = await Promise.all([
          getDepartments(),
          getDirections(),
          getServices(),
          getEmployeeDirectory(),
        ]);
        setDepartmentList(depts);
        setDirectionList(dirs);
        setServiceList(svcs);
        setInactiveEmployees(employees.filter(e => e.status === 'Décédé' || e.status === 'Remplacé' || e.status === 'Licencié'));
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

  // Current department name
  const currentDeptName = useMemo(() => {
    return departmentList.find(d => d.id === formData.departmentId)?.name || '';
  }, [formData.departmentId, departmentList]);

  // Handle traditional mode toggle
  const handleToggleTraditional = useCallback((checked: boolean) => {
    setIsTraditionalMode(checked);
    if (!checked) {
      startTransition(() => {
        setFormData(prev => ({
          ...prev,
          statutChef: []
        }));
        if (activeTab === 'chefferie') {
          setActiveTab('identity');
        }
      });
      toast({
        title: "Mode Standard Activé",
        description: "Les informations coutumières sont désormais désactivées pour cet agent.",
      });
    } else {
      toast({
        title: "Mode Profil Coutumier Activé",
        description: "L'onglet Chefferie & Territoire est maintenant disponible.",
      });
    }
  }, [activeTab, toast]);

  const officialRegion = useMemo(() => getOfficialRegion(formData.Region || ""), [formData.Region]);
  const officialDepartment = useMemo(() => getOfficialDepartment(formData.Region || "", formData.Departement || ""), [formData.Region, formData.Departement]);

  const availableDepartments = useMemo(() => {
    if (!officialRegion) return [];
    return Object.keys(divisions[officialRegion] || {}).sort();
  }, [officialRegion]);

  const availableSubPrefectures = useMemo(() => {
    if (!officialRegion || !officialDepartment) return [];
    return Object.keys(divisions[officialRegion]?.[officialDepartment] || {}).sort();
  }, [officialRegion, officialDepartment]);

  const isGardeOrGendarme = useMemo(() => {
    return currentDeptName === "Garde Républicaine" || currentDeptName === "Gendarmes";
  }, [currentDeptName]);

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

  // High performance non-blocking change handlers
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    startTransition(() => {
      setFormData(prev => {
        const newData = { ...prev, [id]: value };
        
        if (id === 'dateEmbauche') {
          const isGarde = currentDeptName === "Garde Républicaine";
          if (isGarde && value) {
            try {
              const start = new Date(value);
              if (!isNaN(start.getTime())) {
                start.setMonth(start.getMonth() + 6);
                newData.Date_Depart = start.toISOString().split('T')[0];
              }
            } catch (err) {
              console.error("Invalid dateEmbauche:", err);
            }
          }
        }
        return newData;
      });
    });
  }, [currentDeptName]);

  const handleSelectChange = useCallback((id: keyof Employe, value: any) => {
    startTransition(() => {
      setFormData(prev => {
        const newData = { ...prev, [id]: value };
        if (id === 'departmentId') {
          newData.directionId = undefined;
          newData.serviceId = undefined;
          
          const isGarde = departmentList.find(d => d.id === value)?.name === "Garde Républicaine";
          if (isGarde && prev.dateEmbauche) {
            try {
              const start = new Date(prev.dateEmbauche);
              if (!isNaN(start.getTime())) {
                start.setMonth(start.getMonth() + 6);
                newData.Date_Depart = start.toISOString().split('T')[0];
              }
            } catch (err) {
              console.error("Invalid dateEmbauche for Garde:", err);
            }
          }
        } else if (id === 'directionId') {
          newData.serviceId = undefined;
        }
        return newData;
      });
    });
  }, [departmentList]);

  const handleValueChange = useCallback((id: string, value: string | number | boolean | string[]) => {
    startTransition(() => {
      setFormData(prev => ({ ...prev, [id]: value }));
    });
  }, []);

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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    try {
      const dataToSave = { ...formData };
      if (dataToSave.lastName || dataToSave.firstName) {
        dataToSave.name = `${dataToSave.lastName || ''} ${dataToSave.firstName || ''}`.trim() || dataToSave.name;
      }
      if (typeof dataToSave.skills === 'string') {
        dataToSave.skills = (dataToSave.skills as string).split(',').map(s => s.trim()).filter(Boolean);
      }
      
      // If employee is not in traditional mode, clear all customary and territorial fields
      dataToSave.isTraditional = isTraditionalMode;
      if (!isTraditionalMode) {
        dataToSave.statutChef = [];
        dataToSave.titresCoutumiers = [];
        dataToSave.chiefId = undefined;
        dataToSave.Region = '';
        dataToSave.Departement = '';
        dataToSave.subPrefecture = '';
        dataToSave.Village = '';
        dataToSave.mandatDebut = '';
        dataToSave.mandatFin = '';
      }

      await updateEmployee(employee.id, dataToSave, photoFile);
      toast({
        title: "Modifications enregistrées",
        description: "Le dossier de l'employé a été mis à jour avec succès.",
      });
      router.push(`/employees/${employee.id}`);
      router.refresh();
    } catch (err: any) {
      console.error("Failed to update employee:", err);
      toast({
        variant: "destructive",
        title: "Erreur d'enregistrement",
        description: err?.message || "Impossible de mettre à jour la fiche de l'employé.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManagePayroll = hasPermission('payroll:update') || hasPermission('page:payroll:update') || hasPermission('payroll:create');

  if (loadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Chargement de la structure et du dossier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24">
      {/* Top Banner with Unified Styling */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white p-6 md:p-8 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.15),transparent_70%)] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <Link 
              href={`/employees/${employee.id}`} 
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Retour à la fiche agent
            </Link>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">
                  {formData.matricule}
                </span>
                <span className="text-xs font-semibold text-slate-400">• Dossier Individuel</span>
                {isTraditionalMode && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider">
                    <Crown className="h-3 w-3 mr-1 text-amber-400" /> Profil Coutumier
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight">
                Mise à jour : {formData.lastName} <span className="text-slate-300 font-bold normal-case">{formData.firstName}</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {formData.poste || "Poste non défini"} {currentDeptName ? `• ${currentDeptName}` : ''}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons in Top Bar */}
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.back()} 
              disabled={isSubmitting} 
              className="h-10 px-4 rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 font-bold text-xs uppercase tracking-wider"
            >
              <X className="mr-1.5 h-4 w-4" /> Annuler
            </Button>
            <Button 
              type="button"
              onClick={() => handleSubmit()} 
              disabled={isSubmitting} 
              className="h-10 px-5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs uppercase tracking-wider shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</>
              ) : (
                <><Save className="mr-2 h-4 w-4 text-emerald-600" /> Enregistrer</>
              )}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar: Photo, Matricule, Administrative Status & Chief Toggle */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden sticky top-6">
            <CardHeader className="bg-slate-900 text-white p-5">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-300 flex items-center justify-between">
                <span>Profil de l'agent</span>
                <Badge variant="outline" className="border-white/20 text-white text-[9px] font-bold">
                  {formData.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-36 w-36 rounded-2xl border-4 border-slate-100 shadow-lg object-cover">
                    <AvatarImage src={photoPreview} alt={employee.name} className="object-cover" />
                    <AvatarFallback className="text-3xl font-black bg-slate-100 text-slate-400 uppercase">
                      {formData.lastName?.charAt(0) || "E"}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    type="button" 
                    size="icon" 
                    className="absolute -bottom-2 -right-2 h-9 w-9 rounded-xl bg-slate-900 hover:bg-black text-white border-2 border-white shadow-lg transition-transform hover:scale-105" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Changer la photo"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-center space-y-1 w-full">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matricule Officiel</p>
                  <DebouncedInput 
                    value={formData.matricule || ''} 
                    onChange={(val) => handleValueChange('matricule', val as string)} 
                    className="h-9 text-center font-mono font-black text-sm uppercase rounded-lg border-slate-200 bg-slate-50/50" 
                  />
                </div>
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} title="Sélectionner une photo" />
              </div>

              {/* Administrative Status */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Statut Administratif
                  </Label>
                  <Select value={formData.status} onValueChange={(v: Employe['status']) => handleSelectChange('status', v)}>
                    <SelectTrigger id="status" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Actif" className="text-emerald-600 font-bold">Actif</SelectItem>
                      <SelectItem value="En congé" className="text-blue-600 font-bold">En congé</SelectItem>
                      <SelectItem value="Licencié" className="text-rose-600 font-bold">Licencié</SelectItem>
                      <SelectItem value="Remplacé" className="text-amber-600 font-bold">Remplacé</SelectItem>
                      <SelectItem value="Retraité" className="text-slate-600 font-bold">Retraité</SelectItem>
                      <SelectItem value="Décédé" className="text-slate-900 font-bold">Décédé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexe" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                    Sexe / Genre
                  </Label>
                  <Select 
                    value={formData.sexe === 'Homme' ? 'H' : formData.sexe === 'Femme' ? 'F' : (formData.sexe || 'H')} 
                    onValueChange={(v) => handleSelectChange('sexe', v)}
                  >
                    <SelectTrigger id="sexe" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="H" className="font-bold">Homme (H)</SelectItem>
                      <SelectItem value="F" className="font-bold">Femme (F)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Profil Coutumier Toggle Switch */}
                <div className={cn(
                  "p-4 rounded-xl border transition-all space-y-2.5",
                  isTraditionalMode 
                    ? "bg-amber-50/70 border-amber-200" 
                    : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="chief-switch" 
                      className={cn(
                        "text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer select-none",
                        isTraditionalMode ? "text-amber-900" : "text-slate-700"
                      )}
                    >
                      <Crown className={cn("h-4 w-4", isTraditionalMode ? "text-amber-600" : "text-slate-400")} />
                      Profil Coutumier
                    </label>
                    <Switch 
                      id="chief-switch"
                      checked={isTraditionalMode}
                      onCheckedChange={handleToggleTraditional}
                      className="data-[state=checked]:bg-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {isTraditionalMode 
                      ? "Options territoriales & titres de chefferie activés (Directoire, Comités Régionaux, Assemblée)."
                      : "Agent standard (les champs territoriaux et coutumiers sont masqués)."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs Area */}
        <div className="lg:col-span-3 space-y-6">
          <Tabs value={activeTab} onValueChange={(v) => startTransition(() => setActiveTab(v))} className="w-full space-y-6">
            <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex flex-wrap h-auto gap-1">
              <TabsTrigger 
                value="identity" 
                className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <UserCircle2 className="mr-1.5 h-4 w-4 text-blue-600" /> Identité & État Civil
              </TabsTrigger>
              <TabsTrigger 
                value="career" 
                className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <Briefcase className="mr-1.5 h-4 w-4 text-amber-600" /> Carrière & Poste
              </TabsTrigger>
              
              {isTraditionalMode && (
                <TabsTrigger 
                  value="chefferie" 
                  className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider bg-amber-500/10 text-amber-800 data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                >
                  <Crown className="mr-1.5 h-4 w-4" /> Chefferie & Territoire
                </TabsTrigger>
              )}

              {canManagePayroll && (
                <TabsTrigger 
                  value="finance" 
                  className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                >
                  <Wallet className="mr-1.5 h-4 w-4 text-emerald-600" /> Rémunération
                </TabsTrigger>
              )}

              <TabsTrigger 
                value="social" 
                className="rounded-xl px-4 py-2.5 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
              >
                <ShieldCheck className="mr-1.5 h-4 w-4 text-indigo-600" /> Social & CNPS
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: IDENTITÉ & ÉTAT CIVIL */}
            <TabsContent value="identity" className="space-y-6 focus-visible:outline-none">
              <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-blue-600" />
                    Informations Personnelles & État Civil
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Renseignez les données d'identité et de contact de l'employé.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="civilite" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Civilité / Titre
                    </Label>
                    <Select 
                      value={formData.civilite || 'M.'} 
                      onValueChange={(val) => handleSelectChange('civilite', val)}
                    >
                      <SelectTrigger id="civilite" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {CIVILITIES.map(c => (
                          <SelectItem key={c} value={c} className="font-bold text-xs">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Nom de Famille
                    </Label>
                    <DebouncedInput 
                      id="lastName" 
                      value={formData.lastName || ''} 
                      onChange={(val) => handleValueChange('lastName', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold uppercase text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Prénom(s)
                    </Label>
                    <DebouncedInput 
                      id="firstName" 
                      value={formData.firstName || ''} 
                      onChange={(val) => handleValueChange('firstName', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Date_Naissance" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Date de Naissance
                    </Label>
                    <Input 
                      id="Date_Naissance" 
                      type="date" 
                      value={formData.Date_Naissance || ''} 
                      onChange={handleInputChange} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Lieu_Naissance" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Lieu de Naissance
                    </Label>
                    <DebouncedInput 
                      id="Lieu_Naissance" 
                      value={formData.Lieu_Naissance || ''} 
                      onChange={(val) => handleValueChange('Lieu_Naissance', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                      placeholder="Ex: Yamoussoukro, Abidjan, Bouaké..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="situationMatrimoniale" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Situation Matrimoniale
                    </Label>
                    <Select 
                      value={formData.situationMatrimoniale || 'Célibataire'} 
                      onValueChange={(val) => handleSelectChange('situationMatrimoniale', val)}
                    >
                      <SelectTrigger id="situationMatrimoniale" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {MARITAL_STATUSES.map(s => (
                          <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="enfants" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Nombre d'enfants à charge
                    </Label>
                    <Input 
                      id="enfants" 
                      type="number" 
                      min="0"
                      value={formData.enfants ?? 0} 
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        startTransition(() => {
                          setFormData(prev => ({ ...prev, enfants: val }));
                        });
                      }} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Téléphone Mobile
                    </Label>
                    <DebouncedInput 
                      id="mobile" 
                      value={formData.mobile || ''} 
                      onChange={(val) => handleValueChange('mobile', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                      placeholder="+225 07..."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Adresse Email
                    </Label>
                    <DebouncedInput 
                      id="email" 
                      type="email" 
                      value={formData.email || ''} 
                      onChange={(val) => handleValueChange('email', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs italic" 
                      placeholder="nom.prenom@cnrct.ci"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: CARRIÈRE & POSTE */}
            <TabsContent value="career" className="space-y-6 focus-visible:outline-none">
              <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    Carrière & Affectation Administrative
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="poste" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Intitulé du Poste
                    </Label>
                    <DebouncedInput 
                      id="poste" 
                      value={formData.poste || ''} 
                      onChange={(val) => handleValueChange('poste', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-black uppercase text-blue-700 text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Grade / Rang
                    </Label>
                    {isGardeOrGendarme ? (
                      <Select 
                        value={formData.grade || ''} 
                        onValueChange={(val) => handleSelectChange('grade', val)}
                      >
                        <SelectTrigger id="grade" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                          <SelectValue placeholder="Sélectionner le grade militaire..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {MILITARY_RANKS.map(r => (
                            <SelectItem key={r} value={r} className="font-bold text-xs">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <DebouncedInput 
                        id="grade" 
                        value={formData.grade || ''} 
                        onChange={(val) => handleValueChange('grade', val as string)} 
                        className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        placeholder="Ex: Cadre, Agent de maîtrise, etc."
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="categorie" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Catégorie Professionnelle
                    </Label>
                    <DebouncedInput 
                      id="categorie" 
                      value={formData.categorie || ''} 
                      onChange={(val) => handleValueChange('categorie', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                      placeholder="Ex: Hors Catégorie, Catégorie A..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Num_Decision" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Référence Acte / Décision de Nomination
                    </Label>
                    <DebouncedInput 
                      id="Num_Decision" 
                      value={formData.Num_Decision || ''} 
                      onChange={(val) => handleValueChange('Num_Decision', val as string)} 
                      className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                      placeholder="DEC-2024-..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateEmbauche" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Date d'engagement / Prise de Service
                    </Label>
                    <Input 
                      id="dateEmbauche" 
                      type="date" 
                      value={formData.dateEmbauche || ''} 
                      onChange={handleInputChange} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="Date_Depart" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Date de Départ / Fin de Mission (Prévue)
                    </Label>
                    <Input 
                      id="Date_Depart" 
                      type="date" 
                      value={formData.Date_Depart || ''} 
                      onChange={handleInputChange} 
                      className="h-11 rounded-xl border-slate-200 font-bold text-rose-600 text-xs" 
                    />
                  </div>

                  {/* Structural Placement */}
                  <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
                    <Label htmlFor="departmentId" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Département Parent
                    </Label>
                    <Select 
                      value={formData.departmentId || ''} 
                      onValueChange={(v) => handleSelectChange('departmentId', v)}
                    >
                      <SelectTrigger id="departmentId" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue placeholder="Sélectionner le département..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {departmentList.map(d => (
                          <SelectItem key={d.id} value={d.id} className="font-bold text-xs">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="directionId" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Direction
                    </Label>
                    <Select 
                      value={formData.directionId || ''} 
                      onValueChange={(v) => handleSelectChange('directionId', v)} 
                      disabled={filteredDirections.length === 0}
                    >
                      <SelectTrigger id="directionId" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {filteredDirections.map(d => (
                          <SelectItem key={d.id} value={d.id} className="font-bold text-xs">{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceId" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      Service / Unité
                    </Label>
                    <Select 
                      value={formData.serviceId || ''} 
                      onValueChange={(v) => handleSelectChange('serviceId', v)} 
                      disabled={filteredServices.length === 0}
                    >
                      <SelectTrigger id="serviceId" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue placeholder="—" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {filteredServices.map(s => (
                          <SelectItem key={s.id} value={s.id} className="font-bold text-xs">{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Replaced member */}
                  <div className="space-y-2 md:col-span-2 pt-2 border-t border-slate-100">
                    <Label htmlFor="remplaceId" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                      En remplacement de (Membre sortant ou inactif)
                    </Label>
                    <Select 
                      value={formData.remplaceId || "none"} 
                      onValueChange={(val) => {
                        const id = val === "none" ? undefined : val;
                        const replacedEmp = inactiveEmployees.find(e => e.id === id);
                        startTransition(() => {
                          setFormData(prev => ({ 
                            ...prev, 
                            remplaceId: id,
                            remplaceNom: replacedEmp ? `${replacedEmp.lastName || ''} ${replacedEmp.firstName || ''}`.trim() : undefined
                          }));
                        });
                      }}
                    >
                      <SelectTrigger id="remplaceId" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                        <SelectValue placeholder="Personne (Nouvelle nomination)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="none" className="font-bold text-xs text-slate-400">Personne (Nouvelle nomination)</SelectItem>
                        {inactiveEmployees.map(emp => (
                          <SelectItem key={emp.id} value={emp.id} className="font-bold text-xs">
                            {`${emp.lastName || ''} ${emp.firstName || ''} - ${emp.poste || 'Sans poste'} (${emp.status})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: CHEFFERIE & TERRITOIRE */}
            {isTraditionalMode && (
              <TabsContent value="chefferie" className="space-y-6 focus-visible:outline-none">
                <Card className="border border-amber-200 bg-white rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="p-5 pb-3 border-b border-amber-100 bg-amber-50/50 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-black uppercase tracking-tight text-amber-900 flex items-center gap-2">
                        <Crown className="h-5 w-5 text-amber-600" />
                        Rattachement Coutumier & Territorial
                      </CardTitle>
                      <CardDescription className="text-xs text-amber-700 mt-1">
                        Ces informations sont configurées pour les membres du Directoire, des Comités Régionaux et de l'Assemblée des Rois et Chefs.
                      </CardDescription>
                    </div>
                    {Array.isArray(formData.statutChef) && formData.statutChef.length > 1 && (
                      <Badge className="bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider px-2.5 py-1">
                        <Layers className="h-3 w-3 mr-1" />
                        {formData.statutChef.length} Casquettes
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-5 space-y-6">
                    {/* Geographic territory */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="Region" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Région Administrative
                        </Label>
                        <Select 
                          value={formData.Region || ''} 
                          onValueChange={(v) => { 
                            startTransition(() => {
                              setFormData(prev => ({
                                ...prev,
                                Region: v,
                                Departement: '',
                                subPrefecture: '',
                                Village: ''
                              }));
                            });
                          }}
                        >
                          <SelectTrigger id="Region" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                            <SelectValue placeholder="Sélectionner une région..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[300px]">
                            {IVORIAN_REGIONS.map(r => (
                              <SelectItem key={r} value={r} className="font-bold text-xs uppercase">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="Departement" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Département de Résidence / Chefferie
                        </Label>
                        <Select 
                          value={formData.Departement || ''} 
                          onValueChange={(val) => { 
                            startTransition(() => {
                              setFormData(prev => ({
                                ...prev,
                                Departement: val,
                                subPrefecture: '',
                                Village: ''
                              }));
                            });
                          }} 
                          disabled={!formData.Region}
                        >
                          <SelectTrigger id="Departement" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                            <SelectValue placeholder="Sélectionner le département..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[300px]">
                            {availableDepartments.map(d => (
                              <SelectItem key={d} value={d} className="font-bold text-xs uppercase">{d}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subPrefecture" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Sous-Préfecture
                        </Label>
                        <Select 
                          value={formData.subPrefecture || ''} 
                          onValueChange={(val) => { 
                            startTransition(() => {
                              setFormData(prev => ({
                                ...prev,
                                subPrefecture: val,
                                Village: ''
                              }));
                            });
                          }} 
                          disabled={!formData.Departement}
                        >
                          <SelectTrigger id="subPrefecture" className="h-11 rounded-xl border-slate-200 font-bold text-xs">
                            <SelectValue placeholder="Sélectionner la sous-préfecture..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[300px]">
                            {availableSubPrefectures.map(sp => (
                              <SelectItem key={sp} value={sp} className="font-bold text-xs uppercase">{sp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="Village" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Village / Localité
                        </Label>
                        <VillageCombobox
                          value={formData.Village}
                          onValueChange={(val) => handleValueChange('Village', val)}
                          region={formData.Region}
                          department={formData.Departement}
                          subPrefecture={formData.subPrefecture}
                          disabled={!formData.subPrefecture}
                        />
                      </div>
                    </div>

                    {/* Chief Statuses and Hats */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                        Statuts Coutumiers & Casquettes de Chef (Sélection Multiple)
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {ALL_CHIEF_STATUSES.map(status => {
                          const isSelected = Array.isArray(formData.statutChef) && formData.statutChef.includes(status);
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                startTransition(() => {
                                  setFormData(prev => {
                                    const current = Array.isArray(prev.statutChef) ? [...prev.statutChef] : [];
                                    const next = isSelected ? current.filter(s => s !== status) : [...current, status];
                                    return { ...prev, statutChef: next };
                                  });
                                });
                              }}
                              className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
                                isSelected 
                                  ? "bg-slate-900 border-slate-900 text-white shadow-sm" 
                                  : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                              )}
                            >
                              <div 
                                className={cn(
                                  "h-4 w-4 shrink-0 rounded border flex items-center justify-center pointer-events-none",
                                  isSelected ? "border-white bg-white text-slate-900" : "border-slate-300 bg-white"
                                )}
                              >
                                <Check className={cn("h-3 w-3 stroke-[3]", isSelected ? "opacity-100" : "opacity-0")} />
                              </div>
                              <span className="text-xs font-black uppercase tracking-tight">{status}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Mandates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                      <div className="space-y-2">
                        <Label htmlFor="mandatDebut" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Date Début de Mandat (Instance CNRCT)
                        </Label>
                        <Input 
                          id="mandatDebut" 
                          type="date" 
                          value={formData.mandatDebut || ''} 
                          onChange={handleInputChange} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mandatFin" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Date Fin de Mandat
                        </Label>
                        <Input 
                          id="mandatFin" 
                          type="date" 
                          value={formData.mandatFin || ''} 
                          onChange={handleInputChange} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* TAB 4: RÉMUNÉRATION & COORDONNÉES BANCAIRES */}
            {canManagePayroll && (
              <TabsContent value="finance" className="space-y-6 focus-visible:outline-none">
                <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
                  <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                    <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-emerald-600" />
                      Grille Salariale & Indemnités
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Montants en Francs CFA (FCFA) composant la rémunération de l'agent.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-5 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="baseSalary" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Salaire de Base (FCFA)
                        </Label>
                        <Input 
                          id="baseSalary" 
                          type="number" 
                          value={formData.baseSalary ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, baseSalary: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-black text-sm text-slate-900" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="primeAnciennete" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Prime d'Ancienneté (FCFA)
                        </Label>
                        <Input 
                          id="primeAnciennete" 
                          type="number" 
                          value={formData.primeAnciennete ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, primeAnciennete: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteLogement" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Logement (FCFA)
                        </Label>
                        <Input 
                          id="indemniteLogement" 
                          type="number" 
                          value={formData.indemniteLogement ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteLogement: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteTransportImposable" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Transport Imposable (FCFA)
                        </Label>
                        <Input 
                          id="indemniteTransportImposable" 
                          type="number" 
                          value={formData.indemniteTransportImposable ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteTransportImposable: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="transportNonImposable" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité Transport Non-Imposable (FCFA)
                        </Label>
                        <Input 
                          id="transportNonImposable" 
                          type="number" 
                          value={formData.transportNonImposable ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, transportNonImposable: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteResponsabilite" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Responsabilité (FCFA)
                        </Label>
                        <Input 
                          id="indemniteResponsabilite" 
                          type="number" 
                          value={formData.indemniteResponsabilite ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteResponsabilite: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteSujetion" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Sujétion (FCFA)
                        </Label>
                        <Input 
                          id="indemniteSujetion" 
                          type="number" 
                          value={formData.indemniteSujetion ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteSujetion: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteCommunication" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Communication (FCFA)
                        </Label>
                        <Input 
                          id="indemniteCommunication" 
                          type="number" 
                          value={formData.indemniteCommunication ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteCommunication: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="indemniteRepresentation" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Indemnité de Représentation (FCFA)
                        </Label>
                        <Input 
                          id="indemniteRepresentation" 
                          type="number" 
                          value={formData.indemniteRepresentation ?? 0} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, indemniteRepresentation: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="parts" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Nombre de Parts Fiscales
                        </Label>
                        <Input 
                          id="parts" 
                          type="number" 
                          step="0.5"
                          value={formData.parts ?? 1} 
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 1;
                            startTransition(() => {
                              setFormData(prev => ({ ...prev, parts: val }));
                            });
                          }} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                        />
                      </div>
                    </div>

                    {/* Banking details */}
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-blue-600" /> Coordonnées Bancaires
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="banque" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Établissement Bancaire
                          </Label>
                          <DebouncedInput 
                            id="banque" 
                            value={formData.banque || ''} 
                            onChange={(val) => handleValueChange('banque', val as string)} 
                            className="h-11 rounded-xl border-slate-200 font-bold text-xs uppercase" 
                            placeholder="Ex: Trésor Public, SGCI, NSIA, BOA..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="numeroCompte" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Numéro de Compte
                          </Label>
                          <DebouncedInput 
                            id="numeroCompte" 
                            value={formData.numeroCompte || ''} 
                            onChange={(val) => handleValueChange('numeroCompte', val as string)} 
                            className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                            placeholder="CI..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="CB" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Code Banque (CB)
                          </Label>
                          <DebouncedInput 
                            id="CB" 
                            value={formData.CB || ''} 
                            onChange={(val) => handleValueChange('CB', val as string)} 
                            className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                            placeholder="CI..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="CG" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Code Guichet (CG)
                          </Label>
                          <DebouncedInput 
                            id="CG" 
                            value={formData.CG || ''} 
                            onChange={(val) => handleValueChange('CG', val as string)} 
                            className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                            placeholder="01..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="Cle_RIB" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                            Clé RIB
                          </Label>
                          <DebouncedInput 
                            id="Cle_RIB" 
                            value={formData.Cle_RIB || ''} 
                            onChange={(val) => handleValueChange('Cle_RIB', val as string)} 
                            className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                            placeholder="45"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* TAB 5: SOCIAL & CNPS */}
            <TabsContent value="social" className="space-y-6 focus-visible:outline-none">
              <Card className="border border-slate-200 bg-white rounded-2xl shadow-sm">
                <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/50">
                  <CardTitle className="text-base font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-600" />
                    Protection Sociale, CNPS & Compétences
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-6">
                  {/* CNPS section */}
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        id="CNPS" 
                        checked={!!formData.CNPS} 
                        onCheckedChange={(checked) => {
                          startTransition(() => {
                            setFormData(prev => ({ ...prev, CNPS: !!checked }));
                          });
                        }}
                        className="h-6 w-6 rounded-lg data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <Label htmlFor="CNPS" className="text-xs font-black uppercase tracking-wider text-slate-800 cursor-pointer">
                        Immatriculation CNPS Active pour cet agent
                      </Label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="cnpsEmploye" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          N° CNPS Salarié
                        </Label>
                        <DebouncedInput 
                          id="cnpsEmploye" 
                          value={formData.cnpsEmploye || ''} 
                          onChange={(val) => handleValueChange('cnpsEmploye', val as string)} 
                          className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                          placeholder="CNPS-..."
                          disabled={!formData.CNPS}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cnpsEmployeur" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          N° CNPS Employeur
                        </Label>
                        <DebouncedInput 
                          id="cnpsEmployeur" 
                          value={formData.cnpsEmployeur || ''} 
                          onChange={(val) => handleValueChange('cnpsEmployeur', val as string)} 
                          className="h-11 rounded-xl border-slate-200 font-mono font-bold text-xs" 
                          placeholder="CNPS-EMP-..."
                          disabled={!formData.CNPS}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="Date_Immatriculation" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Date d'Immatriculation
                        </Label>
                        <Input 
                          id="Date_Immatriculation" 
                          type="date" 
                          value={formData.Date_Immatriculation || ''} 
                          onChange={handleInputChange} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                          disabled={!formData.CNPS}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="Date_Cessation_CNPS" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                          Date de Cessation CNPS (Optionnel)
                        </Label>
                        <Input 
                          id="Date_Cessation_CNPS" 
                          type="date" 
                          value={formData.Date_Cessation_CNPS || ''} 
                          onChange={handleInputChange} 
                          className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                          disabled={!formData.CNPS}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Congés & compétences */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label htmlFor="solde_conges" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Solde de Congés Payés (Jours)
                      </Label>
                      <Input 
                        id="solde_conges" 
                        type="number" 
                        step="0.5"
                        value={formData.solde_conges ?? 0} 
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          startTransition(() => {
                            setFormData(prev => ({ ...prev, solde_conges: val }));
                          });
                        }} 
                        className="h-11 rounded-xl border-slate-200 font-bold text-xs" 
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="skills" className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                        Compétences Clés & Domaines d'Expertise (Séparées par des virgules)
                      </Label>
                      <Textarea 
                        id="skills" 
                        value={Array.isArray(formData.skills) ? formData.skills.join(', ') : (formData.skills || '')} 
                        onChange={handleInputChange} 
                        className="rounded-xl border-slate-200 min-h-[90px] p-3 text-xs font-medium" 
                        placeholder="Ex: Protocole coutumier, Médiation de conflits, Gestion RH, Sécurité rapprochée..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </form>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 p-3.5 shadow-xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 hidden sm:flex">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span>Toutes les modifications sont enregistrées directement dans la base de données.</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => router.back()} 
              disabled={isSubmitting}
              className="h-11 px-5 rounded-xl border-slate-300 font-bold text-xs uppercase tracking-wider hover:bg-slate-50"
            >
              Annuler
            </Button>
            <Button 
              type="button"
              onClick={() => handleSubmit()} 
              disabled={isSubmitting}
              className="h-11 px-6 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider shadow-md flex items-center gap-2"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement en cours...</>
              ) : (
                <><Save className="h-4 w-4 text-emerald-400" /> Sauvegarder la fiche</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
