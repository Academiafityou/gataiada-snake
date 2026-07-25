"use client";

import { useState, useMemo, useSyncExternalStore, use } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  NegotiationStatus,
  Temperature,
  ContactChannel,
  TaskPriority,
  TaskStatus,
} from "@/lib/types";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Phone,
  Mail,
  MessageCircle,
  Building2,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  Clock,
  User,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Brain,
  Target,
  MessageSquare,
  Shield,
  Zap,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Plus,
  CalendarClock,
  Thermometer,
  FlaskConical,
  Lightbulb,
  Send,
  Bot,
  TrendingUp,
  ShieldAlert,
  Reply,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Heart,
  CircleDot,
  Play,
  Pause,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CRMLayout } from "@/components/layout/crm-layout";

const STATUS_LABELS: Record<NegotiationStatus, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_negociacao: "Em Negociacao",
  proposta_enviada: "Proposta Enviada",
  follow_up: "Follow-up",
  fechado_ganho: "Fechado (Ganho)",
  perdido: "Perdido",
};

const STATUS_COLORS: Record<NegotiationStatus, string> = {
  novo_lead: "bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  primeiro_contato: "bg-indigo-500/10 text-indigo-700 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800",
  em_negociacao: "bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400 dark:border-yellow-800",
  proposta_enviada: "bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  follow_up: "bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400 dark:border-orange-800",
  fechado_ganho: "bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800",
  perdido: "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800",
};

const TEMPERATURE_EMOJI: Record<Temperature, string> = {
  quente: "🔥",
  morno: "🟡",
  frio: "🔵",
  perdido: "⚫",
};

const TEMPERATURE_LABELS: Record<Temperature, string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
  perdido: "Perdido",
};

const CHANNEL_LABELS: Record<ContactChannel, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligacao",
  email: "E-mail",
  reuniao: "Reuniao",
  presencial: "Presencial",
};

