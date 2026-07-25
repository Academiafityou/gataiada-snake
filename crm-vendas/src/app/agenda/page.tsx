"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCRMStore } from "@/lib/store";
import type { CalendarEvent, EventType, Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Phone,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  addDays,
  startOfDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CRMLayout } from "@/components/layout/crm-layout";

type ViewMode = "mensal" | "semanal" | "diaria";

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; bg: string; text: string; dot: string }
> = {
  followup: {
    label: "Follow-up",
    color: "border-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-700 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  reuniao: {
    label: "Reunião",
    color: "border-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    dot: "bg-blue-500",
  },
  ligacao: {
    label: "Ligação",
    color: "border-green-400",
    bg: "bg-green-100 dark:bg-green-950/40",
    text: "text-green-700 dark:text-green-300",
    dot: "bg-green-500",
  },
  compromisso: {
    label: "Compromisso",
    color: "border-purple-400",
    bg: "bg-purple-100 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    dot: "bg-purple-500",
  },
};

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  agendado: { label: "Agendado", variant: "default" },
  concluido: { label: "Concluído", variant: "secondary" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

interface EventFormData {
  title: string;
  clientId: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: "agendado" | "concluido" | "cancelado";
}

const EMPTY_FORM: EventFormData = {
  title: "",
  clientId: "",
  type: "reuniao",
  date: format(new Date(), "yyyy-MM-dd"),
  startTime: "09:00",
  endTime: "10:00",
  description: "",
  status: "agendado",
};

export default function AgendaPage() {
  const {
    calendarEvents,
    clients,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
  } = useCRMStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("mensal");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth < 768) {
        setViewMode("diaria");
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const getClientName = useCallback(
    (clientId: string): string => {
      const client = clients.find((c) => c.id === clientId);
      return client ? client.name : "Sem cliente";
    },
    [clients]
  );

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(currentDate, { weekStartsOn: 1 }) });
  }, [currentDate]);

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsByDate(selectedDate);
  }, [selectedDate, getEventsByDate]);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let h = 8; h <= 20; h++) {
      slots.push(`${String(h).padStart(2, "0")}:00`);
    }
    return slots;
  }, []);

  const eventsForCurrentWeek = useMemo(() => {
    const events: CalendarEvent[] = [];
    weekDays.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      events.push(...getEventsByDate(dateStr));
    });
    return events;
  }, [weekDays, getEventsByDate]);

  const navigatePrev = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === "mensal" ? subMonths(prev, 1) : addDays(prev, -7)
    );
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setCurrentDate((prev) =>
      viewMode === "mensal" ? addMonths(prev, 1) : addDays(prev, 7)
    );
  }, [viewMode]);

  const navigateDay = useCallback((direction: number) => {
    setCurrentDate((prev) => addDays(prev, direction));
  }, []);

  const openNewEvent = useCallback(
    (date?: string) => {
      setEditingEvent(null);
      setFormData({ ...EMPTY_FORM, date: date || format(new Date(), "yyyy-MM-dd") });
      setDialogOpen(true);
    },
    []
  );

  const openEditEvent = useCallback(
    (event: CalendarEvent) => {
      setEditingEvent(event);
      setFormData({
        title: event.title,
        clientId: event.clientId,
        type: event.type,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
        status: event.status,
      });
      setDialogOpen(true);
    },
    []
  );

  const handleSave = useCallback(() => {
    if (!formData.title.trim() || !formData.date) return;

    if (editingEvent) {
      updateEvent(editingEvent.id, {
        title: formData.title,
        clientId: formData.clientId,
        type: formData.type,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        status: formData.status,
      });
    } else {
      addEvent({
        title: formData.title,
        clientId: formData.clientId,
        type: formData.type,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        description: formData.description,
        status: formData.status,
      });
    }

    setDialogOpen(false);
    setEditingEvent(null);
    setFormData(EMPTY_FORM);
  }, [formData, editingEvent, addEvent, updateEvent]);

  const handleDelete = useCallback(() => {
    if (editingEvent) {
      deleteEvent(editingEvent.id);
      setDialogOpen(false);
      setEditingEvent(null);
      setFormData(EMPTY_FORM);
    }
  }, [editingEvent, deleteEvent]);

  const handleDayClick = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      if (viewMode === "mensal") {
        setSelectedDate(dateStr);
        setCurrentDate(date);
      } else {
        setSelectedDate(dateStr);
      }
    },
    [viewMode]
  );

  const headerTitle = useMemo(() => {
    if (viewMode === "mensal") {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    if (viewMode === "semanal") {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 });
      const end = endOfWeek(currentDate, { weekStartsOn: 1 });
      return `${format(start, "dd MMM", { locale: ptBR })} - ${format(end, "dd MMM, yyyy", { locale: ptBR })}`;
    }
    return format(currentDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  }, [currentDate, viewMode]);

  function getEventsForDayInMonth(day: Date): CalendarEvent[] {
    return calendarEvents.filter((e) => e.date === format(day, "yyyy-MM-dd"));
  }

  function getEventTopOffset(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h - 8) * 60 + m) * (64 / 60);
  }

  function getEventHeight(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(((eh - sh) * 60 + (em - sm)) * (64 / 60), 24);
  }

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="size-5 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" onClick={() => (viewMode === "diaria" ? navigateDay(-1) : navigatePrev())}>
              <ChevronLeft className="size-4" />
            </Button>
            <h1 className="min-w-[200px] text-center text-lg font-semibold capitalize">
              {headerTitle}
            </h1>
            <Button variant="ghost" size="icon-sm" onClick={() => (viewMode === "diaria" ? navigateDay(1) : navigateNext())}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-muted p-[3px]">
            {(["mensal", "semanal", "diaria"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setViewMode(mode);
                  if (mode !== "mensal") {
                    setSelectedDate(format(currentDate, "yyyy-MM-dd"));
                  }
                }}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition-all ${
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {mode === "mensal" ? "Mensal" : mode === "semanal" ? "Semanal" : "Diária"}
              </button>
            ))}
          </div>
          <Button size="sm" onClick={() => openNewEvent()}>
            <Plus className="size-4" />
            Novo Compromisso
          </Button>
        </div>
      </div>

      <div className="mt-4 flex-1 overflow-hidden">
        {viewMode === "mensal" && (
          <MonthlyView
            days={monthDays}
            currentDate={currentDate}
            calendarEvents={calendarEvents}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            onEventClick={openEditEvent}
            getClientName={getClientName}
          />
        )}
        {viewMode === "semanal" && (
          <WeeklyView
            days={weekDays}
            timeSlots={timeSlots}
            events={eventsForCurrentWeek}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
            onEventClick={openEditEvent}
            getClientName={getClientName}
            currentDate={currentDate}
          />
        )}
        {viewMode === "diaria" && (
          <DailyView
            currentDate={currentDate}
            timeSlots={timeSlots}
            events={getEventsByDate(format(currentDate, "yyyy-MM-dd"))}
            onEventClick={openEditEvent}
            getClientName={getClientName}
            onNewEvent={() => openNewEvent(format(currentDate, "yyyy-MM-dd"))}
          />
        )}
      </div>

      {selectedDate && viewMode === "mensal" && (
        <DaySidePanel
          date={selectedDate}
          events={dayEvents}
          getClientName={getClientName}
          onEventClick={openEditEvent}
          onClose={() => setSelectedDate(null)}
          onNewEvent={() => openNewEvent(selectedDate)}
        />
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        editingEvent={editingEvent}
        clients={clients}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
    </CRMLayout>
  );
}

