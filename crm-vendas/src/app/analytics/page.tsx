"use client";

import { useState, useEffect, useMemo } from "react";
import { useCRMStore } from "@/lib/store";
import type { NegotiationStatus, Temperature, LeadSource, Client } from "@/lib/types";
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Trophy,
  Lightbulb,
  DollarSign,
  Target,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { CRMLayout } from "@/components/layout/crm-layout";

const STATUS_LABELS: Record<NegotiationStatus, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_negociacao: "Em Negociacao",
  proposta_enviada: "Proposta Enviada",
  follow_up: "Follow-up",
  fechado_ganho: "Fechado Ganho",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<NegotiationStatus, string> = {
  novo_lead: "#3b82f6",
  primeiro_contato: "#6366f1",
  em_negociacao: "#eab308",
  proposta_enviada: "#a855f7",
  follow_up: "#f97316",
  fechado_ganho: "#22c55e",
  perdido: "#ef4444",
};

const TEMP_COLORS: Record<Temperature, string> = {
  quente: "#ef4444",
  morno: "#f59e0b",
  frio: "#3b82f6",
  perdido: "#6b7280",
};

const TEMP_LABELS: Record<Temperature, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  perdido: "Perdido",
};

const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  indicacao: "Indicacao",
  site: "Site",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  google_ads: "Google Ads",
  evento: "Evento",
  ligacao_fria: "Ligacao Fria",
  outro: "Outro",
};

const LEAD_SOURCE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#e11d48",
  "#0ea5e9",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const DATE_RANGES = [
  { label: "Ultimos 7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "90 dias", days: 90 },
  { label: "12 meses", days: 365 },
] as const;

const FUNNEL_STAGES: NegotiationStatus[] = [
  "novo_lead",
  "primeiro_contato",
  "em_negociacao",
  "proposta_enviada",
  "follow_up",
  "fechado_ganho",
];

const FUNNEL_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#eab308",
  "#a855f7",
  "#f97316",
  "#22c55e",
];

