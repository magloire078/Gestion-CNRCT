import React, { memo } from "react";
import { PlusCircle, Pencil, Trash2, Building, Layers } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
    <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
      {/* Departments */}
      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="bg-muted/20 border-b border-border/10">
          <CardTitle className="text-lg">Départements</CardTitle>
          <CardDescription className="text-xs">Niveau hiérarchique supérieur.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-end mb-4">
            <Button size="sm" variant="outline" onClick={onAddDeptAction} className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary">
              <PlusCircle className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[40px] text-xs">N°</TableHead>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="w-[80px] text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-3 w-3" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : !departments || departments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={Building} message="Aucun département." />
                    </TableCell>
                  </TableRow>
                ) : (
                  departments.map((dept, index) => (
                    <TableRow key={dept.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-[11px] text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-sm">{dept.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditDeptAction(dept)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600" onClick={() => onDeleteDeptAction(dept.id, dept.name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="bg-muted/20 border-b border-border/10">
          <CardTitle className="text-lg">Directions</CardTitle>
          <CardDescription className="text-xs">Sous-divisions opérationnelles.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-end mb-4">
            <Button 
                size="sm" 
                variant="outline" 
                onClick={onAddDirAction} 
                disabled={!departments || departments.length === 0}
                className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[40px] text-xs">N°</TableHead>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="w-[80px] text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-3 w-3" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : !directions || directions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={Layers} message="Aucune direction." />
                    </TableCell>
                  </TableRow>
                ) : (
                  directions.map((dir, index) => (
                    <TableRow key={dir.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="text-[11px] text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-semibold text-sm">
                        {dir.name}
                        <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">
                            {departments?.find(d => d.id === dir.departmentId)?.name || 'N/A'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditDirAction(dir)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600" onClick={() => onDeleteDirAction(dir.id, dir.name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm h-full">
        <CardHeader className="bg-muted/20 border-b border-border/10">
          <CardTitle className="text-lg">Services</CardTitle>
          <CardDescription className="text-xs">Unités d&apos;exécution.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex justify-end mb-4">
            <Button 
                size="sm" 
                variant="outline" 
                onClick={onAddSvcAction} 
                disabled={(!directions || directions.length === 0) && (!departments || departments.length === 0)}
                className="h-8 gap-2 border-primary/20 hover:bg-primary/5 text-primary"
            >
              <PlusCircle className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[40px] text-xs">N°</TableHead>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="w-[80px] text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-3 w-3" /></TableCell>
                      <TableCell><Skeleton className="h-3 w-full" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="ml-auto h-6 w-6" /></TableCell>
                    </TableRow>
                  ))
                ) : !services || services.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <EmptyState icon={Layers} message="Aucun service." />
                    </TableCell>
                  </TableRow>
                ) : (
                  services.map((svc, index) => {
                    const parent = svc.directionId
                      ? directions?.find(d => d.id === svc.directionId)
                      : departments?.find(d => d.id === svc.departmentId);
                    
                    return (
                      <TableRow key={svc.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="text-[11px] text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-semibold text-sm">
                          {svc.name}
                          <p className="text-[10px] font-medium text-muted-foreground uppercase mt-0.5">
                            {parent?.name || 'N/A'}
                          </p>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEditSvcAction(svc)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-600" onClick={() => onDeleteSvcAction(svc.id, svc.name)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
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
