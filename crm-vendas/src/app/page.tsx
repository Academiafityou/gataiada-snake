"use client";

import { useSyncExternalStore } from "react";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Users,
  Phone,
  AlertTriangle,
  TrendingUp,
  Flame,
  Snowflake,
  Thermometer,
  XCircle,
  CalendarClock,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
  Handshake,
  Activity,
  CalendarDays,
  FileText,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CRMLayout } from "@/components/layout/crm-layout";
import type { NegotiationStatus, Temperature, Client } from "@/lib/types";

const STATUS_LABELS: Record<NegotiationStatus, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_negociacao: "Em Negociação",
  proposta_enviada: "Proposta Enviada",
  follow_up: "Follow-up",
  fechado_ganho: "Fechado (Ganho)",
  perdido: "Perdido",
};

const TEMP_COLORS: Record<Temperature, string> = {
  quente: "#ef4444",
  morno: "#f59e0b",
  frio: "#3b82f6",
  perdido: "#6b7280",
};

const STATUS_COLORS: Record<NegotiationStatus, string> = {
  novo_lead: "#94a3b8",
  primeiro_contato: "#60a5fa",
  em_negociacao: "#a78bfa",
  proposta_enviada: "#f59e0b",
  follow_up: "#fb923c",
  fechado_ganho: "#22c55e",
  perdido: "#ef4444",
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  reuniao: "Reunião",
  presencial: "Presencial",
};

const MONTHS_DATA = [
  { name: "Jan", vendas: 4 },
  { name: "Fev", vendas: 6 },
  { name: "Mar", vendas: 3 },
  { name: "Abr", vendas: 8 },
  { name: "Mai", vendas: 5 },
  { name: "Jun", vendas: 7 },
];

