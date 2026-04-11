import React, { memo } from "react";
import { PlusCircle, Pencil, Trash2, Building, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "../empty-state";
import type { Department, Direction, Service } from "@/lib/data";

interface OrgTabProps {
  departments: Department[];
  directions: Direction[];
  services: Service[];
  loading: boolean;
  onAddDeptAction: () => void;
  onEditDeptAction: (dept: Department) => void;
  onDeleteDeptAction: (id: string, name: string) => void;
  onAddDirAction: () => void;
  onEditDirAction: (dir: Direction) => void;
  onDeleteDirAction: (id: string, name: string) => void;
  onAddSvcAction: () => void;
  onEditSvcAction: (svc: Service) => void;
  onDeleteSvcAction: (id: string, name: string) => void;
}

export const OrgTab = memo(function OrgTab({
  departments,
  directions,
  services,
  loading,
  onAddDeptAction,
  onEditDeptAction,
  onDeleteDeptAction,
  onAddDirAction,
  onEditDirAction,
  onDeleteDirAction,
  onAddSvcAction,
  onEditSvcAction,
  onDeleteSvcAction,
}: OrgTabProps) {
  return (
    <div className="grid gap-10 md:grid-cols-1 lg:grid-cols-3">
      {/* Departments */}
      <Card className="border-white/20 shadow-3xl bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden h-full flex flex-col group transition-all duration-700 hover:border-white/30 hover:-translate-y-2">
        <CardHeader className="bg-slate-900 p-8 text-white relative overflow-hidden">
          {/* Institutional Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shadow-2xl">
                  <Building className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Départements</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400/80 mt-0.5">Pôles Stratégiques</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pb-10 flex-1 flex flex-col relative z-10">
          <div className="flex justify-end mb-8">
            <Button size="sm" onClick={onAddDeptAction} className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all gap-2 group/btn">
              <PlusCircle className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-500" /> 
              Nouveau Pôle
            </Button>
          </div>
          <div className="rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-inner backdrop-blur-sm flex-1">
            <Table>
              <TableHeader className="bg-slate-900/5">
                <TableRow className="hover:bg-transparent border-white/20">
                  <TableHead className="w-[60px] text-center font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-5">#</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-900">Libellé Officiel</TableHead>
                  <TableHead className="w-[100px] text-right py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-3 w-4 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full rounded-md" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="ml-auto h-8 w-8 rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : !departments || departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-20 text-center">
                      <EmptyState icon={Building} message="Aucune unité stratégique." />
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept, index) => (
                    <TableRow key={dept.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                      <TableCell className="text-center font-black text-slate-300 group-hover:text-blue-600 transition-colors tracking-widest text-[11px]">
                        {(index + 1).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="py-5">
                          <span className="font-black text-slate-900 text-xs uppercase tracking-tight group-hover:translate-x-1 transition-transform inline-block">
                              {dept.name}
                          </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-slate-900 hover:text-white transition-all" onClick={() => onEditDeptAction(dept)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Édition</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" onClick={() => onDeleteDeptAction(dept.id, dept.name)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Suppression</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Directions */}
      <Card className="border-white/20 shadow-3xl bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden h-full flex flex-col group transition-all duration-700 hover:border-white/30 hover:-translate-y-2">
        <CardHeader className="bg-slate-900 p-8 text-white relative overflow-hidden">
          {/* Institutional Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shadow-2xl">
                  <Layers className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Directions</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/80 mt-0.5">Unités Opérationnelles</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pb-10 flex-1 flex flex-col relative z-10">
          <div className="flex justify-end mb-8">
            <Button 
                size="sm" 
                onClick={onAddDirAction} 
                disabled={!departments || departments.length === 0}
                className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all gap-2 group/btn"
            >
              <PlusCircle className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-500" /> 
              Nouvelle Dir.
            </Button>
          </div>
          <div className="rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-inner backdrop-blur-sm flex-1">
            <Table>
              <TableHeader className="bg-slate-900/5">
                <TableRow className="hover:bg-transparent border-white/20">
                  <TableHead className="w-[60px] text-center font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-5">#</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-900">Libellé Unité</TableHead>
                  <TableHead className="w-[100px] text-right py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-3 w-4 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full rounded-md" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="ml-auto h-8 w-8 rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : !directions || directions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-20 text-center">
                      <EmptyState icon={Layers} message="Aucune unité opérationnelle." />
                    </TableCell>
                  </TableRow>
                ) : (
                  directions.map((dir, index) => (
                    <TableRow key={dir.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                      <TableCell className="text-center font-black text-slate-300 group-hover:text-emerald-600 transition-colors tracking-widest text-[11px]">
                        {(index + 1).toString().padStart(2, '0')}
                      </TableCell>
                      <TableCell className="py-5">
                          <div className="flex flex-col gap-1 group-hover:translate-x-1 transition-transform">
                              <span className="font-black text-slate-900 text-xs uppercase tracking-tight">
                                  {dir.name}
                              </span>
                              <Badge variant="outline" className="text-[7px] px-1.5 py-0 h-4 bg-emerald-500/5 text-emerald-600 border-emerald-200 font-black uppercase tracking-widest w-fit">
                                {departments?.find(d => d.id === dir.departmentId)?.name || 'HORS PÔLE'}
                              </Badge>
                          </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-slate-900 hover:text-white transition-all" onClick={() => onEditDirAction(dir)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Édition</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" onClick={() => onDeleteDirAction(dir.id, dir.name)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Suppression</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Services */}
      <Card className="border-white/20 shadow-3xl bg-white/40 backdrop-blur-xl rounded-[3rem] overflow-hidden h-full flex flex-col group transition-all duration-700 hover:border-white/30 hover:-translate-y-2">
        <CardHeader className="bg-slate-900 p-8 text-white relative overflow-hidden">
          {/* Institutional Pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 rounded-2xl bg-white/10 border border-white/20 shadow-2xl">
                  <Layers className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                  <CardTitle className="text-xl font-black uppercase tracking-tighter">Services</CardTitle>
                  <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/80 mt-0.5">Unités d'Exécution</CardDescription>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pb-10 flex-1 flex flex-col relative z-10">
          <div className="flex justify-end mb-8">
            <Button 
                size="sm" 
                onClick={onAddSvcAction} 
                disabled={(!directions || directions.length === 0) && (!departments || departments.length === 0)}
                className="h-11 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-95 transition-all gap-2 group/btn"
            >
              <PlusCircle className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-500" /> 
              Nouveau Svc.
            </Button>
          </div>
          <div className="rounded-[2rem] border border-white/40 bg-white/20 overflow-hidden shadow-inner backdrop-blur-sm flex-1">
            <Table>
              <TableHeader className="bg-slate-900/5">
                <TableRow className="hover:bg-transparent border-white/20">
                  <TableHead className="w-[60px] text-center font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 py-5">#</TableHead>
                  <TableHead className="py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-900">Libellé Service</TableHead>
                  <TableHead className="w-[100px] text-right py-5 font-black uppercase text-[10px] tracking-[0.2em] text-slate-400 pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i} className="border-white/10">
                      <TableCell><Skeleton className="h-3 w-4 mx-auto rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-full rounded-md" /></TableCell>
                      <TableCell className="text-right pr-6"><Skeleton className="ml-auto h-8 w-8 rounded-xl" /></TableCell>
                    </TableRow>
                  ))
                ) : !services || services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-20 text-center">
                      <EmptyState icon={Layers} message="Aucun service d'exécution." />
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((svc, index) => {
                    const parent = svc.directionId
                      ? directions?.find(d => d.id === svc.directionId)
                      : departments?.find(d => d.id === svc.departmentId);
                    
                    return (
                      <TableRow key={svc.id} className="group hover:bg-white/40 transition-all duration-500 border-white/10">
                        <TableCell className="text-center font-black text-slate-300 group-hover:text-amber-600 transition-colors tracking-widest text-[11px]">
                          {(index + 1).toString().padStart(2, '0')}
                        </TableCell>
                        <TableCell className="py-5">
                            <div className="flex flex-col gap-1 group-hover:translate-x-1 transition-transform">
                              <span className="font-black text-slate-900 text-xs uppercase tracking-tight">
                                  {svc.name}
                              </span>
                              <Badge variant="outline" className="text-[7px] px-1.5 py-0 h-4 bg-amber-500/5 text-amber-600 border-amber-200 font-black uppercase tracking-widest w-fit">
                                {parent?.name || 'SANS ATTACHEMENT'}
                              </Badge>
                            </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0 duration-500">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-slate-900 hover:text-white transition-all" onClick={() => onEditSvcAction(svc)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Édition</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-white shadow-sm border border-white/60 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" onClick={() => onDeleteSvcAction(svc.id, svc.name)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="font-black uppercase tracking-widest text-[9px]">Suppression</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
