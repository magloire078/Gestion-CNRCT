"use client";

import { useEffect, useState } from "react";
import { getDirectoireMembers, getEmployeeDirectory, type RegionalCommittee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";
import { divisions } from "@/lib/ivory-coast-divisions";
import { getOfficialRegion, getOfficialDepartment } from "@/lib/normalization-utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

// Import landing components
import { OrganizationStructure } from "@/components/landing/organization-structure";
import { BureauDirectoire } from "@/components/landing/bureau-directoire";
import { RegionalCommittees } from "@/components/landing/regional-committees";

export default function InstitutionPage() {
    const [directoireMembers, setDirectoireMembers] = useState<Employe[]>([]);
    const [regionalCommittees, setRegionalCommittees] = useState<RegionalCommittee[]>([]);
    const [allDirectors, setAllDirectors] = useState<Employe[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [membersRaw, directoryRaw] = await Promise.all([
                    getDirectoireMembers(),
                    getEmployeeDirectory()
                ]);
                const directory = directoryRaw.filter(emp => emp.status === 'Actif' || emp.status === 'En congé' || !emp.status);
                let members = membersRaw.filter(emp => emp.status === 'Actif' || emp.status === 'En congé' || !emp.status);

                // Fallback: Si l'API renvoie une liste vide, on extrait les membres du Directoire depuis l'annuaire
                if (members.length === 0 && directory.length > 0) {
                    const DIRECTOIRE_DEPT_ID = '9ywKFDgVMS86rZLPYhpm';
                    const DIRECTOIRE_KEYWORDS = [
                        'president du directoire', 'président du directoire', 'vice-president', 'vice-président', 
                        'secretaire general', 'secrétaire général', 'membre du directoire', 
                        'membre du bureau', 'directrice de cabinet', 'directeur de cabinet'
                    ];
                    members = directory.filter(emp => {
                        const p = (emp.poste || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const isSupport = ['secretariat', 'secretaire', 'assistant', 'assistante', 'chauffeur', 'protocole'].some(kw => p.includes(kw)) && !p.includes('secretaire general');
                        if (isSupport) return false;
                        if (emp.departmentId === DIRECTOIRE_DEPT_ID) return true;
                        return DIRECTOIRE_KEYWORDS.some(kw => p.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')));
                    });
                }

                setDirectoireMembers(members);

                // Compute regional committees locally
                const regionsList = Object.keys(divisions);
                const computedCommittees: RegionalCommittee[] = regionsList.map(region => {
                    const officialRegion = getOfficialRegion(region);
                    const depts = Object.keys(divisions[officialRegion] || {});
                    
                    const president = directory.find(emp => 
                        getOfficialRegion(emp.Region || "") === officialRegion && 
                        emp.poste?.toLowerCase().includes('membre du directoire')
                    ) || null;

                    const committeeMembers: Employe[] = [];
                    if (president) committeeMembers.push(president);

                    depts.forEach(dept => {
                        const officialDept = getOfficialDepartment(officialRegion, dept);
                        const deptMembers = directory.filter(emp => 
                            getOfficialRegion(emp.Region || "") === officialRegion && 
                            getOfficialDepartment(officialRegion, emp.Departement || "") === officialDept && 
                            emp.id !== president?.id &&
                            (emp.poste?.toLowerCase().includes('comité') || emp.poste?.toLowerCase().includes('comite'))
                        );
                        committeeMembers.push(...deptMembers.slice(0, 2));
                    });

                    return {
                        region,
                        president,
                        members: committeeMembers
                    };
                });
                setRegionalCommittees(computedCommittees);

                const directors = directory.filter(m => {
                    const p = m.poste?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
                    return (p.includes('directeur') || p.includes('directrice')) &&
                           !p.includes('secretaire general') &&
                           !p.includes('directrice de cabinet') &&
                           !p.includes('directeur de cabinet') &&
                           !p.includes('chef de cabinet') &&
                           !p.includes('cabinet') &&
                           !p.includes('sous-directeur') &&
                           !p.includes('sous-directrice') &&
                           !p.includes('assistant') &&
                           !p.includes('chauffeur');
                });
                setAllDirectors(directors);

                if (computedCommittees.length > 0) {
                    setSelectedRegionIndex(0);
                }
            } catch (error) {
                console.error("Error fetching institution data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <PermissionGuard permission="page:organization-chart:view">
            <div className="flex flex-col min-h-screen bg-[#fafaf8] text-[#1a1a1a] font-body rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <main className="flex-1">
                    <OrganizationStructure />
                    
                    <BureauDirectoire 
                        loading={loading} 
                        members={directoireMembers}
                        allDirectors={allDirectors}
                    />

                    <RegionalCommittees 
                        loading={loading}
                        regionalCommittees={regionalCommittees}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedRegionIndex={selectedRegionIndex}
                        setSelectedRegionIndex={setSelectedRegionIndex}
                    />
                </main>
            </div>
        </PermissionGuard>
    );
}