function getPriorityColor(client: Client): string {
  if (client.temperature === "quente") return "bg-red-500";
  if (client.temperature === "morno") return "bg-amber-500";
  if (client.temperature === "frio") return "bg-blue-500";
  return "bg-gray-400";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function DashboardPage() {
  const mounted = useHydrated();

  const currentUser = useCRMStore((s) => s.currentUser);
  const clients = useCRMStore((s) => s.clients);
  const conversations = useCRMStore((s) => s.conversations);
  const getClientsByTemperature = useCRMStore((s) => s.getClientsByTemperature);
  const getOverdueFollowups = useCRMStore((s) => s.getOverdueFollowups);
  const getTodayContacts = useCRMStore((s) => s.getTodayContacts);
  const getUpcomingContacts = useCRMStore((s) => s.getUpcomingContacts);
  const conversionRate = useCRMStore((s) => s.conversionRate);
  const closedSales = useCRMStore((s) => s.closedSales);
  const totalPipelineValue = useCRMStore((s) => s.totalPipelineValue);
  const getClientsByStatus = useCRMStore((s) => s.getClientsByStatus);


  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const todayStr = format(today, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const totalClients = clients.length;
  const todayContacts = getTodayContacts();
  const overdueFollowups = getOverdueFollowups();
  const upcomingContacts = getUpcomingContacts();
  const rate = conversionRate();
  const closed = closedSales();
  const pipeline = totalPipelineValue();

  const quenteClients = getClientsByTemperature("quente");
  const mornoClients = getClientsByTemperature("morno");
  const frioClients = getClientsByTemperature("frio");
  const perdidoClients = getClientsByTemperature("perdido");

  const tempTotal = quenteClients.length + mornoClients.length + frioClients.length + perdidoClients.length;

  const activeNegotiation = clients.filter(
    (c) => c.status !== "fechado_ganho" && c.status !== "perdido"
  ).length;

  const recentConversations = [...conversations]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const pipelineStages: NegotiationStatus[] = [
    "novo_lead",
    "primeiro_contato",
    "em_negociacao",
    "proposta_enviada",
    "follow_up",
  ];
  const pipelineByStatus = pipelineStages.map((status) => ({
    status,
    count: getClientsByStatus(status).length,
    value: getClientsByStatus(status).reduce((sum, c) => sum + c.estimatedValue * (c.probability / 100), 0),
  }));

  const maxPipelineValue = Math.max(...pipelineByStatus.map((s) => s.value), 1);

  return (
    <CRMLayout>
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bem-vindo de volta, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground capitalize">{todayStr}</p>
        </div>
        <div className="flex items-center gap-2">
          {overdueFollowups.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="size-3" />
              {overdueFollowups.length} follow-up{overdueFollowups.length > 1 ? "s" : ""} atrasado{overdueFollowups.length > 1 ? "s" : ""}
            </Badge>
          )}
          {todayContacts.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Phone className="size-3" />
              {todayContacts.length} contato{todayContacts.length > 1 ? "s" : ""} hoje
            </Badge>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Users className="size-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-bold tabular-nums">{totalClients}</p>
                <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
                  <ArrowUpRight className="size-3" />
                  12%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              todayContacts.length > 0 ? "bg-blue-500/10" : "bg-muted"
            )}>
              <Phone className={cn("size-5", todayContacts.length > 0 ? "text-blue-600" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Contatos de Hoje</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                todayContacts.length > 0 && "text-blue-600"
              )}>
                {todayContacts.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl",
              overdueFollowups.length > 0 ? "bg-destructive/10" : "bg-muted"
            )}>
              <AlertTriangle className={cn("size-5", overdueFollowups.length > 0 ? "text-destructive" : "text-muted-foreground")} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Follow-ups Atrasados</p>
              <p className={cn(
                "text-2xl font-bold tabular-nums",
                overdueFollowups.length > 0 && "text-destructive"
              )}>
                {overdueFollowups.length}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="size-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              <p className="text-2xl font-bold tabular-nums">{rate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Temperature + Pipeline */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Temperature Card */}
        <Card>
          <CardHeader>
            <CardTitle>Leads por Temperatura</CardTitle>
            <CardDescription>Distribuição dos clientes por temperatura</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Quente", count: quenteClients.length, icon: Flame, color: "bg-red-500" },
              { label: "Morno", count: mornoClients.length, icon: Thermometer, color: "bg-amber-500" },
              { label: "Frio", count: frioClients.length, icon: Snowflake, color: "bg-blue-500" },
              { label: "Perdido", count: perdidoClients.length, icon: XCircle, color: "bg-gray-400" },
            ].map((item) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <item.icon className="size-3.5" style={{ color: TEMP_COLORS[item.label.toLowerCase() as Temperature] }} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <span className="text-sm tabular-nums text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", item.color)}
                    style={{ width: `${tempTotal > 0 ? (item.count / tempTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pipeline Card */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>Valor ponderado por etapa do funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums">{formatCurrency(pipeline)}</span>
              <span className="text-xs text-muted-foreground">em pipeline ativo</span>
            </div>
            <Separator />
            <div className="space-y-3">
              {pipelineByStatus.map((item) => (
                <div key={item.status} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: STATUS_COLORS[item.status] }}
                    />
                      <span className="text-sm">{STATUS_LABELS[item.status]}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs tabular-nums text-muted-foreground">{item.count} clientes</span>
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(item.value)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / maxPipelineValue) * 100}%`,
                        backgroundColor: STATUS_COLORS[item.status],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            Contatos de Hoje
          </CardTitle>
          <CardDescription>
            {todayContacts.length > 0
              ? `${todayContacts.length} contato${todayContacts.length > 1 ? "s" : ""} agendado${todayContacts.length > 1 ? "s" : ""} para hoje`
              : "Nenhum contato agendado para hoje"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {todayContacts.length > 0 ? (
            <div className="space-y-3">
              {todayContacts.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className={cn("size-2.5 shrink-0 rounded-full", getPriorityColor(client))} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{client.name}</p>
                      <Badge variant="outline" className="shrink-0 text-[10px]">
                        {STATUS_LABELS[client.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{client.company}</p>
                  </div>
                  <div className="hidden flex-col items-end gap-0.5 text-right sm:flex">
                    <p className="text-xs text-muted-foreground">
                      {client.lastContactDate
                        ? `Último contato: ${formatDistanceToNow(new Date(client.lastContactDate), { locale: ptBR, addSuffix: true })}`
                        : "Primeiro contato"}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground">{client.productOfInterest}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {formatCurrency(client.estimatedValue)}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                <CalendarDays className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhum contato para hoje</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Aproveite para revisar seus leads e follow-ups pendentes
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming + Recent Activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Upcoming 7 Days */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="size-4 text-primary" />
              Próximos 7 Dias
            </CardTitle>
            <CardDescription>{upcomingContacts.length} contato(s) programado(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingContacts.length > 0 ? (
              <div className="relative ml-3 space-y-0">
                <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
                {upcomingContacts
                  .sort((a, b) => new Date(a.nextContactDate).getTime() - new Date(b.nextContactDate).getTime())
                  .map((client) => (
                    <div key={client.id} className="relative flex gap-4 py-3 first:pt-0">
                      <div className={cn(
                        "absolute -left-3 top-3.5 size-2.5 rounded-full border-2 border-background",
                        client.temperature === "quente" && "bg-red-500",
                        client.temperature === "morno" && "bg-amber-500",
                        client.temperature === "frio" && "bg-blue-500",
                        client.temperature === "perdido" && "bg-gray-400",
                      )} />
                      <div className="flex-1 min-w-0 pl-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium">{client.name}</p>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {format(new Date(client.nextContactDate), "dd/MM (EEE)", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {client.company} &middot; {STATUS_LABELS[client.status]}
                        </p>
                      </div>
                    </div>
                  ))
                }
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                  <CalendarClock className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum contato nos próximos 7 dias</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-primary" />
              Atividade Recente
            </CardTitle>
            <CardDescription>Últimas 5 interações registradas</CardDescription>
          </CardHeader>
          <CardContent>
            {recentConversations.length > 0 ? (
              <div className="space-y-4">
                {recentConversations.map((conv) => {
                  const client = clients.find((c) => c.id === conv.clientId);
                  return (
                    <div key={conv.id} className="flex gap-3">
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <FileText className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{client?.name ?? "Cliente"}</p>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {CHANNEL_LABELS[conv.channel] ?? conv.channel}
                          </Badge>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{conv.summary}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(conv.date), { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                  <Activity className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Quick Stats + Chart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas Fechadas</p>
                <p className="text-2xl font-bold tabular-nums">{closed}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <DollarSign className="size-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Valor Total Pipeline</p>
                <p className="text-lg font-bold tabular-nums">{formatCurrency(pipeline)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                <Handshake className="size-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Em Negociação</p>
                <p className="text-2xl font-bold tabular-nums">{activeNegotiation}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales Evolution Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              Evolução de Vendas
            </CardTitle>
            <CardDescription>Últimos 6 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MONTHS_DATA} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.5 }}
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                    formatter={(value) => [`${value} vendas`, "Fechamentos"]}
                  />
                  <Bar dataKey="vendas" radius={[6, 6, 0, 0]}>
                    {MONTHS_DATA.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === MONTHS_DATA.length - 1 ? "var(--primary)" : "var(--muted)"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </CRMLayout>
  );
}
