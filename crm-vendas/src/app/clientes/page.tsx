"use client";

import { useState, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  Client,
  NegotiationStatus,
  Temperature,
  LeadSource,
} from "@/lib/types";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Building2,
  MapPin,
  Tag,
  DollarSign,
  Calendar,
  ArrowUpDown,
  Users,
  Filter,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const PRODUCTS = [
  "Plano Basico",
  "Plano Profissional",
  "Plano Enterprise",
];

type SortField = "name" | "lastContactDate" | "estimatedValue" | "status";

const ITEMS_PER_PAGE = 8;

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

interface NewClientForm {
  name: string;
  company: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  leadSource: LeadSource;
  productOfInterest: string;
  estimatedValue: number;
  status: NegotiationStatus;
  temperature: Temperature;
  score: number;
  probability: number;
  lastContactDate: string;
  nextContactDate: string;
  manualNextContact: boolean;
  responsibleId: string;
  tags: string[];
  notes: string;
}

const INITIAL_FORM: NewClientForm = {
  name: "",
  company: "",
  position: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  state: "",
  leadSource: "site",
  productOfInterest: "Plano Profissional",
  estimatedValue: 0,
  status: "novo_lead",
  temperature: "frio",
  score: 0,
  probability: 0,
  lastContactDate: "",
  nextContactDate: "",
  manualNextContact: false,
  responsibleId: "user-1",
  tags: [],
  notes: "",
};