function MonthlyView({
  days,
  currentDate,
  calendarEvents,
  selectedDate,
  onDayClick,
  onEventClick,
  getClientName,
}: {
  days: Date[];
  currentDate: Date;
  calendarEvents: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  getClientName: (id: string) => string;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border">
      <div className="grid grid-cols-7 border-b">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7">
        {days.map((day, idx) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEvents = calendarEvents.filter((e) => e.date === dateStr);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isDayToday = isToday(day);
          const isSelected = selectedDate === dateStr;

          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`relative min-h-[100px] cursor-pointer border-b border-r p-1.5 transition-colors hover:bg-muted/50 ${
                !isCurrentMonth ? "opacity-40" : ""
              } ${isSelected ? "bg-muted/70" : ""}`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                  isDayToday
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : ""
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((event) => {
                  const config = EVENT_TYPE_CONFIG[event.type];
                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                      className={`flex cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight transition-colors hover:brightness-90 ${config.bg} ${config.text}`}
                    >
                      <div className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
                      <span className="truncate">{event.startTime} {event.title}</span>
                    </div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[10px] text-muted-foreground">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WeeklyView({
  days,
  timeSlots,
  events,
  selectedDate,
  onDayClick,
  onEventClick,
  getClientName,
  currentDate,
}: {
  days: Date[];
  timeSlots: string[];
  events: CalendarEvent[];
  selectedDate: string | null;
  onDayClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  getClientName: (id: string) => string;
  currentDate: Date;
}) {
  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayStr = format(now, "yyyy-MM-dd");
  const showNowLine = days.some((d) => format(d, "yyyy-MM-dd") === todayStr);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b">
        <div />
        {days.map((day, idx) => {
          const isDayToday = isToday(day);
          return (
            <div
              key={idx}
              onClick={() => onDayClick(day)}
              className={`cursor-pointer border-l p-2 text-center transition-colors hover:bg-muted/50 ${
                isDayToday ? "bg-primary/5" : ""
              }`}
            >
              <div className="text-xs text-muted-foreground">{format(day, "EEE", { locale: ptBR })}</div>
              <div
                className={`mx-auto mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium ${
                  isDayToday
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>
      <div className="relative flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_repeat(7,1fr)]">
          {timeSlots.map((slot, slotIdx) => (
            <div key={slot} className="contents">
              <div className="border-b border-r px-2 py-1 text-right text-[10px] text-muted-foreground">
                {slot}
              </div>
              {days.map((day, dayIdx) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const hour = parseInt(slot.split(":")[0]);
                const slotEvents = events.filter((e) => {
                  const eventHour = parseInt(e.startTime.split(":")[0]);
                  return e.date === dateStr && eventHour === hour;
                });

                return (
                  <div
                    key={dayIdx}
                    className="relative border-b border-l"
                    style={{ height: 64 }}
                  >
                    {slotEvents.map((event) => {
                      const config = EVENT_TYPE_CONFIG[event.type];
                      const top = getEventTopOffset(event.startTime);
                      const height = getEventHeight(event.startTime, event.endTime);
                      const [sh, sm] = event.startTime.split(":").map(Number);
                      const topOffset = ((hour - 8) * 60 + sm) * (64 / 60);

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`absolute left-0.5 right-0.5 z-10 cursor-pointer overflow-hidden rounded border-l-2 px-1 py-0.5 text-[10px] leading-tight transition-shadow hover:shadow-md ${config.bg} ${config.color} ${config.text}`}
                          style={{ top: topOffset, height: Math.max(height, 28) }}
                        >
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="truncate opacity-75">{event.startTime}-{event.endTime}</div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {showNowLine && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-20"
            style={{
              top: ((currentHour - 8) * 60 + currentMinute) * (64 / 60),
            }}
          >
            <div className="flex items-center">
              <div className="h-2.5 w-2.5 -ml-1 rounded-full bg-red-500" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getEventTopOffset(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h - 8) * 60 + m) * (64 / 60);
  }

  function getEventHeight(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(((eh - sh) * 60 + (em - sm)) * (64 / 60), 24);
  }
}

function DailyView({
  currentDate,
  timeSlots,
  events,
  onEventClick,
  getClientName,
  onNewEvent,
}: {
  currentDate: Date;
  timeSlots: string[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  getClientName: (id: string) => string;
  onNewEvent: () => void;
}) {
  const now = useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const isToday = format(now, "yyyy-MM-dd") === format(currentDate, "yyyy-MM-dd");

  function getEventTopOffset(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return ((h - 8) * 60 + m) * (64 / 60);
  }

  function getEventHeight(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return Math.max(((eh - sh) * 60 + (em - sm)) * (64 / 60), 24);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="text-sm font-medium capitalize">
            {format(currentDate, "EEEE", { locale: ptBR })}
          </div>
          <div className="text-xs text-muted-foreground">
            {events.length} compromisso{events.length !== 1 ? "s" : ""}
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onNewEvent}>
          <Plus className="size-3.5" />
          Adicionar
        </Button>
      </div>
      <div className="relative flex-1 overflow-y-auto">
        <div className="grid grid-cols-[60px_1fr]">
          {timeSlots.map((slot) => {
            const hour = parseInt(slot.split(":")[0]);
            const slotEvents = events.filter(
              (e) => parseInt(e.startTime.split(":")[0]) === hour
            );

            return (
              <div key={slot} className="contents">
                <div className="border-b px-2 py-1 text-right text-[10px] text-muted-foreground">
                  {slot}
                </div>
                <div className="relative border-b border-l" style={{ minHeight: 64 }}>
                  {slotEvents.map((event) => {
                    const config = EVENT_TYPE_CONFIG[event.type];
                    const clientName = getClientName(event.clientId);
                    const [sm] = event.startTime.split(":").map(Number);
                    const topOffset = ((hour - 8) * 60 + sm) * (64 / 60);
                    const height = getEventHeight(event.startTime, event.endTime);

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        className={`absolute left-2 right-2 z-10 cursor-pointer overflow-hidden rounded-lg border-l-4 px-3 py-2 transition-shadow hover:shadow-md ${config.bg} ${config.color}`}
                        style={{ top: topOffset, height: Math.max(height, 48) }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-medium ${config.text}`}>
                              {event.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {event.startTime} - {event.endTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {clientName}
                              </span>
                            </div>
                          </div>
                          <Badge variant={STATUS_CONFIG[event.status]?.variant || "default"} className="shrink-0">
                            {STATUS_CONFIG[event.status]?.label || event.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {isToday && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-20"
            style={{
              top: ((currentHour - 8) * 60 + currentMinute) * (64 / 60),
            }}
          >
            <div className="flex items-center">
              <div className="h-2.5 w-2.5 -ml-1 rounded-full bg-red-500" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DaySidePanel({
  date,
  events,
  getClientName,
  onEventClick,
  onClose,
  onNewEvent,
}: {
  date: string;
  events: CalendarEvent[];
  getClientName: (id: string) => string;
  onEventClick: (event: CalendarEvent) => void;
  onClose: () => void;
  onNewEvent: () => void;
}) {
  const parsedDate = parseISO(date);

  return (
    <div className="mt-4 rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-semibold capitalize">
            {format(parsedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </h3>
          <p className="text-xs text-muted-foreground">
            {events.length} compromisso{events.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" variant="outline" onClick={onNewEvent}>
            <Plus className="size-3.5" />
            Adicionar
          </Button>
          <Button size="icon-sm" variant="ghost" onClick={onClose}>
            <XCircle className="size-4" />
          </Button>
        </div>
      </div>
      {events.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum compromisso neste dia.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {events
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((event) => {
              const config = EVENT_TYPE_CONFIG[event.type];
              const clientName = getClientName(event.clientId);

              return (
                <div
                  key={event.id}
                  onClick={() => onEventClick(event)}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border-l-4 p-3 transition-colors hover:bg-muted/50 ${config.color} ${config.bg}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${config.text}`}>
                        {event.title}
                      </span>
                      <Badge variant={STATUS_CONFIG[event.status]?.variant || "default"} className="shrink-0">
                        {STATUS_CONFIG[event.status]?.label || event.status}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {event.startTime} - {event.endTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {clientName}
                      </span>
                    </div>
                    {event.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}

function EventDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingEvent,
  clients,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: EventFormData;
  setFormData: React.Dispatch<React.SetStateAction<EventFormData>>;
  editingEvent: CalendarEvent | null;
  clients: Client[];
  onSave: () => void;
  onDelete: () => void;
}) {
  const eventTypes: { value: EventType; label: string }[] = [
    { value: "followup", label: "Follow-up" },
    { value: "reuniao", label: "Reunião" },
    { value: "ligacao", label: "Ligação" },
    { value: "compromisso", label: "Compromisso" },
  ];

  const statuses: { value: "agendado" | "concluido" | "cancelado"; label: string }[] = [
    { value: "agendado", label: "Agendado" },
    { value: "concluido", label: "Concluído" },
    { value: "cancelado", label: "Cancelado" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? "Editar Compromisso" : "Novo Compromisso"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Título</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Ex: Reunião com cliente..."
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Cliente</label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData((prev) => ({ ...prev, clientId: e.target.value }))}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            >
              <option value="">Selecionar cliente...</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name} - {client.company}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, type: e.target.value as EventType }))
                }
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as "agendado" | "concluido" | "cancelado",
                  }))
                }
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {statuses.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Data</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Início</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                }
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fim</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                }
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              placeholder="Detalhes do compromisso..."
              className="rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50 resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            {editingEvent ? (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="size-3.5" />
                Excluir
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button size="sm" onClick={onSave}>
                <CheckCircle className="size-3.5" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
