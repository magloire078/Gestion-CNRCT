"use client";

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { Chief } from '@/types/chief';

// Import dynamique sans SSR pour éviter les erreurs "window is not defined"
const ChiefsMap = dynamic(() => import('./chiefs-map'), {
  ssr: false,
  loading: () => <Skeleton className="w-full h-full min-h-[500px] rounded-xl bg-slate-100" />
});

interface ChiefsMapWrapperProps {
  chiefs: Chief[];
  onChiefClick?: (chief: Chief) => void;
  height?: string;
}

export function ChiefsMapWrapper({ chiefs, onChiefClick, height }: ChiefsMapWrapperProps) {
  return <ChiefsMap chiefs={chiefs} onChiefClick={onChiefClick} height={height} />;
}
