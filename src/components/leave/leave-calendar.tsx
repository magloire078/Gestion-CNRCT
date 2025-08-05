
"use client";

import { useState, useMemo } from 'react';
import { eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { Leave } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

interface LeaveCalendarProps {
  leaves: Leave[];
}

export function LeaveCalendar({ leaves }: LeaveCalendarProps) {
  const [month, setMonth] = useState(startOfMonth(new Date()));

  const leavesByDate = useMemo(() => {
    const approvedLeaves = leaves.filter(l => l.status === 'Approuvé');
    const events = new Map<string, { names: string[], types: string[] }>();

    approvedLeaves.forEach(leave => {
      try {
        const interval = eachDayOfInterval({
          start: parseISO(leave.startDate),
          end: parseISO(leave.endDate),
        });

        interval.forEach(day => {
          const dateString = day.toISOString().split('T')[0];
          if (!events.has(dateString)) {
            events.set(dateString, { names: [], types: [] });
          }
          const event = events.get(dateString);
          if (event && !event.names.includes(leave.employee)) {
             event.names.push(leave.employee);
             if (!event.types.includes(leave.type)) {
                event.types.push(leave.type);
             }
          }
        });
      } catch (error) {
         console.error(`Invalid date format for leave ID ${leave.id}:`, leave.startDate, leave.endDate);
      }
    });

    return events;
  }, [leaves]);

  const DayContentWithPopover = (day: Date) => {
    const dateString = day.toISOString().split('T')[0];
    const dayLeaves = leavesByDate.get(dateString);

    if (dayLeaves && dayLeaves.names.length > 0) {
      return (
        <Popover>
          <PopoverTrigger asChild>
            <div className="relative h-full w-full flex items-center justify-center">
              <span>{day.getDate()}</span>
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-3 w-3 p-0 justify-center text-[8px] leading-none">
                {dayLeaves.names.length}
              </Badge>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-60">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Employés en congé</h4>
              <p className="text-sm text-muted-foreground">
                {day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <ul className="list-disc list-inside text-sm">
                {dayLeaves.names.map((name, index) => (
                  <li key={index}>{name}</li>
                ))}
              </ul>
            </div>
          </PopoverContent>
        </Popover>
      );
    }
    return <span>{day.getDate()}</span>;
  };

  if (!leaves) {
      return <Skeleton className="h-[350px] w-full" />
  }

  return (
    <Calendar
      month={month}
      onMonthChange={setMonth}
      modifiers={{ onLeave: Array.from(leavesByDate.keys()).map(dateStr => parseISO(dateStr)) }}
      modifiersClassNames={{ onLeave: 'bg-primary/20 rounded-md font-bold' }}
      components={{
        DayContent: ({ date }) => DayContentWithPopover(date),
      }}
      className="p-0"
    />
  );
}
