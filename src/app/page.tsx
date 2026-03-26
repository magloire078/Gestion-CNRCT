"use client";

import { useEffect, useState } from "react";
import { getDirectoireMembers, getRegionalCommittees, type RegionalCommittee } from "@/services/employee-service";
import type { Employe } from "@/lib/data";

// Import landing components
import { LandingHeader } from "@/components/landing/landing-header";
import { HeroSection } from "@/components/landing/hero-section";
import { MissionsSection } from "@/components/landing/missions-section";
import { OrganizationStructure } from "@/components/landing/organization-structure";
import { TraditionalHierarchy } from "@/components/landing/traditional-hierarchy";
import { BureauDirectoire } from "@/components/landing/bureau-directoire";
import { RegionalCommittees } from "@/components/landing/regional-committees";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
    const [directoireMembers, setDirectoireMembers] = useState<Employe[]>([]);
    const [regionalCommittees, setRegionalCommittees] = useState<RegionalCommittee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRegionIndex, setSelectedRegionIndex] = useState<number>(0);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [members, committees] = await Promise.all([
                    getDirectoireMembers(),
                    getRegionalCommittees()
                ]);
                setDirectoireMembers(members);
                setRegionalCommittees(committees);

                if (committees.length > 0) {
                    setSelectedRegionIndex(0);
                }
            } catch (error) {
                console.error("Error fetching landing page data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-[#fafaf8] text-[#1a1a1a] font-body selection:bg-primary/20">
            <LandingHeader />

            <main className="flex-1">
                <HeroSection />
                <MissionsSection />
                <OrganizationStructure />
                <TraditionalHierarchy />
                
                <BureauDirectoire 
                    loading={loading} 
                    members={directoireMembers} 
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

            <LandingFooter />
        </div>
    );
}

