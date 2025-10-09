
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Custom } from "@/lib/data";
import { getCustom, updateCustom } from "@/services/customs-service";
import { ArrowLeft, Loader2, Save } from "lucide-react";

const formFields = [
  { id: 'ethnicGroup', label: 'Groupe Ethnique', type: 'text', required: true },
  { id: 'regions', label: 'Région(s)', type: 'text', placeholder: 'Séparées par une virgule' },
  { id: 'languages', label: 'Langue(s)', type: 'text', placeholder: 'Séparées par une virgule' },
  { id: 'historicalOrigin', label: 'Origine Historique/Légendaire', type: 'textarea' },
  { id: 'socialStructure', label: 'Structure Sociale', type: 'textarea' },
  { id: 'politicalStructure', label: 'Structure Politique', type: 'textarea' },
  { id: 'successionSystem', label: 'Système de Succession', type: 'textarea' },
  { id: 'traditionalMarriage', label: 'Mariage Traditionnel', type: 'textarea' },
  { id: 'funerals', label: 'Funérailles', type: 'textarea' },
  { id: 'initiations', label: 'Rites d\'Initiation', type: 'textarea' },
  { id: 'celebrations', label: 'Fêtes et Célébrations', type: 'textarea' },
  { id: 'beliefs', label: 'Croyances et Spiritualité', type: 'textarea' },
  { id: 'religiousPractices', label: 'Pratiques Religieuses', type: 'textarea' },
  { id: 'sacredPlaces', label: 'Lieux Sacrés', type: 'textarea' },
  { id: 'culturalSymbols', label: 'Symboles et Objets Culturels', type: 'textarea' },
  { id: 'normsAndValues', label: 'Normes et Valeurs', type: 'textarea' },
  { id: 'conflictResolutionSystem', label: 'Résolution des Conflits', type: 'textarea' },
  { id: 'modernityImpact', label: 'Impact de la Modernité', type: 'textarea' },
  { id: 'preservationInitiatives', label: 'Initiatives de Sauvegarde', type: 'textarea' },
  { id: 'intergenerationalTransmission', label: 'Transmission Intergénérationnelle', type: 'textarea' },
];


export default function EditCustomPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const { toast } = useToast();

    const [formData, setFormData] = useState<Partial<Custom>>({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof id !== 'string') return;
        async function fetchCustom() {
            setLoading(true);
            try {
                const data = await getCustom(id);
                if (data) {
                    setFormData(data);
                } else {
                    toast({ variant: "destructive", title: "Erreur", description: "Fiche de coutume non trouvée." });
                    router.push('/us-et-coutumes');
                }
            } catch (err) {
                 toast({ variant: "destructive", title: "Erreur", description: "Impossible de charger les données." });
                 console.error(err);
            } finally {
                setLoading(false);
            }
        }
        fetchCustom();
    }, [id, router, toast]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof id !== 'string') return;
        
        if (!formData.ethnicGroup) {
            setError("Le groupe ethnique est obligatoire.");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            await updateCustom(id, formData);
            toast({ title: "Succès", description: "La fiche de coutume a été mise à jour." });
            router.push('/us-et-coutumes');
        } catch (err) {
             setError(err instanceof Error ? err.message : "Une erreur est survenue.");
             toast({ variant: "destructive", title: "Erreur", description: "Impossible d'enregistrer les modifications." });
        } finally {
            setIsSaving(false);
        }
    };


    if (loading) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="max-w-2xl mx-auto space-y-6">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Retour</span>
                 </Button>
                 <div>
                    <h1 className="text-2xl font-bold tracking-tight">Modifier la Fiche de Coutume</h1>
                    <p className="text-muted-foreground">{formData.ethnicGroup}</p>
                 </div>
                 <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                    Enregistrer
                </Button>
            </div>

            <form onSubmit={handleSave}>
                <Card>
                    <CardHeader>
                        <CardTitle>Détails de la Tradition</CardTitle>
                        <CardDescription>Modifiez les informations ci-dessous.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ScrollArea className="h-[calc(100vh-300px)] pr-4">
                            <div className="space-y-4">
                                {formFields.map(field => (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={field.id}>{field.label}</Label>
                                    {field.type === 'textarea' ? (
                                    <Textarea
                                        id={field.id}
                                        name={field.id}
                                        value={(formData as any)[field.id] || ''}
                                        onChange={handleInputChange}
                                        rows={4}
                                        placeholder={field.placeholder || ''}
                                    />
                                    ) : (
                                    <Input
                                        id={field.id}
                                        name={field.id}
                                        type={field.type}
                                        value={(formData as any)[field.id] || ''}
                                        onChange={handleInputChange}
                                        required={field.required}
                                        placeholder={field.placeholder || ''}
                                    />
                                    )}
                                </div>
                                ))}
                                {error && <p className="text-sm text-destructive text-center">{error}</p>}
                            </div>
                         </ScrollArea>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
