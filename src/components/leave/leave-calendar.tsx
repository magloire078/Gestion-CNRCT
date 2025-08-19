"use client";

import { useState, useMemo } from 'react';
import { eachDayOfInterval, parseISO, getDay } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import type { Leave } from '@/lib/data';
import { Skeleton } from '../ui/skeleton';

interface LeaveCalendarProps {
  leaves: Leave[];
}

const COLORS = [
  'bg-blue-200 text-blue-800 border-blue-300',
  'bg-green-200 text-green-800 border-green-300',
  'bg-yellow-200 text-yellow-800 border-yellow-300',
  'bg-purple-200 text-purple-800 border-purple-300',
  'bg-pink-200 text-pink-800 border-pink-300',
];

export function LeaveCalendar({ leaves }: LeaveCalendarProps) {
  const [month, setMonth] = useState(new Date());

  const leavesByDate = useMemo(() => {
    const approvedLeaves = leaves.filter(l => l.status === 'Approuvé');
    const events = new Map<string, { employee: string, type: string }[]>();

    approvedLeaves.forEach(leave => {
      try {
        const interval = eachDayOfInterval({
          start: parseISO(leave.startDate),
          end: parseISO(leave.endDate),
        });

        interval.forEach(day => {
          const dateString = day.toISOString().split('T')[0];
          if (!events.has(dateString)) {
            events.set(dateString, []);
          }
          const dayEvents = events.get(dateString);
          if (dayEvents && !dayEvents.some(e => e.employee === leave.employee)) {
             dayEvents.push({ employee: leave.employee, type: leave.type });
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
    const dayLeaves = leavesByDate.get(dateString) || [];
    const isWeekend = getDay(day) === 0 || getDay(day) === 6;

    const leavesToShow = dayLeaves.slice(0, 2);
    const remainingLeaves = dayLeaves.slice(2);

    return (
      <div className={`h-full w-full flex flex-col p-1 ${isWeekend ? 'bg-muted/50 rounded-md' : ''}`}>
        <div className="flex-shrink-0 text-right text-xs pr-1">{day.getDate()}</div>
        <div className="flex-grow space-y-1 overflow-hidden mt-1">
          {leavesToShow.map((leave, index) => (
            <div key={index} className={`text-xs p-0.5 rounded-sm truncate ${COLORS[index % COLORS.length]}`}>
              {leave.employee}
            </div>
          ))}
          {remainingLeaves.length > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                 <div className="text-xs p-0.5 rounded-sm bg-gray-300 text-gray-800 cursor-pointer hover:bg-gray-400">
                    + {remainingLeaves.length} de plus
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-60">
                 <div className="space-y-2">
                  <h4 className="font-medium leading-none">Employés en congé</h4>
                   <p className="text-sm text-muted-foreground">
                    {day.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <ul className="list-disc list-inside text-sm">
                    {dayLeaves.map((l, i) => (
                      <li key={i}>{l.employee}</li>
                    ))}
                  </ul>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    );
  };

  if (!leaves) {
      return <Skeleton className="h-[600px] w-full" />
  }

  return (
    <Calendar
      month={month}
      onMonthChange={setMonth}
      classNames={{
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-24 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
          day: "h-full w-full p-0 focus-within:relative focus-within:z-20 border border-transparent hover:border-primary rounded-md",
          day_today: "border-primary",
      }}
      components={{
        DayContent: ({ date }) => DayContentWithPopover(date),
      }}
      className="p-0"
    />
  );
}