const CHANNEL_ICONS: Record<ContactChannel, typeof Phone> = {
  whatsapp: MessageCircle,
  ligacao: Phone,
  email: Mail,
  reuniao: FileText,
  presencial: User,
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  baixa: "Baixa",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  baixa: "bg-gray-500/10 text-gray-600",
  media: "bg-blue-500/10 text-blue-600",
  alta: "bg-orange-500/10 text-orange-600",
  urgente: "bg-red-500/10 text-red-600",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pendente: "Pendente",
  em_andamento: "Em Andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

const LEAD_SOURCE_LABELS: Record<string, string> = {
  indicacao: "Indicacao",
  site: "Site",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  google_ads: "Google Ads",
  evento: "Evento",
  ligacao_fria: "Ligacao Fria",
  outro: "Outro",
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ClientDetailPage() {
  const mounted = useHydrated();
  const params = useParams();
  const id = params.id as string;

  const getClientById = useCRMStore((s) => s.getClientById);
  const updateClient = useCRMStore((s) => s.updateClient);
  const deleteClient = useCRMStore((s) => s.deleteClient);
  const getConversationsByClient = useCRMStore((s) => s.getConversationsByClient);
  const addConversation = useCRMStore((s) => s.addConversation);
  const getTasksByClient = useCRMStore((s) => s.getTasksByClient);
  const addTask = useCRMStore((s) => s.addTask);
  const updateTask = useCRMStore((s) => s.updateTask);
  const deleteTask = useCRMStore((s) => s.deleteTask);

  const client = getClientById(id);
  const conversations = useMemo(
    () => (client ? getConversationsByClient(id) : []),
    [client, id, getConversationsByClient]
  );
  const tasks = useMemo(
    () => (client ? getTasksByClient(id) : []),
    [client, id, getTasksByClient]
  );

  const [convDialogOpen, setConvDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  const [newConv, setNewConv] = useState({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toTimeString().slice(0, 5),
    channel: "whatsapp" as ContactChannel,
    summary: "",
    objections: "",
    needs: "",
    nextSteps: "",
    responsible: "user-1",
    attachments: [] as string[],
  });

  const [newTask, setNewTask] = useState({
    title: "",
    priority: "media" as TaskPriority,
    dueDate: "",
    status: "pendente" as TaskStatus,
    description: "",
  });

  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const daysSinceContact = client?.lastContactDate
    ? differenceInDays(new Date(), new Date(client.lastContactDate))
    : null;

  const followUpPriority = useMemo(() => {
    if (!client) return null;
    if (!client.nextContactDate) return null;
    const today = new Date();
    const next = new Date(client.nextContactDate);
    const diff = differenceInDays(next, today);
    if (diff < 0) return { level: "atrasado", label: "Atrasado", color: "text-red-600 bg-red-500/10" };
    if (diff === 0) return { level: "hoje", label: "Hoje", color: "text-orange-600 bg-orange-500/10" };
    if (diff <= 2) return { level: "breve", label: `Em ${diff} dia(s)`, color: "text-yellow-600 bg-yellow-500/10" };
    return { level: "ok", label: `Em ${diff} dias`, color: "text-emerald-600 bg-emerald-500/10" };
  }, [client]);

  function handleAddConversation() {
    if (!newConv.summary.trim()) return;
    addConversation({
      clientId: id,
      date: newConv.date,
      time: newConv.time,
      channel: newConv.channel,
      summary: newConv.summary,
      objections: newConv.objections,
      needs: newConv.needs,
      nextSteps: newConv.nextSteps,
      responsible: newConv.responsible,
      attachments: newConv.attachments,
    });
    updateClient(id, {
      lastContactDate: newConv.date,
      updatedAt: new Date().toISOString(),
    });
    setNewConv({
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      channel: "whatsapp",
      summary: "",
      objections: "",
      needs: "",
      nextSteps: "",
      responsible: "user-1",
      attachments: [],
    });
    setConvDialogOpen(false);
  }

  function handleAddTask() {
    if (!newTask.title.trim()) return;
    addTask({
      clientId: id,
      ...newTask,
    });
    setNewTask({
      title: "",
      priority: "media",
      dueDate: "",
      status: "pendente",
      description: "",
    });
    setTaskDialogOpen(false);
  }

  function handleEditClient() {
    updateClient(id, editForm as Record<string, string>);
    setEditDialogOpen(false);
  }

  function handleDeleteClient() {
    deleteClient(id);
    window.location.href = "/clientes";
  }

  function openEditDialog() {
    if (!client) return;
    setEditForm({
      name: client.name,
      company: client.company,
      position: client.position,
      phone: client.phone,
      whatsapp: client.whatsapp,
      email: client.email,
      city: client.city,
      state: client.state,
      productOfInterest: client.productOfInterest,
      estimatedValue: String(client.estimatedValue),
      status: client.status,
      temperature: client.temperature,
      notes: client.notes,
    });
    setEditDialogOpen(true);
  }

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 p-6">
        <div className="flex size-20 items-center justify-center rounded-full bg-muted">
          <User className="size-9 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Cliente nao encontrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            O cliente solicitado nao foi encontrado no sistema.
          </p>
        </div>
        <Link href="/clientes">
          <Button variant="outline" className="gap-1.5">
            <ArrowLeft className="size-4" />
            Voltar para Clientes
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="space-y-6 p-6">
      {/* Back Button */}
      <Link
        href="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para Clientes
      </Link>

      {/* Client Header */}
      <Card>
        <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center">
          <Avatar size="lg" className="size-14">
            <AvatarFallback className="text-lg">
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {client.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium",
                  STATUS_COLORS[client.status]
                )}
              >
                {STATUS_LABELS[client.status]}
              </Badge>
              <span className="text-sm" title={TEMPERATURE_LABELS[client.temperature]}>
                {TEMPERATURE_EMOJI[client.temperature]}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {client.position && `${client.position} · `}
              {client.company}
            </p>
          </div>

          {/* Progress */}
          <div className="hidden w-48 flex-col gap-1.5 lg:flex">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Score / Probabilidade</span>
              <span className="font-medium tabular-nums">{client.probability}%</span>
            </div>
            <Progress value={client.probability}>
              <ProgressLabel className="sr-only">Probabilidade</ProgressLabel>
              <ProgressValue className="sr-only" />
            </Progress>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Score: {client.score}/100</span>
              <span>{formatCurrency(client.estimatedValue)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={openEditDialog} className="gap-1">
              <Pencil className="size-3.5" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="gap-1"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
            {client.whatsapp && (
              <a
                href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-emerald-600 hover:text-emerald-700"
                >
                  <MessageCircle className="size-3.5" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Button>
              </a>
            )}
            {client.email && (
              <a href={`mailto:${client.email}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Mail className="size-3.5" />
                  <span className="hidden sm:inline">E-mail</span>
                </Button>
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone.replace(/\D/g, "")}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <Phone className="size-3.5" />
                  <span className="hidden sm:inline">Ligar</span>
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mobile Progress */}
      <div className="block lg:hidden">
        <Card>
          <CardContent className="space-y-2 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Probabilidade</span>
              <span className="font-medium tabular-nums">{client.probability}%</span>
            </div>
            <Progress value={client.probability}>
              <ProgressLabel className="sr-only">Probabilidade</ProgressLabel>
              <ProgressValue className="sr-only" />
            </Progress>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visao_geral">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="visao_geral">Visao Geral</TabsTrigger>
          <TabsTrigger value="historico">Historico</TabsTrigger>
          <TabsTrigger value="tarefas">
            Tarefas
            {tasks.filter((t) => t.status !== "concluida").length > 0 && (
              <Badge variant="secondary" className="ml-1 size-4 p-0 text-[9px]">
                {tasks.filter((t) => t.status !== "concluida").length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="followup">Follow-up</TabsTrigger>
          <TabsTrigger value="ia">IA</TabsTrigger>
        </TabsList>

        {/* Visao Geral Tab */}
        <TabsContent value="visao_geral" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow icon={User} label="Nome" value={client.name} />
                <InfoRow icon={Building2} label="Empresa" value={client.company} />
                <InfoRow icon={User} label="Cargo" value={client.position} />
                <InfoRow icon={Phone} label="Telefone" value={client.phone} />
                <InfoRow icon={MessageCircle} label="WhatsApp" value={client.whatsapp} />
                <InfoRow icon={Mail} label="E-mail" value={client.email} />
                <InfoRow
                  icon={MapPin}
                  label="Localizacao"
                  value={
                    client.city && client.state
                      ? `${client.city}, ${client.state}`
                      : client.city || client.state || ""
                  }
                />
              </CardContent>
            </Card>

            {/* Business Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="size-4 text-primary" />
                  Dados Comerciais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  icon={DollarSign}
                  label="Valor Estimado"
                  value={formatCurrency(client.estimatedValue)}
                />
                <InfoRow
                  icon={Target}
                  label="Probabilidade"
                  value={`${client.probability}%`}
                />
                <InfoRow
                  icon={TrendingUp}
                  label="Score"
                  value={`${client.score}/100`}
                />
                <InfoRow
                  icon={Sparkles}
                  label="Produto de Interesse"
                  value={client.productOfInterest}
                />
                <InfoRow
                  icon={FlaskConical}
                  label="Fonte do Lead"
                  value={LEAD_SOURCE_LABELS[client.leadSource] || client.leadSource}
                />
                <InfoRow
                  icon={Calendar}
                  label="Criado em"
                  value={
                    client.createdAt
                      ? format(new Date(client.createdAt), "dd/MM/yyyy", { locale: ptBR })
                      : "-"
                  }
                />
              </CardContent>
            </Card>

            {/* Tags & Notes */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Tag className="size-4 text-primary" />
                  Tags & Observacoes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {client.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Tag className="size-2.5 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                {client.notes && (
                  <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                    {client.notes}
                  </div>
                )}
                {!client.tags.length && !client.notes && (
                  <p className="text-sm text-muted-foreground/70">
                    Nenhuma tag ou observacao registrada.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Historico Tab */}
        <TabsContent value="historico" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Clock className="size-4 text-primary" />
                    Historico de Conversas
                  </CardTitle>
                  <CardDescription>
                    {conversations.length} interacao{conversations.length !== 1 ? "es" : ""}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => setConvDialogOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Nova Conversa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {conversations.length > 0 ? (
                <div className="relative ml-3 space-y-0">
                  <div className="absolute left-0 top-2 bottom-2 w-px bg-border" />
                  {conversations.map((conv) => {
                    const ChannelIcon = CHANNEL_ICONS[conv.channel];
                    const isExpanded = expandedAnalysis === conv.id;
                    return (
                      <div key={conv.id} className="relative flex gap-4 py-4 first:pt-0">
                        <div className="absolute -left-3 top-4 flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted">
                          <ChannelIcon className="size-3 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1 pl-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {CHANNEL_LABELS[conv.channel]}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(conv.date), "dd/MM/yyyy", { locale: ptBR })}
                              {" as "}
                              {conv.time}
                            </span>
                          </div>

                          <p className="mt-2 text-sm">{conv.summary}</p>

                          {conv.objections && (
                            <div className="mt-2 rounded-md bg-orange-500/5 px-2.5 py-1.5 text-xs">
                              <span className="font-medium text-orange-600">Objecoes: </span>
                              <span className="text-muted-foreground">{conv.objections}</span>
                            </div>
                          )}

                          {conv.needs && (
                            <div className="mt-1.5 rounded-md bg-blue-500/5 px-2.5 py-1.5 text-xs">
                              <span className="font-medium text-blue-600">Necessidades: </span>
                              <span className="text-muted-foreground">{conv.needs}</span>
                            </div>
                          )}

                          {conv.nextSteps && (
                            <div className="mt-1.5 rounded-md bg-emerald-500/5 px-2.5 py-1.5 text-xs">
                              <span className="font-medium text-emerald-600">Proximos Passos: </span>
                              <span className="text-muted-foreground">{conv.nextSteps}</span>
                            </div>
                          )}

                          {/* AI Analysis */}
                          {conv.aiAnalysis && (
                            <div className="mt-3">
                              <button
                                onClick={() =>
                                  setExpandedAnalysis(isExpanded ? null : conv.id)
                                }
                                className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                              >
                                <Bot className="size-3.5" />
                                Analise IA
                                {isExpanded ? (
                                  <ChevronUp className="size-3" />
                                ) : (
                                  <ChevronDown className="size-3" />
                                )}
                              </button>
                              {isExpanded && (
                                <div className="mt-2 space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                  <p className="text-xs text-muted-foreground">
                                    {conv.aiAnalysis.summary}
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    <MiniStat
                                      label="Sentimento"
                                      value={conv.aiAnalysis.sentiment}
                                      color={
                                        conv.aiAnalysis.sentiment === "positivo"
                                          ? "text-emerald-600"
                                          : conv.aiAnalysis.sentiment === "negativo"
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                      }
                                    />
                                    <MiniStat
                                      label="Intencao"
                                      value={conv.aiAnalysis.purchaseIntent}
                                      color={
                                        conv.aiAnalysis.purchaseIntent === "alto"
                                          ? "text-emerald-600"
                                          : conv.aiAnalysis.purchaseIntent === "baixo"
                                            ? "text-red-600"
                                            : "text-muted-foreground"
                                      }
                                    />
                                    <MiniStat
                                      label="Chance de Fechamento"
                                      value={`${conv.aiAnalysis.closingChance}%`}
                                      color="text-foreground"
                                    />
                                  </div>
                                  {conv.aiAnalysis.mentalTriggers.length > 0 && (
                                    <div>
                                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        Gatilhos Mentais
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {conv.aiAnalysis.mentalTriggers.map((t, i) => (
                                          <Badge key={i} variant="secondary" className="text-[10px]">
                                            <Zap className="size-2.5 mr-0.5" />
                                            {t}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {conv.aiAnalysis.salesTechniques.length > 0 && (
                                    <div>
                                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                        Tecnicas de Vendas
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {conv.aiAnalysis.salesTechniques.map((t, i) => (
                                          <Badge key={i} variant="secondary" className="text-[10px]">
                                            <Target className="size-2.5 mr-0.5" />
                                            {t}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <FileText className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhuma conversa registrada
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Registre a primeira interacao com este cliente
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1"
                    onClick={() => setConvDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Nova Conversa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tarefas Tab */}
        <TabsContent value="tarefas" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="size-4 text-primary" />
                    Tarefas
                  </CardTitle>
                  <CardDescription>
                    {tasks.length} tarefa{tasks.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => setTaskDialogOpen(true)}
                >
                  <Plus className="size-3.5" />
                  Nova Tarefa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const isOverdue =
                      task.dueDate &&
                      new Date(task.dueDate) < new Date() &&
                      task.status !== "concluida" &&
                      task.status !== "cancelada";
                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30",
                          isOverdue && "border-destructive/30 bg-destructive/5"
                        )}
                      >
                        <button
                          onClick={() => {
                            const nextStatus: Record<TaskStatus, TaskStatus> = {
                              pendente: "em_andamento",
                              em_andamento: "concluida",
                              concluida: "pendente",
                              cancelada: "pendente",
                            };
                            updateTask(task.id, {
                              status: nextStatus[task.status],
                            });
                          }}
                          className="mt-0.5"
                        >
                          {task.status === "concluida" ? (
                            <CheckCircle2 className="size-4 text-emerald-500" />
                          ) : task.status === "em_andamento" ? (
                            <CircleDot className="size-4 text-blue-500" />
                          ) : task.status === "cancelada" ? (
                            <X className="size-4 text-muted-foreground" />
                          ) : (
                            <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                task.status === "concluida" && "text-muted-foreground line-through"
                              )}
                            >
                              {task.title}
                            </p>
                            <Badge
                              variant="secondary"
                              className={cn("text-[9px]", PRIORITY_COLORS[task.priority])}
                            >
                              {PRIORITY_LABELS[task.priority]}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                              {task.description}
                            </p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                            {task.dueDate && (
                              <span
                                className={cn(
                                  "flex items-center gap-1",
                                  isOverdue && "text-destructive font-medium"
                                )}
                              >
                                <Calendar className="size-3" />
                                {format(new Date(task.dueDate), "dd/MM/yyyy")}
                                {isOverdue && " (atrasada)"}
                              </span>
                            )}
                            <span
                              className={cn(
                                "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                                task.status === "concluida"
                                  ? "bg-emerald-500/10 text-emerald-600"
                                  : task.status === "em_andamento"
                                    ? "bg-blue-500/10 text-blue-600"
                                    : task.status === "cancelada"
                                      ? "bg-gray-500/10 text-gray-600"
                                      : "bg-yellow-500/10 text-yellow-600"
                              )}
                            >
                              {TASK_STATUS_LABELS[task.status]}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="text-muted-foreground"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <CheckCircle2 className="size-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nenhuma tarefa cadastrada
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Crie tarefas para acompanhar acoes com este cliente
                  </p>
                  <Button
                    size="sm"
                    className="mt-4 gap-1"
                    onClick={() => setTaskDialogOpen(true)}
                  >
                    <Plus className="size-3.5" />
                    Nova Tarefa
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Follow-up Tab */}
        <TabsContent value="followup" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarClock className="size-4 text-primary" />
                  Controle de Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ultimo Contato</p>
                    <p className="text-sm font-medium">
                      {client.lastContactDate
                        ? format(new Date(client.lastContactDate), "dd/MM/yyyy", { locale: ptBR })
                        : "Nunca"}
                    </p>
                    {daysSinceContact !== null && (
                      <p className="text-xs text-muted-foreground">
                        {daysSinceContact === 0
                          ? "Hoje"
                          : `ha ${daysSinceContact} dia(s)`}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Proximo Contato (Auto)</p>
                    <p className="text-sm font-medium">
                      {client.nextContactDate
                        ? format(new Date(client.nextContactDate), "dd/MM/yyyy", { locale: ptBR })
                        : "Nao definido"}
                    </p>
                  </div>
                </div>

                <Separator />

                {followUpPriority && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Prioridade</span>
                    <Badge
                      variant="secondary"
                      className={cn("text-xs", followUpPriority.color)}
                    >
                      {followUpPriority.label}
                    </Badge>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Dias sem contato</p>
                    <p
                      className={cn(
                        "text-2xl font-bold tabular-nums",
                        daysSinceContact !== null && daysSinceContact > 7
                          ? "text-destructive"
                          : daysSinceContact !== null && daysSinceContact > 3
                            ? "text-orange-500"
                            : "text-foreground"
                      )}
                    >
                      {daysSinceContact !== null ? daysSinceContact : "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Temperatura</p>
                    <p className="text-2xl">
                      {TEMPERATURE_EMOJI[client.temperature]}
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full gap-1.5"
                  onClick={() => setConvDialogOpen(true)}
                >
                  <Phone className="size-4" />
                  Registrar Novo Contato
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lightbulb className="size-4 text-primary" />
                  Dicas de Follow-up
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {client.temperature === "quente" && (
                  <div className="rounded-lg bg-red-500/5 p-3">
                    <p className="text-xs font-medium text-red-600">Lead Quente</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cliente demonstra forte interesse. Agende contato尽快 para manter o momentum e avancar na negociacao.
                    </p>
                  </div>
                )}
                {client.temperature === "morno" && (
                  <div className="rounded-lg bg-yellow-500/5 p-3">
                    <p className="text-xs font-medium text-yellow-600">Lead Morno</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Interesse moderado. Envie conteudo de valor e cases de sucesso para reaquecer o interesse.
                    </p>
                  </div>
                )}
                {client.temperature === "frio" && (
                  <div className="rounded-lg bg-blue-500/5 p-3">
                    <p className="text-xs font-medium text-blue-600">Lead Frio</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Pouco ou nenhum engajamento. Considere uma abordagem diferente ou agende um contato mais informal.
                    </p>
                  </div>
                )}
                {client.temperature === "perdido" && (
                  <div className="rounded-lg bg-gray-500/5 p-3">
                    <p className="text-xs font-medium text-gray-600">Lead Perdido</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Negociacao encerrada. Mantenha no funil para reengajamento futuro quando apropriado.
                    </p>
                  </div>
                )}

                {client.status === "proposta_enviada" && (
                  <div className="rounded-lg bg-purple-500/5 p-3">
                    <p className="text-xs font-medium text-purple-600">Proposta Enviada</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Acompanhe o recebimento da proposta. Ofereca esclarecer duvidas e enfatize os beneficios principais.
                    </p>
                  </div>
                )}

                {client.status === "em_negociacao" && (
                  <div className="rounded-lg bg-yellow-500/5 p-3">
                    <p className="text-xs font-medium text-yellow-600">Em Negociacao</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Negociacao ativa. Identifique objecoes e trabalhe no value selling. Documente cada interacao.
                    </p>
                  </div>
                )}

                {client.status === "novo_lead" && (
                  <div className="rounded-lg bg-blue-500/5 p-3">
                    <p className="text-xs font-medium text-blue-600">Novo Lead</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Primeira interacao pendente. Faca o primeiro contato o mais breve possivel para maximizar a taxa de conversao.
                    </p>
                  </div>
                )}

                {daysSinceContact !== null && daysSinceContact > 7 && (
                  <div className="rounded-lg bg-destructive/5 p-3">
                    <p className="text-xs font-medium text-destructive">
                      <AlertTriangle className="mr-1 inline size-3" />
                      Atencao: Sem contato ha {daysSinceContact} dias
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      O risco de perder o lead aumenta significativamente apos 7 dias sem interacao. Priorize este follow-up.
                    </p>
                  </div>
                )}

                {client.status === "fechado_ganho" && (
                  <div className="rounded-lg bg-emerald-500/5 p-3">
                    <p className="text-xs font-medium text-emerald-600">
                      <CheckCircle2 className="mr-1 inline size-3" />
                      Cliente Fechado
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Parabens! Mantenha contato periodico para fidelizacao e identificar oportunidades de upsell.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* IA Tab */}
        <TabsContent value="ia" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Bot className="size-4 text-primary" />
                  Resumo IA do Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-primary/5 p-3">
                  <p className="text-sm text-muted-foreground">
                    {client.notes || "Sem dados suficientes para gerar resumo da IA."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Sentimento
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {client.temperature === "quente"
                        ? "😄 Positivo"
                        : client.temperature === "morno"
                          ? "😐 Neutro"
                          : client.temperature === "frio"
                            ? "😟 Negativo"
                            : "😞 Perdido"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Intencao de Compra
                    </p>
                    <p className="mt-1 text-sm font-medium">
                      {client.probability >= 70
                        ? "Alta"
                        : client.probability >= 40
                          ? "Media"
                          : "Baixa"}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Chance de Fechamento
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <div className="relative size-16">
                      <svg className="size-16 -rotate-90" viewBox="0 0 36 36">
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-muted"
                        />
                        <circle
                          cx="18"
                          cy="18"
                          r="15"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeDasharray={`${client.probability} ${100 - client.probability}`}
                          strokeLinecap="round"
                          className={
                            client.probability >= 70
                              ? "text-emerald-500"
                              : client.probability >= 40
                                ? "text-yellow-500"
                                : "text-red-500"
                          }
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                        {client.probability}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommended Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Target className="size-4 text-primary" />
                  Acoes Recomendadas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ActionCard
                  icon={Phone}
                  title="Proximo Contato"
                  description={
                    client.nextContactDate
                      ? `Agendado para ${format(new Date(client.nextContactDate), "dd/MM/yyyy")}`
                      : "Agendar proximo contato"
                  }
                  color="bg-blue-500/10 text-blue-600"
                />
                <ActionCard
                  icon={Send}
                  title="Mensagem Sugerida"
                  description={
                    client.temperature === "quente"
                      ? `"Oi ${client.name.split(" ")[0]}, tudo bem? Gostaria de agendar uma rapida conversa para avancarmos com a proposta."`
                      : client.temperature === "morno"
                        ? `"Oi ${client.name.split(" ")[0]}, separei alguns cases de sucesso do seu segmento. Posso compartilhar com voce?"`
                        : `"Oi ${client.name.split(" ")[0]}, estou passando para saber se teve alguma duvida sobre nossa solucao."`
                  }
                  color="bg-emerald-500/10 text-emerald-600"
                />
                <ActionCard
                  icon={Lightbulb}
                  title="Tecnica Sugerida"
                  description={
                    client.status === "novo_lead"
                      ? "First Contact: Foque em entender as dores antes de apresentar a solucao."
                      : client.status === "em_negociacao"
                        ? "Value Selling: Reforce o ROI e os beneficios especificos para o segmento do cliente."
                        : client.status === "proposta_enviada"
                          ? "Urgencia Controlada: Crie senso de urgencia sutil lembrando de prazos ou condicoes especiais."
                          : "Prova Social: Compartilhe resultados de clientes similares para construir confianca."
                  }
                  color="bg-purple-500/10 text-purple-600"
                />
              </CardContent>
            </Card>

            {/* Suggested Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="size-4 text-primary" />
                  Mensagens Sugeridas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="size-3.5 text-emerald-500" />
                    <span className="text-xs font-medium">WhatsApp</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {client.temperature === "quente"
                      ? `Fala ${client.name.split(" ")[0]}! 😊 Tudo certo? Vi que voce tem interesse no ${client.productOfInterest}. Que tal a gente bater um papo rapido pra alinhar os proximos passos? Posso te ajudar com alguma duvida?`
                      : client.temperature === "morno"
                        ? `Oi ${client.name.split(" ")[0]}, tudo bem? 😊 Separei um material bem legal sobre como empresas do segmento de ${client.company} estao usando nossa solucao. Posso te enviar?`
                        : `Oi ${client.name.split(" ")[0]}, sou da equipe de vendas. Vi que voce demonstrou interesse em nossa solucao. Posso te fazer uma rapida demonstracao?`}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-blue-500" />
                    <span className="text-xs font-medium">E-mail</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Assunto: {client.productOfInterest} - Solucao para {client.company}
                    <br />
                    <br />
                    Prezado(a) {client.name.split(" ")[0]},
                    <br />
                    <br />
                    Entendo que a gestao eficiente e fundamental para o crescimento da {client.company}. Nossa solucao foi desenvolvida para atender exatamente as necessidades de empresas como a sua.
                    <br />
                    <br />
                    Gostaria de agendar uma demonstracao personalizada?
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Mental Triggers & Objections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Brain className="size-4 text-primary" />
                  Gatilhos & Objecoes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Gatilhos Mentais
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="size-2.5 mr-1" />
                      Escassez de Tempo
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Shield className="size-2.5 mr-1" />
                      Prova Social
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="size-2.5 mr-1" />
                      ROI Comprovado
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Heart className="size-2.5 mr-1" />
                      Pertencimento
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Objecoes Provaveis & Respostas
                  </p>
                  <div className="space-y-2">
                    <ObjectionCard
                      objection="O preco esta acima do orcamento"
                      response="Entendo. Vamos analisar juntos o ROI que voce tera. Em media, nossos clientes recuperam o investimento em 3 meses."
                    />
                    <ObjectionCard
                      objection="Preciso consultar com meu time/socios"
                      response="Claro! Posso preparar uma apresentacao resumida para voce compartilhar com a equipe?"
                    />
                    <ObjectionCard
                      objection="Ja temos uma solucao similar"
                      response="Perfeito! Podemos fazer uma comparativa rapida para voce ver onde estamos alem."
                    />
                  </div>
                </div>

                {conversations.length === 0 && (
                  <>
                    <Separator />
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Registre interacoes com este cliente para obter analises de IA mais precisas e personalizadas.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Conversation Dialog */}
      <Dialog open={convDialogOpen} onOpenChange={setConvDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Conversa</DialogTitle>
            <DialogDescription>
              Registre os detalhes desta interacao com o cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="conv-date">Data</Label>
                <Input
                  id="conv-date"
                  type="date"
                  value={newConv.date}
                  onChange={(e) => setNewConv({ ...newConv, date: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="conv-time">Horario</Label>
                <Input
                  id="conv-time"
                  type="time"
                  value={newConv.time}
                  onChange={(e) => setNewConv({ ...newConv, time: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>Canal</Label>
              <Select
                value={newConv.channel}
                onValueChange={(val) => {
                  if (val) setNewConv({ ...newConv, channel: val as ContactChannel });
                }}
              >
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CHANNEL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="conv-summary">Resumo *</Label>
              <Textarea
                id="conv-summary"
                placeholder="Resumo da conversa..."
                value={newConv.summary}
                onChange={(e) => setNewConv({ ...newConv, summary: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="conv-objections">Objecoes</Label>
              <Textarea
                id="conv-objections"
                placeholder="Objecoes levantadas pelo cliente..."
                value={newConv.objections}
                onChange={(e) => setNewConv({ ...newConv, objections: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="conv-needs">Necessidades</Label>
              <Textarea
                id="conv-needs"
                placeholder="Necessidades identificadas..."
                value={newConv.needs}
                onChange={(e) => setNewConv({ ...newConv, needs: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="conv-next">Proximos Passos</Label>
              <Textarea
                id="conv-next"
                placeholder="Proximos passos definidos..."
                value={newConv.nextSteps}
                onChange={(e) => setNewConv({ ...newConv, nextSteps: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddConversation} disabled={!newConv.summary.trim()}>
              Salvar Conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
            <DialogDescription>
              Crie uma tarefa para acompanhar acoes com este cliente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="task-title">Titulo *</Label>
              <Input
                id="task-title"
                placeholder="Titulo da tarefa"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Prioridade</Label>
                <Select
                  value={newTask.priority}
                  onValueChange={(val) => {
                    if (val) setNewTask({ ...newTask, priority: val as TaskPriority });
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="task-date">Data Limite</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="task-desc">Descricao</Label>
              <Textarea
                id="task-desc"
                placeholder="Descricao da tarefa..."
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
              Criar Tarefa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Client Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize os dados do cliente.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Nome</Label>
                <Input
                  value={editForm.name || ""}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={editForm.company || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, company: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Cargo</Label>
                <Input
                  value={editForm.position || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, position: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={editForm.phone || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>WhatsApp</Label>
                <Input
                  value={editForm.whatsapp || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, whatsapp: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>E-mail</Label>
                <Input
                  value={editForm.email || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Valor Estimado</Label>
                <Input
                  type="number"
                  value={editForm.estimatedValue || ""}
                  onChange={(e) =>
                    setEditForm({ ...editForm, estimatedValue: e.target.value })
                  }
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editForm.status || ""}
                  onValueChange={(val) => {
                    if (val) setEditForm({ ...editForm, status: val });
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Temperatura</Label>
                <Select
                  value={editForm.temperature || ""}
                  onValueChange={(val) => {
                    if (val) setEditForm({ ...editForm, temperature: val });
                  }}
                >
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEMPERATURE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {TEMPERATURE_EMOJI[key as Temperature]} {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observacoes</Label>
              <Textarea
                value={editForm.notes || ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, notes: e.target.value })
                }
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditClient}>Salvar Alteracoes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Excluir Cliente</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{client.name}</strong>?
              Esta acao nao pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteClient}>
              <Trash2 className="size-3.5" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </CRMLayout>
  );
}

/* Helper Components */

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className={cn("text-xs font-medium capitalize", color)}>{value}</p>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: typeof Phone;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div className="flex gap-3 rounded-lg border p-3">
      <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", color)}>
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function ObjectionCard({
  objection,
  response,
}: {
  objection: string;
  response: string;
}) {
  return (
    <div className="rounded-lg border p-2.5">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 size-3 shrink-0 text-orange-500" />
        <p className="text-xs font-medium text-orange-600">{objection}</p>
      </div>
      <div className="mt-1.5 flex items-start gap-2">
        <Reply className="mt-0.5 size-3 shrink-0 text-emerald-500" />
        <p className="text-xs text-muted-foreground">{response}</p>
      </div>
    </div>
  );
}