const GRADIENT_ID = "barGradient";

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function CustomTooltipBar({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm text-muted-foreground">
          {entry.name}: <span className="font-medium text-foreground">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function CustomTooltipPie({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  return (
    <div className="rounded-lg border border-border bg-background p-3 shadow-md">
      <p className="text-sm font-medium">{data.name}</p>
      <p className="text-sm text-muted-foreground">
        Quantidade: <span className="font-medium text-foreground">{data.value}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Percentual: <span className="font-medium text-foreground">{data.payload.percent}%</span>
      </p>
    </div>
  );
}

export default function AnalyticsPage() {
  const clients = useCRMStore((s) => s.clients);
  const conversations = useCRMStore((s) => s.conversations);
  const tasks = useCRMStore((s) => s.tasks);

  const [mounted, setMounted] = useState(false);
  const [dateRange, setDateRange] = useState<30 | 7 | 90 | 365>(30);

  useEffect(() => setMounted(true), []);

  const filteredClients = useMemo(() => {
    const cutoff = subDays(new Date(), dateRange);
    return clients.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= cutoff;
    });
  }, [clients, dateRange]);

  const allClientsInRange = useMemo(() => {
    return clients.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= subDays(new Date(), dateRange);
    });
  }, [clients, dateRange]);

  const salesByMonth = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const count = clients.filter((c) => {
        if (c.status !== "fechado_ganho") return false;
        const created = new Date(c.createdAt);
        return isWithinInterval(created, { start: monthStart, end: monthEnd });
      }).length;
      return {
        name: format(month, "MMM", { locale: ptBR }),
        vendas: count,
      };
    });
  }, [clients]);

  const leadsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c) => {
      counts[c.leadSource] = (counts[c.leadSource] || 0) + 1;
    });
    const total = filteredClients.length || 1;
    return Object.entries(counts)
      .map(([source, count]) => ({
        name: LEAD_SOURCE_LABELS[source as LeadSource] || source,
        value: count,
        percent: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredClients]);

  const pipelineByStatus = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    return (Object.keys(STATUS_LABELS) as NegotiationStatus[]).map((status) => ({
      name: STATUS_LABELS[status],
      value: counts[status] || 0,
      fill: STATUS_COLORS[status],
    }));
  }, [filteredClients]);

  const funnelData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c) => {
      counts[c.status] = (counts[c.status] || 0) + 1;
    });
    const firstCount = counts[FUNNEL_STAGES[0]] || 1;
    return FUNNEL_STAGES.map((stage, i) => {
      const count = counts[stage] || 0;
      return {
        name: STATUS_LABELS[stage],
        value: count,
        percent: Math.round((count / firstCount) * 100),
        dropoff: i > 0 ? (counts[FUNNEL_STAGES[i - 1]] || 0) - count : 0,
        fill: FUNNEL_COLORS[i],
      };
    });
  }, [filteredClients]);

  const conversionOverTime = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now,
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthClients = clients.filter((c) => {
        const created = new Date(c.createdAt);
        return isWithinInterval(created, { start: monthStart, end: monthEnd });
      });
      const closed = monthClients.filter((c) => c.status === "fechado_ganho").length;
      const rate = monthClients.length > 0 ? Math.round((closed / monthClients.length) * 100) : 0;
      return {
        name: format(month, "MMM", { locale: ptBR }),
        taxa: rate,
      };
    });
  }, [clients]);

  const avgSaleValue = useMemo(() => {
    const closed = filteredClients.filter((c) => c.status === "fechado_ganho");
    if (closed.length === 0) return 0;
    return closed.reduce((sum, c) => sum + c.estimatedValue, 0) / closed.length;
  }, [filteredClients]);

  const avgDaysToSale = useMemo(() => {
    const closed = clients.filter((c) => c.status === "fechado_ganho" && c.lastContactDate);
    if (closed.length === 0) return 0;
    const totalDays = closed.reduce((sum, c) => {
      const created = new Date(c.createdAt);
      const lastContact = new Date(c.lastContactDate);
      const days = Math.abs(lastContact.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
      return sum + days;
    }, 0);
    return Math.round(totalDays / closed.length);
  }, [clients]);

  const salesByProduct = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c) => {
      if (c.productOfInterest) {
        counts[c.productOfInterest] = (counts[c.productOfInterest] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([product, count]) => ({ name: product, vendas: count }))
      .sort((a, b) => b.vendas - a.vendas);
  }, [filteredClients]);

  const temperatureDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredClients.forEach((c) => {
      counts[c.temperature] = (counts[c.temperature] || 0) + 1;
    });
    const total = filteredClients.length || 1;
    return (Object.keys(TEMP_LABELS) as Temperature[]).map((temp) => ({
      name: TEMP_LABELS[temp],
      value: counts[temp] || 0,
      fill: TEMP_COLORS[temp],
      percent: Math.round(((counts[temp] || 0) / total) * 100),
    }));
  }, [filteredClients]);

  const topClients = useMemo(() => {
    return clients
      .filter((c) => c.status === "fechado_ganho")
      .sort((a, b) => b.estimatedValue - a.estimatedValue)
      .slice(0, 5);
  }, [clients]);

  const insights = useMemo(() => {
    const coolingLeads = clients.filter(
      (c) =>
        c.temperature === "frio" &&
        c.status !== "fechado_ganho" &&
        c.status !== "perdido"
    ).length;

    const overdueFollowups = tasks.filter(
      (t) =>
        t.status !== "concluida" &&
        t.status !== "cancelada" &&
        new Date(t.dueDate) < new Date()
    ).length;

    const thisMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(new Date(), 1));
    const thisMonthClients = clients.filter(
      (c) => new Date(c.createdAt) >= thisMonth
    );
    const lastMonthClients = clients.filter((c) => {
      const created = new Date(c.createdAt);
      return created >= lastMonth && created < thisMonth;
    });
    const thisMonthClosed = thisMonthClients.filter((c) => c.status === "fechado_ganho").length;
    const lastMonthClosed = lastMonthClients.filter((c) => c.status === "fechado_ganho").length;
    const thisMonthRate = thisMonthClients.length > 0 ? Math.round((thisMonthClosed / thisMonthClients.length) * 100) : 0;
    const lastMonthRate = lastMonthClients.length > 0 ? Math.round((lastMonthClosed / lastMonthClients.length) * 100) : 0;
    const rateDelta = thisMonthRate - lastMonthRate;

    const productCounts: Record<string, number> = {};
    clients.forEach((c) => {
      if (c.status === "fechado_ganho" && c.productOfInterest) {
        productCounts[c.productOfInterest] = (productCounts[c.productOfInterest] || 0) + 1;
      }
    });
    const topProduct = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];

    return [
      {
        icon: TrendingDown,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
        text: `${coolingLeads} leads esfriando esta semana`,
      },
      {
        icon: Clock,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
        text: `${overdueFollowups} follow-ups atrasados`,
      },
      {
        icon: TrendingUp,
        color: rateDelta >= 0 ? "text-green-500" : "text-red-500",
        bgColor: rateDelta >= 0 ? "bg-green-500/10" : "bg-red-500/10",
        text: `Taxa de conversao ${rateDelta >= 0 ? "subiu" : "caiu"} ${Math.abs(rateDelta)}% este mes`,
      },
      {
        icon: Trophy,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        text: topProduct
          ? `O produto mais vendido e ${topProduct[0]} (${topProduct[1]} vendas)`
          : "Sem vendas fechadas ainda",
      },
    ];
  }, [clients, tasks]);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analises</h1>
          <p className="text-sm text-muted-foreground">
            Insights e metricas de vendas
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-muted p-1">
          {DATE_RANGES.map((range) => (
            <button
              key={range.days}
              onClick={() => setDateRange(range.days as typeof dateRange)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                dateRange === range.days
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Mes</CardTitle>
            <CardDescription>Vendas fechadas nos ultimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByMonth}>
                  <defs>
                    <linearGradient id={GRADIENT_ID} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar
                    dataKey="vendas"
                    name="Vendas"
                    fill={`url(#${GRADIENT_ID})`}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>Distribuicao de leads por canal de aquisicao</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadsBySource}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${percent}%)`}
                    labelLine={false}
                  >
                    {leadsBySource.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={LEAD_SOURCE_COLORS[index % LEAD_SOURCE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline por Status</CardTitle>
            <CardDescription>Quantidade de clientes em cada etapa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineByStatus} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar dataKey="value" name="Clientes" radius={[0, 6, 6, 0]}>
                    {pipelineByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversao do Funil</CardTitle>
            <CardDescription>Drop-off entre etapas do funil de vendas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funnelData.map((stage, i) => (
                <div key={stage.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stage.name}</span>
                    <div className="flex items-center gap-3 text-muted-foreground">
                      {stage.dropoff > 0 && i > 0 && (
                        <span className="text-xs text-red-500">
                          -{stage.dropoff}
                        </span>
                      )}
                      <span className="font-medium text-foreground">{stage.value}</span>
                      <span className="w-12 text-right text-xs">{stage.percent}%</span>
                    </div>
                  </div>
                  <div className="relative h-6 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
                      style={{
                        width: `${stage.percent}%`,
                        backgroundColor: stage.fill,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolucao da Taxa de Conversao</CardTitle>
            <CardDescription>Taxa de conversao mensal nos ultimos 12 meses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={conversionOverTime}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    unit="%"
                  />
                  <Tooltip
                    formatter={(value) => [`${value}%`, "Taxa de Conversao"]}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--background))",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="taxa"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "hsl(var(--background))" }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendas por Produto</CardTitle>
            <CardDescription>Produtos mais vendidos no periodo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByProduct}>
                  <defs>
                    <linearGradient id="productGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltipBar />} />
                  <Bar
                    dataKey="vendas"
                    name="Vendas"
                    fill="url(#productGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuicao de Temperatura</CardTitle>
            <CardDescription>Segmentacao dos clientes por temperatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={temperatureDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${percent}%)`}
                    labelLine={false}
                  >
                    {temperatureDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipPie />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value: string) => (
                      <span className="text-xs text-muted-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="size-4 text-yellow-500" />
              Insights Semanais
            </CardTitle>
            <CardDescription>Analises automaticas dos seus dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${insight.bgColor}`}>
                    <insight.icon className={`size-4 ${insight.color}`} />
                  </div>
                  <p className="text-sm">{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="size-4 text-yellow-500" />
              Ranking dos Melhores Clientes
            </CardTitle>
            <CardDescription>Top 5 clientes por valor estimado (fechados)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-3 text-left font-medium text-muted-foreground">#</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Cliente</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Empresa</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Produto</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Valor Estimado</th>
                    <th className="pb-3 text-left font-medium text-muted-foreground">Criado em</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((client, i) => (
                    <tr
                      key={client.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-3">
                        <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                          i === 0
                            ? "bg-yellow-500/20 text-yellow-600"
                            : i === 1
                              ? "bg-gray-300/30 text-gray-500"
                              : i === 2
                                ? "bg-orange-500/20 text-orange-600"
                                : "bg-muted text-muted-foreground"
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="py-3 font-medium">{client.name}</td>
                      <td className="py-3 text-muted-foreground">{client.company}</td>
                      <td className="py-3 text-muted-foreground">{client.productOfInterest}</td>
                      <td className="py-3 text-right font-medium text-green-600">
                        {formatCurrency(client.estimatedValue)}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                    </tr>
                  ))}
                  {topClients.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        Nenhuma venda fechada encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="size-4 text-green-500" />
              Valor Medio de Vendas
            </CardTitle>
            <CardDescription>Valor estimado medio dos negocios fechados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <span className="text-4xl font-bold tracking-tight text-green-600">
                {formatCurrency(avgSaleValue)}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                {filteredClients.filter((c) => c.status === "fechado_ganho").length} vendas fechadas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4 text-blue-500" />
              Tempo Medio ate Venda
            </CardTitle>
            <CardDescription>Dias entre criacao do lead e ultimo contato</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <span className="text-4xl font-bold tracking-tight text-blue-600">
                {avgDaysToSale}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                dias em media para fechar
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="size-4 text-purple-500" />
              Follow-ups Realizados
            </CardTitle>
            <CardDescription>Total de interacoes registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center py-6">
              <span className="text-4xl font-bold tracking-tight text-purple-600">
                {conversations.length}
              </span>
              <p className="mt-2 text-sm text-muted-foreground">
                conversas registradas no sistema
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="size-4 text-emerald-500" />
              Resumo do Pipeline
            </CardTitle>
            <CardDescription>Visao geral do funil atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{clients.length}</p>
                <p className="text-xs text-muted-foreground">Total de Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {clients.filter((c) => c.status === "fechado_ganho").length}
                </p>
                <p className="text-xs text-muted-foreground">Fechados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(clients.reduce((sum, c) => sum + c.estimatedValue * (c.probability / 100), 0))}
                </p>
                <p className="text-xs text-muted-foreground">Valor Ponderado</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">
                  {clients.filter((c) => c.status === "fechado_ganho").length > 0
                    ? Math.round(
                        (clients.filter((c) => c.status === "fechado_ganho").length /
                          clients.length) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-xs text-muted-foreground">Taxa Geral</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </CRMLayout>
  );
}
