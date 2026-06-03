"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
  Sparkles,
  Crown,
  MapPin,
  RotateCcw,
  X,
  Check,
  Loader2,
  CalendarClock,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  subscribeToEvents,
  createEvent,
  deleteEvent,
  expandRecurringEvents,
} from "@/services/event-service";
import type { ChiefEvent, ChiefEventType } from "@/types/chief-event";

// ─── Constants ──────────────────────────────────────────────────────────────

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const EVENT_TYPES: ChiefEventType[] = [
  "Intronisation",
  "Fête traditionnelle",
  "Réunion CNRCT",
  "Médiation",
  "Mission",
  "Commémoration",
  "Autre",
];

const TYPE_CONFIG: Record<ChiefEventType, { color: string; bg: string; dot: string; icon: string }> = {
  "Intronisation":     { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", dot: "bg-amber-500", icon: "👑" },
  "Fête traditionnelle":{ color: "text-violet-700", bg: "bg-violet-50 border-violet-200", dot: "bg-violet-500", icon: "🎊" },
  "Réunion CNRCT":    { color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200", dot: "bg-indigo-500", icon: "🏛️" },
  "Médiation":        { color: "text-sky-700", bg: "bg-sky-50 border-sky-200", dot: "bg-sky-500", icon: "🤝" },
  "Mission":          { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", icon: "📋" },
  "Commémoration":    { color: "text-rose-700", bg: "bg-rose-50 border-rose-200", dot: "bg-rose-500", icon: "🕯️" },
  "Autre":            { color: "text-slate-700", bg: "bg-slate-50 border-slate-200", dot: "bg-slate-400", icon: "📌" },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // Returns 0=Mon … 6=Sun (ISO week)
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function isSameDay(a: string, b: Date) {
  const d = new Date(a);
  return (
    d.getFullYear() === b.getFullYear() &&
    d.getMonth() === b.getMonth() &&
    d.getDate() === b.getDate()
  );
}

function isToday(date: Date) {
  const t = new Date();
  return (
    date.getFullYear() === t.getFullYear() &&
    date.getMonth() === t.getMonth() &&
    date.getDate() === t.getDate()
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function EventPill({ event }: { event: ChiefEvent }) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG["Autre"];
  return (
    <div
      title={event.title}
      className={cn(
        "truncate text-[10px] font-bold rounded-md px-1.5 py-0.5 border cursor-default select-none",
        cfg.bg, cfg.color
      )}
    >
      {cfg.icon} {event.title}
    </div>
  );
}

function AgendaRow({
  event,
  onDelete,
}: {
  event: ChiefEvent;
  onDelete: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[event.type] ?? TYPE_CONFIG["Autre"];
  const date = new Date(event.date);
  return (
    <div className={cn("flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md group", cfg.bg)}>
      {/* Date badge */}
      <div className="flex-shrink-0 text-center w-12">
        <div className="text-2xl font-black text-slate-900 leading-none">{date.getDate()}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase">{MONTHS_FR[date.getMonth()].substring(0, 3)}</div>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{cfg.icon}</span>
          <span className={cn("font-black text-sm truncate", cfg.color)}>{event.title}</span>
          <Badge variant="outline" className={cn("text-[10px] font-bold", cfg.color, cfg.bg)}>{event.type}</Badge>
          {event.recursYearly && (
            <Badge variant="outline" className="text-[10px] font-bold text-violet-600 bg-violet-50 border-violet-200">
              <RotateCcw className="h-3 w-3 mr-1" /> Annuel
            </Badge>
          )}
        </div>
        {event.description && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-400 font-medium">
          {event.region && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {event.region}
              {event.department ? ` / ${event.department}` : ""}
            </span>
          )}
          {event.chiefName && (
            <span className="flex items-center gap-1">
              <Crown className="h-3 w-3" /> {event.chiefName}
            </span>
          )}
        </div>
      </div>
      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-slate-400 hover:text-rose-500 shrink-0"
        onClick={() => onDelete(event.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Create Event Dialog ─────────────────────────────────────────────────────

function CreateEventDialog({
  open,
  onClose,
  defaultDate,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
}) {
  const [form, setForm] = useState({
    title: "",
    type: "Intronisation" as ChiefEventType,
    date: defaultDate ?? new Date().toISOString().split("T")[0],
    endDate: "",
    region: "",
    department: "",
    villageName: "",
    chiefName: "",
    description: "",
    location: "",
    recursYearly: false,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title || !form.date) return;
    setSaving(true);
    try {
      await createEvent({
        title: form.title,
        type: form.type,
        date: form.date,
        endDate: form.endDate || undefined,
        region: form.region || undefined,
        department: form.department || undefined,
        villageName: form.villageName || undefined,
        chiefName: form.chiefName || undefined,
        description: form.description || undefined,
        location: form.location || undefined,
        recursYearly: form.recursYearly,
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-indigo-600" />
            Nouvel Événement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-bold text-slate-600">Titre *</Label>
              <Input
                placeholder="Ex: Intronisation du Chef de Daloa"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Type *</Label>
              <Select value={form.type} onValueChange={(v) => set("type", v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TYPE_CONFIG[t].icon} {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Date *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Date de fin</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Région</Label>
              <Input
                placeholder="Ex: Haut-Sassandra"
                value={form.region}
                onChange={(e) => set("region", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Département</Label>
              <Input
                placeholder="Ex: Daloa"
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Village / Localité</Label>
              <Input
                placeholder="Ex: Zaibo"
                value={form.villageName}
                onChange={(e) => set("villageName", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-600">Chef concerné</Label>
              <Input
                placeholder="Nom du chef"
                value={form.chiefName}
                onChange={(e) => set("chiefName", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-bold text-slate-600">Lieu précis</Label>
              <Input
                placeholder="Ex: Place du village, Palais royal…"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-bold text-slate-600">Description</Label>
              <Textarea
                placeholder="Contexte, programme, participants…"
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                className="rounded-xl resize-none"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between p-3 rounded-xl bg-violet-50 border border-violet-100">
              <div>
                <p className="text-sm font-bold text-violet-900 flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" /> Récurrence annuelle
                </p>
                <p className="text-xs text-violet-600">
                  L'événement sera affiché chaque année à la même date.
                </p>
              </div>
              <Switch
                checked={form.recursYearly}
                onCheckedChange={(v) => set("recursYearly", v)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose} className="rounded-xl">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!form.title || !form.date || saving}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" /> Créer l'événement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

type ViewMode = "month" | "agenda";

export default function EventsCalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView] = useState<ViewMode>("month");
  const [allEvents, setAllEvents] = useState<ChiefEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createDate, setCreateDate] = useState<string | undefined>();
  const [filterType, setFilterType] = useState<ChiefEventType | "all">("all");

  // Real-time subscription
  useEffect(() => {
    const unsub = subscribeToEvents(
      (data) => { setAllEvents(data); setLoading(false); },
      () => setLoading(false)
    );
    return () => unsub();
  }, []);

  // Expand recurring events for the current year
  const events = useMemo(() => {
    const expanded = expandRecurringEvents(allEvents, year);
    if (filterType === "all") return expanded;
    return expanded.filter((e) => e.type === filterType);
  }, [allEvents, year, filterType]);

  // Events in current month
  const monthEvents = useMemo(
    () =>
      events.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [events, year, month]
  );

  // Upcoming events (next 90 days for agenda)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + 90);
    return events
      .filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= limit;
      })
      .slice(0, 50);
  }, [events]);

  // Navigation
  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };
  const goToday = () => { setYear(today.getFullYear()); setMonth(today.getMonth()); };

  const handleDayClick = (d: Date) => {
    setSelectedDay((prev) =>
      prev?.toDateString() === d.toDateString() ? null : d
    );
  };

  const handleDelete = async (id: string) => {
    if (!id.includes("-20")) {
      // Don't delete virtual recurring projections (they have a year suffix)
      await deleteEvent(id);
    }
  };

  const openCreate = (date?: string) => {
    setCreateDate(date);
    setShowCreate(true);
  };

  // Build calendar grid
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInMonth = getDaysInMonth(year, month);
  const calendarCells: (Date | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];
  // Pad to full weeks
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  const selectedDayEvents = selectedDay
    ? events.filter((e) => isSameDay(e.date, selectedDay))
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 p-6 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-black uppercase tracking-[0.2em] text-[10px] shadow-sm">
            <CalendarDays className="h-3.5 w-3.5" />
            Agenda des Chefferies
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter text-slate-900">
            Calendrier{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              des Événements
            </span>
          </h1>
          <p className="text-slate-500 font-medium text-base max-w-xl">
            Intronisations, fêtes traditionnelles, réunions CNRCT et cérémonies coutumières.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <button
              onClick={() => setView("month")}
              className={cn(
                "px-4 py-2 text-sm font-bold transition-all flex items-center gap-2",
                view === "month"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <CalendarDays className="h-4 w-4" /> Mois
            </button>
            <button
              onClick={() => setView("agenda")}
              className={cn(
                "px-4 py-2 text-sm font-bold transition-all flex items-center gap-2",
                view === "agenda"
                  ? "bg-indigo-600 text-white"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <List className="h-4 w-4" /> Agenda
            </button>
          </div>

          {/* Filter by type */}
          <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
            <SelectTrigger className="w-44 rounded-xl border-slate-200 bg-white shadow-sm text-sm font-bold">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_CONFIG[t].icon} {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => openCreate()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 h-10"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Ce mois", value: monthEvents.length, icon: CalendarDays, color: "text-indigo-600", bg: "from-indigo-500/10 to-indigo-500/5" },
          { label: "À venir (90j)", value: upcomingEvents.length, icon: CalendarClock, color: "text-violet-600", bg: "from-violet-500/10 to-violet-500/5" },
          { label: "Intronisations", value: events.filter((e) => e.type === "Intronisation").length, icon: Crown, color: "text-amber-600", bg: "from-amber-500/10 to-amber-500/5" },
          { label: "Fêtes trad.", value: events.filter((e) => e.type === "Fête traditionnelle").length, icon: Flame, color: "text-violet-600", bg: "from-violet-500/10 to-violet-500/5" },
        ].map((kpi) => (
          <Card key={kpi.label} className="border-none shadow-xl shadow-slate-200/40 rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-5 relative">
              <div className={cn("absolute inset-0 opacity-30 bg-gradient-to-br", kpi.bg)} />
              <div className="relative z-10 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl border border-slate-100 bg-white flex items-center justify-center shadow-sm shrink-0">
                  <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-3xl font-black text-slate-900 leading-none">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
        </div>
      ) : view === "month" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2">
            <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
              {/* Month navigation */}
              <CardHeader className="p-6 pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                      <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>
                    <h2 className="text-xl font-black text-slate-900 w-44 text-center">
                      {MONTHS_FR[month]} {year}
                    </h2>
                    <button onClick={nextMonth} className="h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm">
                      <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>
                  <Button variant="outline" size="sm" onClick={goToday} className="rounded-xl text-xs font-bold">
                    Aujourd'hui
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-6 pt-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAYS_FR.map((d) => (
                    <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-1">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Grid rows */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarCells.map((date, i) => {
                    if (!date) return <div key={`empty-${i}`} />;
                    const dayEvts = monthEvents.filter((e) => isSameDay(e.date, date));
                    const isTdy = isToday(date);
                    const isSelected = selectedDay?.toDateString() === date.toDateString();
                    return (
                      <div
                        key={date.toISOString()}
                        onClick={() => handleDayClick(date)}
                        className={cn(
                          "rounded-xl p-1.5 cursor-pointer transition-all duration-200 min-h-[80px] border",
                          isTdy ? "bg-indigo-50 border-indigo-200" : "border-transparent hover:bg-slate-50",
                          isSelected && "ring-2 ring-indigo-500 ring-offset-1"
                        )}
                      >
                        <div className={cn(
                          "text-xs font-black mb-1 h-6 w-6 flex items-center justify-center rounded-full",
                          isTdy ? "bg-indigo-600 text-white" : "text-slate-700"
                        )}>
                          {date.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvts.slice(0, 2).map((e) => (
                            <EventPill key={e.id} event={e} />
                          ))}
                          {dayEvts.length > 2 && (
                            <div className="text-[9px] text-slate-400 font-bold pl-1">
                              +{dayEvts.length - 2} autres
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: selected day or upcoming */}
          <div className="space-y-4">
            {selectedDay ? (
              <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
                <CardHeader className="p-5 pb-3 border-b border-slate-50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-black text-slate-900">
                      {selectedDay.getDate()} {MONTHS_FR[selectedDay.getMonth()]}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-xs h-7"
                        onClick={() =>
                          openCreate(`${year}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`)
                        }
                      >
                        <Plus className="h-3 w-3 mr-1" /> Ajouter
                      </Button>
                      <button onClick={() => setSelectedDay(null)} className="text-slate-400 hover:text-slate-700 transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {selectedDayEvents.length === 0 ? (
                    <div className="text-center py-4">
                      <Sparkles className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-sm text-slate-400 font-medium">Aucun événement ce jour</p>
                    </div>
                  ) : (
                    selectedDayEvents.map((e) => (
                      <AgendaRow key={e.id} event={e} onDelete={handleDelete} />
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}

            {/* Upcoming events */}
            <Card className="border-none shadow-xl rounded-2xl overflow-hidden bg-white">
              <CardHeader className="p-5 pb-3 border-b border-slate-50">
                <CardTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-indigo-500" />
                  Prochains événements
                </CardTitle>
                <CardDescription className="text-xs font-medium">Dans les 90 prochains jours</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-4">
                    <Sparkles className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">Aucun événement à venir</p>
                    <Button size="sm" variant="outline" className="mt-4 rounded-xl text-xs" onClick={() => openCreate()}>
                      <Plus className="h-3 w-3 mr-1" /> Ajouter un événement
                    </Button>
                  </div>
                ) : (
                  upcomingEvents.map((e) => (
                    <AgendaRow key={e.id} event={e} onDelete={handleDelete} />
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* ── Agenda view ── */
        <Card className="border-none shadow-2xl shadow-slate-200/50 rounded-2xl overflow-hidden bg-white">
          <CardHeader className="p-6 pb-4 border-b border-slate-50 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl font-black text-slate-900">Vue Agenda</CardTitle>
              <CardDescription className="font-medium">Tous les événements, triés par date</CardDescription>
            </div>
            <Button onClick={() => openCreate()} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
              <Plus className="h-4 w-4 mr-2" /> Ajouter
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-3 max-h-[75vh] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center py-16">
                <CalendarDays className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium">Aucun événement enregistré</p>
                <Button size="sm" variant="outline" className="mt-4 rounded-xl" onClick={() => openCreate()}>
                  <Plus className="h-3 w-3 mr-1" /> Créer le premier événement
                </Button>
              </div>
            ) : (
              events.map((e) => (
                <AgendaRow key={e.id} event={e} onDelete={handleDelete} />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <CreateEventDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultDate={createDate}
      />
    </div>
  );
}
