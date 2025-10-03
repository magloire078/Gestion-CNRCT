
"use client";

import { useState, useEffect } from "react";
import type { User, Leave, Employe, Evaluation, Asset, Mission } from "@/lib/data";
import { subscribeToLeaves, calculateLeaveBalance } from "@/services/leave-service";
import { getEmployee } from "@/services/employee-service";
import { subscribeToEvaluations } from "@/services/evaluation-service";
import { getAssets } from "@/services/asset-service";
import { getMissions } from "@/services/mission-service";

export function useMySpaceData(user: User | null) {
  const [employeeDetails, setEmployeeDetails] = useState<Employe | null>(null);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      const unsubscribers: (() => void)[] = [];

      // Subscribe to real-time data
      unsubscribers.push(
        subscribeToLeaves((allLeaves) => {
          const userLeaves = allLeaves.filter((l) => l.employee === user.name);
          setLeaves(userLeaves);
          calculateLeaveBalance(userLeaves).then(setLeaveBalance);
        }, console.error)
      );

      unsubscribers.push(
        subscribeToEvaluations((allEvals) => {
          setEvaluations(allEvals.filter((e) => e.employeeId === user.id));
        }, console.error)
      );

      // Fetch one-time data
      Promise.all([
        getEmployee(user.id),
        getAssets(),
        getMissions(),
      ])
        .then(([details, allAssets, allMissions]) => {
          setEmployeeDetails(details);
          setAssets(allAssets.filter((a) => a.assignedTo === user.name));
          setMissions(allMissions.filter((m) => m.participants.some((p) => p.employeeName === user.name)));
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      return () => {
        unsubscribers.forEach((unsub) => unsub());
      };
    } else {
        setLoading(false);
    }
  }, [user]);

  return {
    employeeDetails,
    leaves,
    evaluations,
    assets,
    missions,
    leaveBalance,
    loading,
    isSheetOpen,
    setIsSheetOpen,
  };
}