export default function ClientesPage() {
  const mounted = useHydrated();
  const clients = useCRMStore((s) => s.clients);
  const addClient = useCRMStore((s) => s.addClient);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tempFilter, setTempFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<NewClientForm>(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  const cities = useMemo(
    () => [...new Set(clients.map((c) => c.city).filter(Boolean))].sort(),
    [clients]
  );

  const filtered = useMemo(() => {
    let result = [...clients];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.city.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }
    if (tempFilter !== "all") {
      result = result.filter((c) => c.temperature === tempFilter);
    }
    if (cityFilter !== "all") {
      result = result.filter((c) => c.city === cityFilter);
    }
    if (productFilter !== "all") {
      result = result.filter((c) => c.productOfInterest === productFilter);
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "lastContactDate")
        cmp =
          (a.lastContactDate || "").localeCompare(b.lastContactDate || "");
      else if (sortField === "estimatedValue")
        cmp = a.estimatedValue - b.estimatedValue;
      else if (sortField === "status") cmp = a.status.localeCompare(b.status);
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [
    clients,
    search,
    statusFilter,
    tempFilter,
    cityFilter,
    productFilter,
    sortField,
    sortAsc,
  ]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const activeFilters = [
    statusFilter !== "all" && {
      key: "status",
      label: STATUS_LABELS[statusFilter as NegotiationStatus],
      clear: () => setStatusFilter("all"),
    },
    tempFilter !== "all" && {
      key: "temp",
      label: `${TEMPERATURE_EMOJI[tempFilter as Temperature]} ${TEMPERATURE_LABELS[tempFilter as Temperature]}`,
      clear: () => setTempFilter("all"),
    },
    cityFilter !== "all" && {
      key: "city",
      label: cityFilter,
      clear: () => setCityFilter("all"),
    },
    productFilter !== "all" && {
      key: "product",
      label: productFilter,
      clear: () => setProductFilter("all"),
    },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  function handleSaveClient() {
    if (!form.name.trim()) {
      setFormError("Nome e obrigatorio");
      return;
    }
    addClient({
      ...form,
      lastContactDate: form.lastContactDate || "",
      nextContactDate: form.nextContactDate || "",
    });
    setForm(INITIAL_FORM);
    setFormError("");
    setDialogOpen(false);
  }

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
    setTempFilter("all");
    setCityFilter("all");
    setProductFilter("all");
    setPage(1);
  }

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length} cliente{filtered.length !== 1 ? "s" : ""}
              {activeFilters.length > 0 && " (filtrado)"}
            </p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" />
            }
          >
            <Plus className="size-4" />
            Novo Cliente
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo cliente para adiciona-lo ao CRM.
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {formError && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setFormError("");
                    }}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    placeholder="Nome da empresa"
                    value={form.company}
                    onChange={(e) => setForm({ ...form, company: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    placeholder="Cargo / Funcao"
                    value={form.position}
                    onChange={(e) =>
                      setForm({ ...form, position: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp">WhatsApp</Label>
                  <Input
                    id="whatsapp"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(e) =>
                      setForm({ ...form, whatsapp: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@empresa.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Cidade"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="UF"
                    maxLength={2}
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value.toUpperCase() })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>Fonte do Lead</Label>
                  <Select
                    value={form.leadSource}
                    onValueChange={(val) => {
                      if (val) setForm({ ...form, leadSource: val as LeadSource });
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LEAD_SOURCE_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Produto de Interesse</Label>
                  <Select
                    value={form.productOfInterest}
                    onValueChange={(val) => {
                      if (val) setForm({ ...form, productOfInterest: val });
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCTS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => {
                      if (val) setForm({ ...form, status: val as NegotiationStatus });
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
                    value={form.temperature}
                    onValueChange={(val) => {
                      if (val) setForm({ ...form, temperature: val as Temperature });
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
                <div>
                  <Label htmlFor="value">Valor Estimado (R$)</Label>
                  <Input
                    id="value"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.estimatedValue || ""}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        estimatedValue: Number(e.target.value) || 0,
                      })
                    }
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="nextDate">Proximo Contato</Label>
                  <Input
                    id="nextDate"
                    type="date"
                    value={form.nextContactDate}
                    onChange={(e) =>
                      setForm({ ...form, nextContactDate: e.target.value })
                    }
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observacoes</Label>
                <Textarea
                  id="notes"
                  placeholder="Notas sobre o cliente..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveClient}>Salvar Cliente</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, empresa, e-mail, telefone ou cidade..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Filter className="size-3.5" />
            Filtros:
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val || "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={tempFilter}
            onValueChange={(val) => {
              setTempFilter(val || "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue placeholder="Temperatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.entries(TEMPERATURE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {TEMPERATURE_EMOJI[key as Temperature]} {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={cityFilter}
            onValueChange={(val) => {
              setCityFilter(val || "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Cidades</SelectItem>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={productFilter}
            onValueChange={(val) => {
              setProductFilter(val || "all");
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="h-7 text-xs">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Produtos</SelectItem>
              {PRODUCTS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="mx-1 h-5" />

          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("table")}
            >
              <List className="size-3.5" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon-xs"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {activeFilters.map((f) => (
              <Badge
                key={f.key}
                variant="secondary"
                className="gap-1 pr-1.5"
              >
                {f.label}
                <button
                  onClick={f.clear}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                >
                  <X className="size-2.5" />
                </button>
              </Badge>
            ))}
            <button
              onClick={resetFilters}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Limpar tudo
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Users className="size-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              Nenhum cliente encontrado
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {clients.length === 0
                ? "Comece adicionando seu primeiro cliente"
                : "Tente ajustar os filtros ou termos de busca"}
            </p>
            {clients.length === 0 && (
              <Button
                className="mt-4 gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="size-4" />
                Novo Cliente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Nome
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground lg:table-cell">
                    Empresa
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Status
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground md:table-cell">
                    Temperatura
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground xl:table-cell">
                    <button
                      onClick={() => handleSort("lastContactDate")}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Ultimo Contato
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="hidden px-4 py-3 text-left text-xs font-medium text-muted-foreground xl:table-cell">
                    Proximo Contato
                  </th>
                  <th className="hidden px-4 py-3 text-right text-xs font-medium text-muted-foreground sm:table-cell">
                    <button
                      onClick={() => handleSort("estimatedValue")}
                      className="flex items-center gap-1 ml-auto text-xs font-medium text-muted-foreground hover:text-foreground"
                    >
                      Valor
                      <ArrowUpDown className="size-3" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b transition-colors hover:bg-muted/30 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${client.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar size="sm">
                          <AvatarFallback>
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {client.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground lg:hidden">
                            {client.company}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 lg:table-cell">
                      <p className="truncate text-sm text-muted-foreground">
                        {client.company}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-medium",
                          STATUS_COLORS[client.status]
                        )}
                      >
                        {STATUS_LABELS[client.status]}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 md:table-cell">
                      <span className="text-sm" title={TEMPERATURE_LABELS[client.temperature]}>
                        {TEMPERATURE_EMOJI[client.temperature]}
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      {client.lastContactDate
                        ? formatDistanceToNow(new Date(client.lastContactDate), {
                            locale: ptBR,
                            addSuffix: true,
                          })
                        : "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-muted-foreground xl:table-cell">
                      {client.nextContactDate
                        ? format(new Date(client.nextContactDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })
                        : "-"}
                    </td>
                    <td className="hidden px-4 py-3 text-right text-sm font-medium sm:table-cell">
                      {formatCurrency(client.estimatedValue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-muted-foreground"
                            />
                          }
                        >
                          <MoreHorizontal className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={
                              <Link href={`/clientes/${client.id}`} />
                            }
                          >
                            <Pencil className="size-3.5" />
                            Ver detalhes
                          </DropdownMenuItem>
                          {client.whatsapp && (
                            <DropdownMenuItem
                              render={
                                <a
                                  href={`https://wa.me/${client.whatsapp.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                />
                              }
                            >
                              <Phone className="size-3.5" />
                              WhatsApp
                            </DropdownMenuItem>
                          )}
                          {client.email && (
                            <DropdownMenuItem
                              render={
                                <a href={`mailto:${client.email}`} />
                              }
                            >
                              <Mail className="size-3.5" />
                              E-mail
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {paginated.map((client) => (
            <Link key={client.id} href={`/clientes/${client.id}`}>
              <Card className="group cursor-pointer transition-all hover:ring-2 hover:ring-primary/20 hover:shadow-md">
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold group-hover:text-primary">
                        {client.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {client.position && `${client.position} · `}
                        {client.company}
                      </p>
                    </div>
                    <span className="text-lg" title={TEMPERATURE_LABELS[client.temperature]}>
                      {TEMPERATURE_EMOJI[client.temperature]}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        STATUS_COLORS[client.status]
                      )}
                    >
                      {STATUS_LABELS[client.status]}
                    </Badge>
                    {client.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        <Tag className="size-2.5 mr-0.5" />
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {client.city && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <MapPin className="size-3 shrink-0" />
                        <span className="truncate">
                          {client.city}/{client.state}
                        </span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3 shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </div>
                    )}
                    {client.productOfInterest && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="size-3 shrink-0" />
                        <span className="truncate">
                          {client.productOfInterest}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <DollarSign className="size-3 shrink-0" />
                      <span>{formatCurrency(client.estimatedValue)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {client.lastContactDate
                        ? `Contato: ${formatDistanceToNow(new Date(client.lastContactDate), { locale: ptBR, addSuffix: true })}`
                        : "Sem contato"}
                    </span>
                    {client.nextContactDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3" />
                        {format(new Date(client.nextContactDate), "dd/MM")}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {(page - 1) * ITEMS_PER_PAGE + 1}-
            {Math.min(page * ITEMS_PER_PAGE, filtered.length)} de{" "}
            {filtered.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
              )
              .reduce<(number | "...")[]>((acc, p, i, arr) => {
                if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === "..." ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1 text-xs text-muted-foreground"
                  >
                    ...
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? "default" : "outline"}
                    size="icon-xs"
                    onClick={() => setPage(p as number)}
                    className="text-xs"
                  >
                    {p}
                  </Button>
                )
              )}
            <Button
              variant="outline"
              size="icon-xs"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </CRMLayout>
  );
}
