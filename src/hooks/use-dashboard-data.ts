"use client";

import { useState, useEffect, useMemo } from "react";
import type { User, Leave, Employe, Evaluation, Asset, Mission, Chief, Department, OrganizationSettings } from "@/lib/data";
import { subscribeToLeaves, subscribeToUserLeaves, calculateLeaveBalance } from "@/services/leave-service";
import { getEmployee, subscribeToEmployees, getEmployeeGroup, subscribeToDirectoireMembers } from "@/services/employee-service";
import { subscribeToEvaluations, subscribeToUserEvaluations } from "@/services/evaluation-service";
import { getAssets, subscribeToAssets } from "@/services/asset-service";
import { getMissions, subscribeToMissions } from "@/services/mission-service";
import { getOrganizationSettings } from "@/services/organization-service";
import { subscribeToChiefs } from "@/services/chief-service";
import { subscribeToDepartments } from "@/services/department-service";
import { subscribeToConflicts } from "@/services/conflict-service";
import type { Conflict } from "@/types/common";
import { parseISO, differenceInYears, isAfter, isBefore, isWithinInterval, startOfDay } from 'date-fns';
import { DEFAULT_ROLE_PERMISSIONS } from "@/types/permissions";

export function useDashboardData(user: User | null) {
    const [globalStats, setGlobalStats] = useState({
        employees: [] as Employe[],
        allChiefs: [] as Chief[],
        departments: [] as Department[],
        activeEmployees: 0,
        cnpsEmployees: 0,
        missionsInProgress: 0,
        chiefs: 0,
        conflicts: [] as Conflict[],
    });
    const [personalStats, setPersonalStats] = useState({
        leaveBalance: null as number | null,
        latestEvaluation: null as Evaluation | null,
        latestLeave: null as Leave | null,
        upcomingMissions: 0,
    });
    const [summary, setSummary] = useState<string | null>(null);
    const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
    const [seniorityAnniversaries, setSeniorityAnniversaries] = useState<Employe[]>([]);
    const [birthdayAnniversaries, setBirthdayAnniversaries] = useState<Employe[]>([]);
    const [allRawLeaves, setAllRawLeaves] = useState<Leave[]>([]);
    const [upcomingRetirements, setUpcomingRetirements] = useState<(Employe & { calculatedRetirementDate: Date })[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(true);

    const [selectedAnniversaryMonth, setSelectedAnniversaryMonth] = useState<string>((new Date().getMonth()).toString());
    const [selectedAnniversaryYear, setSelectedAnniversaryYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedRetirementYear, setSelectedRetirementYear] = useState<string>(new Date().getFullYear().toString());

    const hasPermission = (resourceId: string, action: 'read' | 'create' | 'update' | 'delete' = 'read') => {
        if (!user || !user.roleId) return false;
        if (user.roleId === 'super-admin' || user.roleId === 'LHcHyfBzile3r0vyFOFb') return true;
        const rolePerms = DEFAULT_ROLE_PERMISSIONS[user.roleId];
        if (!rolePerms) return false;
        const resourcePerm = rolePerms[resourceId];
        if (!resourcePerm) return false;
        return resourcePerm[action];
    };

    useEffect(() => {
        setLoading(true);
        setLoadingSummary(false); // Summary disabled

        const unsubscribers: (() => void)[] = [];
        let isMounted = true;

        // Stagger listener initialization to prevent Firestore SDK overload
        // Initialize listeners sequentially with delays
        const initializeListeners = async () => {
            if (!isMounted) return;

            // Non-realtime data fetching (always safe, no auth required)
            getOrganizationSettings().then(logos => {
                if (isMounted) setOrganizationLogos(logos);
            });

            // All Firestore listeners require authentication — only start them when user is available
            if (!user) {
                setLoadingSummary(false);
                return;
            }

            // --- Global Data (initialized with delays) ---
            const canReadAllEmployees = hasPermission('employees', 'read');

            if (canReadAllEmployees) {
                unsubscribers.push(subscribeToEmployees(employees => {
                    if (!isMounted) return;
                    setGlobalStats(prev => ({
                        ...prev,
                        employees,
                        activeEmployees: employees.filter(e => e.status === 'Actif').length,
                        cnpsEmployees: employees.filter(e => e.CNPS === true && e.status === 'Actif').length
                    }));
                }, console.error));
            } else {
                // Regular users can only see Directoire members (for the map)
                unsubscribers.push(subscribeToDirectoireMembers((employees: Employe[]) => {
                    if (!isMounted) return;
                    setGlobalStats(prev => ({
                        ...prev,
                        employees,
                        activeEmployees: employees.filter((e: Employe) => e.status === 'Actif').length,
                        cnpsEmployees: 0 // Information restricted
                    }));
                }, console.error));
            }

            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            unsubscribers.push(subscribeToChiefs(chiefs => {
                if (!isMounted) return;
                setGlobalStats(prev => ({ ...prev, allChiefs: chiefs, chiefs: chiefs.length }));
            }, console.error));

            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            unsubscribers.push(subscribeToMissions(missions => {
                if (!isMounted) return;

                // Update Global Stats
                setGlobalStats(prev => ({
                    ...prev,
                    missionsInProgress: missions.filter(m => m.status === 'En cours').length
                }));

                // Update Personal Stats if user is available
                if (user) {
                    const today = new Date();
                    const upcoming = missions.filter(m =>
                        m.participants.some(p => p.employeeName === user.name) &&
                        isAfter(parseISO(m.endDate), today) &&
                        (m.status === 'Planifiée' || m.status === 'En cours')
                    ).length;
                    setPersonalStats(prev => ({ ...prev, upcomingMissions: upcoming }));
                }
            }, console.error));

            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            unsubscribers.push(subscribeToDepartments(departments => {
                if (!isMounted) return;
                setGlobalStats(prev => ({ ...prev, departments }));
            }, console.error));

            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            const canReadConflicts = hasPermission('conflicts', 'read');
            if (canReadConflicts) {
                unsubscribers.push(subscribeToConflicts(conflicts => {
                    if (!isMounted) return;
                    setGlobalStats(prev => ({ ...prev, conflicts }));
                }, console.error));
            }

            // --- Leaves Tracking (Global) ---
            const canReadGlobalLeaves = hasPermission('leaves', 'read');
            
            if (canReadGlobalLeaves) {
                unsubscribers.push(subscribeToLeaves(allLeaves => {
                    if (!isMounted) return;
                    setAllRawLeaves(allLeaves);
                }, console.error));
            }

            setLoadingSummary(false);

            // --- Personal Data ---
            if (user) {
                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                if (user.employeeId) {
                    unsubscribers.push(subscribeToUserLeaves(user.employeeId, allLeaves => {
                        if (!isMounted) return;
                        // allLeaves are already filtered by employeeId in this new subscription
                        const latest = allLeaves.length > 0 ? allLeaves.sort((a,b) => parseISO(b.startDate).getTime() - parseISO(a.startDate).getTime())[0] : null;
                        setPersonalStats(prev => ({ ...prev, latestLeave: latest }));
                        
                        calculateLeaveBalance(allLeaves).then(balance => {
                            if (isMounted) setPersonalStats(prev => ({ ...prev, leaveBalance: balance }));
                        });
                    }, console.error));

                    await new Promise(resolve => setTimeout(resolve, 50));
                    if (!isMounted) return;

                    unsubscribers.push(subscribeToUserEvaluations(user.employeeId, userEvals => {
                        if (!isMounted) return;
                        const latestEval = userEvals[0] || null; // Already sorted by date in the service
                        setPersonalStats(prev => ({ ...prev, latestEvaluation: latestEval }));
                    }, console.error));
                }

            }
        };

        initializeListeners();

        const timer = setTimeout(() => setLoading(false), 2000); // Fallback to stop loading

        return () => {
            isMounted = false;
            unsubscribers.forEach(unsub => unsub());
            clearTimeout(timer);
        };

    }, [user]);


    useEffect(() => {
        const anniversaryMonth = parseInt(selectedAnniversaryMonth);
        const anniversaryYear = parseInt(selectedAnniversaryYear);
        const referenceDate = new Date(anniversaryYear, anniversaryMonth);

        const seniority = globalStats.employees.filter(emp => {
            if (!emp.dateEmbauche || emp.status !== 'Actif') return false;
            try {
                const hireDate = parseISO(emp.dateEmbauche);
                return hireDate.getMonth() === anniversaryMonth && differenceInYears(referenceDate, hireDate) >= 1;
            } catch { return false; }
        });
        setSeniorityAnniversaries(seniority);

        const birthdays = globalStats.employees.filter(emp => {
            if (!emp.Date_Naissance || emp.status !== 'Actif') return false;
            try {
                const birthDate = parseISO(emp.Date_Naissance);
                return birthDate.getMonth() === anniversaryMonth;
            } catch { return false; }
        });
        setBirthdayAnniversaries(birthdays);

        const retirementYearNum = parseInt(selectedRetirementYear);
        const retirements = globalStats.employees
            .map(emp => {
                if (!emp.Date_Naissance) return null;
                try {
                    const birthDate = parseISO(emp.Date_Naissance);
                    const retirementDate = new Date(birthDate.getFullYear() + 60, 11, 31);
                    return { ...emp, calculatedRetirementDate: retirementDate };
                } catch { return null; }
            })
            .filter((emp): emp is Employe & { calculatedRetirementDate: Date } => {
                if (!emp || emp.status === 'Retraité' || emp.status === 'Décédé') return false;
                return emp.calculatedRetirementDate.getFullYear() === retirementYearNum;
            })
            .sort((a, b) => a.calculatedRetirementDate.getTime() - b.calculatedRetirementDate.getTime());
        setUpcomingRetirements(retirements);

    }, [globalStats.employees, selectedAnniversaryMonth, selectedAnniversaryYear, selectedRetirementYear]);
    
    const employeesOnLeave = useMemo(() => {
        const today = startOfDay(new Date());
        
        const activeLeaves = allRawLeaves.filter(l => {
            if (l.status !== 'Approuvé') return false;
            try {
                const start = parseISO(l.startDate);
                const end = parseISO(l.endDate);
                return isWithinInterval(today, { start, end });
            } catch { return false; }
        });

        // Map leaves to actual employee objects found in globalStats.employees
        return activeLeaves.map(leave => {
            const employee = globalStats.employees.find(e => e.id === leave.employeeId);
            if (!employee) return null;
            return {
                ...employee,
                leaveType: leave.type as string,
                returnDate: leave.endDate
            };
        }).filter((e): e is (Employe & { leaveType: string, returnDate: string }) => e !== null);
    }, [allRawLeaves, globalStats.employees]);


    return {
        globalStats,
        personalStats,
        loading,
        summary,
        loadingSummary,
        organizationLogos,
        seniorityAnniversaries,
        birthdayAnniversaries,
        employeesOnLeave,
        upcomingRetirements,
        selectedAnniversaryMonth,
        setSelectedAnniversaryMonth,
        selectedAnniversaryYear,
        setSelectedAnniversaryYear,
        selectedRetirementYear,
        setSelectedRetirementYear
    };
}
