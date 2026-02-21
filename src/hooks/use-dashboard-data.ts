"use client";

import { useState, useEffect, useMemo } from "react";
import type { User, Leave, Employe, Evaluation, Asset, Mission, Chief, Department, OrganizationSettings } from "@/lib/data";
import { subscribeToLeaves, calculateLeaveBalance } from "@/services/leave-service";
import { getEmployee, subscribeToEmployees, getEmployeeGroup } from "@/services/employee-service";
import { subscribeToEvaluations } from "@/services/evaluation-service";
import { getAssets, subscribeToAssets } from "@/services/asset-service";
import { getMissions, subscribeToMissions } from "@/services/mission-service";
import { getDashboardSummary } from "@/ai/flows/dashboard-summary-flow";
import { getOrganizationSettings } from "@/services/organization-service";
import { subscribeToChiefs } from "@/services/chief-service";
import { subscribeToDepartments } from "@/services/department-service";
import { parseISO, differenceInYears, isAfter } from 'date-fns';
let cachedSummary: string | null = null;
let isSummaryFetching = false;

export function useDashboardData(user: User | null) {
    const [globalStats, setGlobalStats] = useState({
        employees: [] as Employe[],
        allChiefs: [] as Chief[],
        departments: [] as Department[],
        activeEmployees: 0,
        cnpsEmployees: 0,
        missionsInProgress: 0,
        chiefs: 0,
    });
    const [personalStats, setPersonalStats] = useState({
        leaveBalance: null as number | null,
        latestEvaluation: null as Evaluation | null,
        upcomingMissions: 0,
    });
    const [summary, setSummary] = useState<string | null>(null);
    const [organizationLogos, setOrganizationLogos] = useState<OrganizationSettings | null>(null);
    const [seniorityAnniversaries, setSeniorityAnniversaries] = useState<Employe[]>([]);
    const [upcomingRetirements, setUpcomingRetirements] = useState<(Employe & { calculatedRetirementDate: Date })[]>([]);

    const [loading, setLoading] = useState(true);
    const [loadingSummary, setLoadingSummary] = useState(true);

    const [selectedAnniversaryMonth, setSelectedAnniversaryMonth] = useState<string>((new Date().getMonth()).toString());
    const [selectedAnniversaryYear, setSelectedAnniversaryYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedRetirementYear, setSelectedRetirementYear] = useState<string>(new Date().getFullYear().toString());

    useEffect(() => {
        setLoading(true);
        setLoadingSummary(true);

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
            unsubscribers.push(subscribeToEmployees(employees => {
                if (!isMounted) return;
                setGlobalStats(prev => ({
                    ...prev,
                    employees,
                    activeEmployees: employees.filter(e => e.status === 'Actif').length,
                    cnpsEmployees: employees.filter(e => e.CNPS === true && e.status === 'Actif').length
                }));
            }, console.error));

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
                setGlobalStats(prev => ({ ...prev, missionsInProgress: missions.filter(m => m.status === 'En cours').length }));
            }, console.error));

            await new Promise(resolve => setTimeout(resolve, 50));
            if (!isMounted) return;

            unsubscribers.push(subscribeToDepartments(departments => {
                if (!isMounted) return;
                setGlobalStats(prev => ({ ...prev, departments }));
            }, console.error));

            if (cachedSummary) {
                if (isMounted) {
                    setSummary(cachedSummary);
                    setLoadingSummary(false);
                }
            } else if (!isSummaryFetching) {
                isSummaryFetching = true;
                getDashboardSummary()
                    .then(summary => {
                        cachedSummary = summary;
                        if (isMounted) setSummary(summary);
                    })
                    .catch(console.error)
                    .finally(() => {
                        isSummaryFetching = false;
                        if (isMounted) setLoadingSummary(false);
                    });
            } else {
                if (isMounted) setLoadingSummary(false);
            }

            // --- Personal Data ---
            if (user) {
                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                unsubscribers.push(subscribeToLeaves(allLeaves => {
                    if (!isMounted) return;
                    const userLeaves = allLeaves.filter(l => l.employee === user.name);
                    calculateLeaveBalance(userLeaves).then(balance => {
                        if (isMounted) setPersonalStats(prev => ({ ...prev, leaveBalance: balance }));
                    });
                }, console.error));

                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                unsubscribers.push(subscribeToEvaluations(allEvals => {
                    if (!isMounted) return;
                    const userEvals = allEvals.filter(e => e.employeeId === user.id);
                    const latestEval = userEvals.sort((a, b) => new Date(b.evaluationDate).getTime() - new Date(a.evaluationDate).getTime())[0] || null;
                    setPersonalStats(prev => ({ ...prev, latestEvaluation: latestEval }));
                }, console.error));

                await new Promise(resolve => setTimeout(resolve, 50));
                if (!isMounted) return;

                unsubscribers.push(subscribeToMissions(allMissions => {
                    if (!isMounted) return;
                    const today = new Date();
                    const upcoming = allMissions.filter(m =>
                        m.participants.some(p => p.employeeName === user.name) &&
                        isAfter(parseISO(m.endDate), today) &&
                        (m.status === 'Planifiée' || m.status === 'En cours')
                    ).length;
                    setPersonalStats(prev => ({ ...prev, upcomingMissions: upcoming }));
                }, console.error));
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

        const anniversaries = globalStats.employees.filter(emp => {
            if (!emp.dateEmbauche || emp.CNPS !== true) return false;
            try {
                const hireDate = parseISO(emp.dateEmbauche);
                return hireDate.getMonth() === anniversaryMonth && differenceInYears(referenceDate, hireDate) >= 2;
            } catch { return false; }
        });
        setSeniorityAnniversaries(anniversaries);

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


    return {
        globalStats,
        personalStats,
        loading,
        summary,
        loadingSummary,
        organizationLogos,
        seniorityAnniversaries,
        upcomingRetirements,
        selectedAnniversaryMonth,
        setSelectedAnniversaryMonth,
        selectedAnniversaryYear,
        setSelectedAnniversaryYear,
        selectedRetirementYear,
        setSelectedRetirementYear
    };
}
