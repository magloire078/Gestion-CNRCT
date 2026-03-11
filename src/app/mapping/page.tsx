
"use client";

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, MapPin, User, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { getChiefs } from '@/services/chief-service';
import { subscribeToConflicts, updateConflict } from '@/services/conflict-service';
import type { Chief, Conflict } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
// Dynamically import the map component to avoid SSR issues
const GISMap = dynamic(() => import('@/components/common/gis-map-v3').then(m => m.GISMap), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full" />,
});

import { getConflictResolutionAdvice, type ConflictResolutionOutput } from '@/ai/flows/conflict-resolution-flow';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { Loader2, Sparkles } from 'lucide-react';

export default function MappingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [chiefs, setChiefs] = useState<Chief[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [selectedChiefId, setSelectedChiefId] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<ConflictResolutionOutput | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<Conflict | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchChiefs() {
      try {
        const data = await getChiefs();
        if (isMounted) {
          const chiefsWithCoords = data.filter(c => c.latitude && c.longitude);
          setChiefs(chiefsWithCoords);
        }
      } catch (error) {
        console.error('Failed to load chiefs for map', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger les données des chefs pour la carte.',
          });
        }
      }
    }

    const unsubConflicts = subscribeToConflicts(
      (data) => {
        if (isMounted) setConflicts(data);
      },
      (error) => {
        console.error('Failed to load conflicts for map', error);
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Impossible de charger les données des conflits.',
          });
        }
      }
    );

    Promise.all([fetchChiefs()]).finally(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubConflicts();
    }
  }, [toast]);

  const handleAnalyzeConflict = async (conflict: Conflict) => {
    setCurrentConflict(conflict);
    setIsAnalysisDialogOpen(true);
    setIsAiLoading(true);
    setAiSuggestions(null);
    try {
      const suggestions = await getConflictResolutionAdvice({ 
        description: conflict.description,
        latitude: conflict.latitude,
        longitude: conflict.longitude
      });
      setAiSuggestions(suggestions);

      // Sauvegarder le score de risque dans Firestore
      if (suggestions.riskScore) {
        await updateConflict(conflict.id, { 
          riskScore: suggestions.riskScore 
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur d'analyse IA",
        description: "Impossible d'obtenir des suggestions de l'IA. Veuillez réessayer."
      })
      console.error(err);
    } finally {
      setIsAiLoading(false);
    }
  }

  const filteredChiefs = useMemo(() => {
    if (!searchTerm) return chiefs;
    const lowercasedTerm = searchTerm.toLowerCase();
    return chiefs.filter(
      (chief) =>
        chief.name.toLowerCase().includes(lowercasedTerm) ||
        (chief.village || '').toLowerCase().includes(lowercasedTerm) ||
        (chief.region || '').toLowerCase().includes(lowercasedTerm)
    );
  }, [chiefs, searchTerm]);

  const filteredConflicts = useMemo(() => {
    if (!searchTerm) return conflicts;
    const lowercasedTerm = searchTerm.toLowerCase();
    return conflicts.filter(c => c.village.toLowerCase().includes(lowercasedTerm));
  }, [conflicts, searchTerm]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight">Cartographie des Chefferies</h1>
      <Card className="h-[calc(100vh-14rem)] flex flex-col">
        <CardHeader>
          <CardTitle>Carte Interactive</CardTitle>
          <CardDescription>
            Explorez la localisation des Rois, Chefs Traditionnels et des conflits en cours.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col md:flex-row gap-4 overflow-hidden">
          <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher un chef, un village..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-grow border rounded-md">
              {loading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : (
                <div className="p-2">
                  {filteredChiefs.map(chief => (
                    <button
                      key={chief.id}
                      onClick={() => setSelectedChiefId(chief.id)}
                      onMouseEnter={() => setSelectedChiefId(chief.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors",
                        selectedChiefId === chief.id ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={chief.photoUrl} alt={chief.name} data-ai-hint="chief photo" />
                        <AvatarFallback>{chief.lastName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="font-semibold truncate">{chief.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{chief.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{chief.village}, {chief.region}</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          <div className="flex-grow rounded-lg border overflow-hidden">
            <GISMap 
              chiefs={chiefs} 
              conflicts={filteredConflicts}
              selectedId={selectedChiefId}
              onMarkerClick={(id) => setSelectedChiefId(id)}
              onAiAnalyze={handleAnalyzeConflict}
              onAddPoint={(lat, lng) => {
                toast({
                  title: "Collecte SIG",
                  description: `Coordonnées capturées: ${lat.toFixed(6)}, ${lng.toFixed(6)}. (Fonctionnalité d'ajout bientôt disponible)`,
                });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialogue d'Analyse IA (Même style que sur la page des conflits pour uniformité) */}
      <AlertDialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Analyse IA du Conflit
            </AlertDialogTitle>
            <AlertDialogDescription>
              Suggestions stratégiques pour le conflit à <span className="font-bold text-foreground">{currentConflict?.village}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {isAiLoading && (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="relative">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-purple-500 animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">L'IA de la CNRCT analyse la situation locale...</p>
            </div>
          )}

          {aiSuggestions && (
            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4 py-2">
              {aiSuggestions.riskScore && (
                <div className="flex flex-col gap-2 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Indice de Risque</span>
                    <Badge className={cn(
                      "font-bold",
                      aiSuggestions.riskScore <= 3 ? "bg-green-100 text-green-700 hover:bg-green-100" :
                      aiSuggestions.riskScore <= 7 ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100" : "bg-red-100 text-red-700 hover:bg-red-100"
                    )}>
                      {aiSuggestions.riskScore}/10
                    </Badge>
                  </div>
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        aiSuggestions.riskScore <= 3 ? "bg-green-500" :
                        aiSuggestions.riskScore <= 7 ? "bg-yellow-500" : "bg-red-500"
                      )}
                      style={{ width: `${aiSuggestions.riskScore * 10}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                  Diagnostic du Médiateur
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/30 p-3 rounded-lg border border-blue-100/50">
                  {aiSuggestions.analysis}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                  Protocole de Médiation Suggéré
                </h4>
                <div className="grid gap-2">
                  {aiSuggestions.mediationSteps.map((step, i) => (
                    <div key={i} className="flex gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                  Éléments de Langage (Communication)
                </h4>
                <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 space-y-2">
                  {aiSuggestions.communicationStrategies.map((strategy, i) => (
                    <div key={i} className="flex gap-2">
                      <div className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-400" />
                      <p className="text-sm text-slate-600 italic">"{strategy}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <AlertDialogFooter className="border-t pt-4">
            <AlertDialogAction className="bg-slate-900 border-none px-8">
              J'ai pris connaissance des suggestions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
