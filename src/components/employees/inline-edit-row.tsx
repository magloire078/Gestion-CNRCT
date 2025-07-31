
"use client";

import { useState, useEffect } from "react";
import type { Employee } from "@/lib/data";
import { TableRow, TableCell } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Check, X, Trash2 } from "lucide-react";
import { departments } from "@/app/employees/page";

type Status = 'Active' | 'On Leave' | 'Terminated';

interface InlineEditRowProps {
    employee: Employee;
    isEditing: boolean;
    onEdit: (employeeId: string) => void;
    onSave: (employeeId: string, data: Partial<Employee>) => Promise<void>;
    onCancel: () => void;
    onDelete: (employeeId: string) => void;
    statusVariantMap: Record<Status, "default" | "secondary" | "destructive">;
}

export function InlineEditRow({ employee, isEditing, onEdit, onSave, onCancel, onDelete, statusVariantMap }: InlineEditRowProps) {
    const [editData, setEditData] = useState<Partial<Employee>>({});

    useEffect(() => {
        if (isEditing) {
            setEditData({
                firstName: employee.firstName,
                lastName: employee.lastName,
                matricule: employee.matricule,
                poste: employee.poste,
                department: employee.department,
                status: employee.status
            });
        }
    }, [isEditing, employee]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveClick = async () => {
        await onSave(employee.id, editData);
    };

    if (isEditing) {
        return (
            <TableRow className="bg-muted/50">
                <TableCell>
                    <Avatar>
                        <AvatarImage src={employee.photoUrl} alt={employee.name} data-ai-hint="employee photo" />
                        <AvatarFallback>{employee.name?.charAt(0) || 'E'}</AvatarFallback>
                    </Avatar>
                </TableCell>
                <TableCell>
                    <div className="flex gap-2">
                        <Input name="lastName" placeholder="Nom" value={editData.lastName || ''} onChange={handleInputChange} className="h-8" />
                        <Input name="firstName" placeholder="Prénom(s)" value={editData.firstName || ''} onChange={handleInputChange} className="h-8" />
                    </div>
                </TableCell>
                <TableCell>
                    <Input name="matricule" value={editData.matricule || ''} onChange={handleInputChange} className="h-8" />
                </TableCell>
                <TableCell>
                    <Input name="poste" value={editData.poste || ''} onChange={handleInputChange} className="h-8" />
                </TableCell>
                <TableCell>
                     <Select value={editData.department} onValueChange={(value) => handleSelectChange('department', value)}>
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map(dep => <SelectItem key={dep} value={dep}>{dep}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell>
                    <Select value={editData.status} onValueChange={(value: Status) => handleSelectChange('status', value)}>
                        <SelectTrigger className="h-8">
                            <SelectValue placeholder="Sélectionnez..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Active">Actif</SelectItem>
                            <SelectItem value="On Leave">En congé</SelectItem>
                            <SelectItem value="Terminated">Licencié</SelectItem>
                        </SelectContent>
                    </Select>
                </TableCell>
                <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSaveClick}>
                            <Check className="h-4 w-4 text-green-600" />
                            <span className="sr-only">Enregistrer</span>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
                            <X className="h-4 w-4 text-red-600" />
                             <span className="sr-only">Annuler</span>
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        );
    }

    return (
        <TableRow>
            <TableCell>
                <Avatar>
                    <AvatarImage src={employee.photoUrl} alt={employee.name} data-ai-hint="employee photo" />
                    <AvatarFallback>{employee.name?.charAt(0) || 'E'}</AvatarFallback>
                </Avatar>
            </TableCell>
            <TableCell className="font-medium">{`${employee.lastName || ''} ${employee.firstName || ''}`.trim()}</TableCell>
            <TableCell>{employee.matricule}</TableCell>
            <TableCell>{employee.poste}</TableCell>
            <TableCell>{employee.department}</TableCell>
            <TableCell>
                <Badge variant={statusVariantMap[employee.status as Status] || 'default'}>{employee.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
                 <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(employee.id)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Modifier</span>
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(employee.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Supprimer</span>
                    </Button>
                </div>
            </TableCell>
        </TableRow>
    );
}

