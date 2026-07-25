"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useCRMStore } from "@/lib/store";
import type { Task, TaskPriority, TaskStatus, Client } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Pencil,
  CheckSquare,
  Search,
  AlertTriangle,
  Calendar,
  ArrowUpDown,
  List,
  LayoutGrid,
  ChevronDown,
  Clock,
  CheckCircle2,
  Circle,
  XCircle,
  Filter,
  Users,
} from "lucide-react";
import { format, isPast, isToday, parseISO } from "date-fns";
import { CRMLayout } from "@/components/layout/crm-layout";
import { ptBR } from "date-fns/locale";

type SortField = "dueDate" | "priority" | "client" | "status";
type ViewMode = "cards" | "table";
type FilterTab = "todas" | "pendentes" | "em_andamento" | "concluidas" | "atrasadas";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; bg: string; text: string }
> = {
  baixa: {
    label: "Baixa",
    color: "border-gray-400",
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-600 dark:text-gray-400",
  },
  media: {
    label: "Média",
    color: "border-blue-400",
    bg: "bg-blue-100 dark:bg-blue-950/40",
    text: "text-blue-600 dark:text-blue-400",
  },
  alta: {
    label: "Alta",
    color: "border-orange-400",
    bg: "bg-orange-100 dark:bg-orange-950/40",
    text: "text-orange-600 dark:text-orange-400",
  },
  urgente: {
    label: "Urgente",
    color: "border-red-400",
    bg: "bg-red-100 dark:bg-red-950/40",
    text: "text-red-600 dark:text-red-400",
  },
};

const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Circle }
> = {
  pendente: { label: "Pendente", variant: "outline", icon: Circle },
  em_andamento: { label: "Em Andamento", variant: "default", icon: Clock },
  concluida: { label: "Concluída", variant: "secondary", icon: CheckCircle2 },
  cancelada: { label: "Cancelada", variant: "destructive", icon: XCircle },
};

const STATUS_ORDER: TaskStatus[] = ["pendente", "em_andamento", "concluida", "cancelada"];

const PRIORITY_ORDER: TaskPriority[] = ["urgente", "alta", "media", "baixa"];

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "pendentes", label: "Pendentes" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluidas", label: "Concluídas" },
  { value: "atrasadas", label: "Atrasadas" },
];

interface TaskFormData {
  title: string;
  clientId: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  description: string;
}

const EMPTY_FORM: TaskFormData = {
  title: "",
  clientId: "",
  priority: "media",
  dueDate: format(new Date(), "yyyy-MM-dd"),
  status: "pendente",
  description: "",
};

export default function TarefasPage() {
  const { tasks, clients, addTask, updateTask, deleteTask } = useCRMStore();

  const [mounted, setMounted] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<FilterTab>("todas");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

  useEffect(() => {
    setMounted(true);
  }, []);

  const getClientById = useCallback(
    (clientId: string): Client | undefined => {
      return clients.find((c) => c.id === clientId);
    },
    [clients]
  );

  const getClientName = useCallback(
    (clientId: string): string => {
      const client = getClientById(clientId);
      return client ? client.name : "Sem cliente";
    },
    [getClientById]
  );

  const getClientCompany = useCallback(
    (clientId: string): string => {
      const client = getClientById(clientId);
      return client ? client.company : "";
    },
    [getClientById]
  );

  const isOverdue = useCallback((task: Task): boolean => {
    if (task.status === "concluida" || task.status === "cancelada") return false;
    try {
      return isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
    } catch {
      return false;
    }
  }, []);

  const isTodayTask = useCallback((task: Task): boolean => {
    try {
      return isToday(parseISO(task.dueDate));
    } catch {
      return false;
    }
  }, []);

  const stats = useMemo(() => {
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "pendente").length;
    const inProgress = tasks.filter((t) => t.status === "em_andamento").length;
    const completed = tasks.filter((t) => t.status === "concluida").length;
    const overdue = tasks.filter((t) => isOverdue(t)).length;
    return { total, pending, inProgress, completed, overdue };
  }, [tasks, isOverdue]);

  const filteredAndSorted = useMemo(() => {
    let result = [...tasks];

    switch (activeTab) {
      case "pendentes":
        result = result.filter((t) => t.status === "pendente");
        break;
      case "em_andamento":
        result = result.filter((t) => t.status === "em_andamento");
        break;
      case "concluidas":
        result = result.filter((t) => t.status === "concluida");
        break;
      case "atrasadas":
        result = result.filter((t) => isOverdue(t));
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => {
        const clientName = getClientName(t.clientId).toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          clientName.includes(q) ||
          t.description.toLowerCase().includes(q)
        );
      });
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "dueDate":
          cmp = a.dueDate.localeCompare(b.dueDate);
          break;
        case "priority":
          cmp = PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority);
          break;
        case "client":
          cmp = getClientName(a.clientId).localeCompare(getClientName(b.clientId));
          break;
        case "status":
          cmp = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status);
          break;
      }
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [tasks, activeTab, searchQuery, sortField, sortAsc, isOverdue, getClientName]);

  const toggleStatus = useCallback(
    (task: Task) => {
      const nextStatus: Record<TaskStatus, TaskStatus> = {
        pendente: "em_andamento",
        em_andamento: "concluida",
        concluida: "pendente",
        cancelada: "pendente",
      };
      updateTask(task.id, { status: nextStatus[task.status] });
    },
    [updateTask]
  );

  const openNewTask = useCallback(() => {
    setEditingTask(null);
    setFormData(EMPTY_FORM);
    setDialogOpen(true);
  }, []);

  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      clientId: task.clientId,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      description: task.description,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!formData.title.trim()) return;

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formData.title,
        clientId: formData.clientId,
        priority: formData.priority,
        dueDate: formData.dueDate,
        status: formData.status,
        description: formData.description,
      });
    } else {
      addTask({
        title: formData.title,
        clientId: formData.clientId,
        priority: formData.priority,
        dueDate: formData.dueDate,
        status: formData.status,
        description: formData.description,
      });
    }

    setDialogOpen(false);
    setEditingTask(null);
    setFormData(EMPTY_FORM);
  }, [formData, editingTask, addTask, updateTask]);

  const handleDelete = useCallback(
    (taskId: string) => {
      deleteTask(taskId);
    },
    [deleteTask]
  );

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortAsc(!sortAsc);
      } else {
        setSortField(field);
        setSortAsc(true);
      }
    },
    [sortField, sortAsc]
  );

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="flex h-full flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare className="size-5 text-muted-foreground" />
          <div>
            <h1 className="text-lg font-semibold">Tarefas</h1>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pendente{stats.pending !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={openNewTask}>
          <Plus className="size-4" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pendentes", value: stats.pending, color: "text-yellow-600 dark:text-yellow-400" },
          { label: "Em Andamento", value: stats.inProgress, color: "text-blue-600 dark:text-blue-400" },
          { label: "Concluídas", value: stats.completed, color: "text-green-600 dark:text-green-400" },
          { label: "Atrasadas", value: stats.overdue, color: "text-red-600 dark:text-red-400" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 rounded-lg border bg-card p-3"
          >
            <span className={`text-xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Sort, View Toggle */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título ou cliente..."
              className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <div className="relative">
              <select
                value={sortField}
                onChange={(e) => {
                  setSortField(e.target.value as SortField);
                  setSortAsc(true);
                }}
                className="h-8 appearance-none rounded-lg border border-input bg-transparent pl-2.5 pr-7 text-xs font-medium outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                <option value="dueDate">Data</option>
                <option value="priority">Prioridade</option>
                <option value="client">Cliente</option>
                <option value="status">Status</option>
              </select>
              <ArrowUpDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setSortAsc(!sortAsc)}
              title={sortAsc ? "Crescente" : "Decrescente"}
            >
              <ChevronDown
                className={`size-3.5 transition-transform ${sortAsc ? "" : "rotate-180"}`}
              />
            </Button>

            {/* View Toggle */}
            <div className="inline-flex rounded-lg bg-muted p-[3px]">
              <button
                onClick={() => setViewMode("cards")}
                className={`rounded-md p-1 transition-colors ${
                  viewMode === "cards"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`rounded-md p-1 transition-colors ${
                  viewMode === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="size-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
            <CheckSquare className="mb-3 size-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              Nenhuma tarefa encontrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {searchQuery
                ? "Tente alterar os filtros ou termos de busca"
                : "Crie uma nova tarefa para começar"}
            </p>
          </div>
        ) : viewMode === "cards" ? (
          <div className="grid gap-2">
            {filteredAndSorted.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                clientName={getClientName(task.clientId)}
                clientCompany={getClientCompany(task.clientId)}
                isOverdue={isOverdue(task)}
                isTodayTask={isTodayTask(task)}
                onToggleStatus={toggleStatus}
                onEdit={openEditTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="w-8 px-3 py-2" />
                  <th className="px-3 py-2">Tarefa</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Prioridade</th>
                  <th className="px-3 py-2">Vencimento</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="w-20 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    clientName={getClientName(task.clientId)}
                    clientCompany={getClientCompany(task.clientId)}
                    isOverdue={isOverdue(task)}
                    isTodayTask={isTodayTask(task)}
                    onToggleStatus={toggleStatus}
                    onEdit={openEditTask}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Dialog */}
      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        formData={formData}
        setFormData={setFormData}
        editingTask={editingTask}
        clients={clients}
        onSave={handleSave}
        onDelete={() => {
          if (editingTask) {
            deleteTask(editingTask.id);
            setDialogOpen(false);
            setEditingTask(null);
            setFormData(EMPTY_FORM);
          }
        }}
      />
    </div>
    </CRMLayout>
  );
}

function TaskCard({
  task,
  clientName,
  clientCompany,
  isOverdue: overdue,
  isTodayTask: todayTask,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  task: Task;
  clientName: string;
  clientCompany: string;
  isOverdue: boolean;
  isTodayTask: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];
  const isCompleted = task.status === "concluida";

  let dueDateLabel = "";
  let dueDateColor = "text-muted-foreground";
  try {
    const parsed = parseISO(task.dueDate);
    dueDateLabel = format(parsed, "dd MMM yyyy", { locale: ptBR });
    if (overdue) dueDateColor = "text-red-600 dark:text-red-400 font-medium";
    else if (todayTask) dueDateColor = "text-blue-600 dark:text-blue-400 font-medium";
  } catch {
    dueDateLabel = task.dueDate;
  }

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl border bg-card p-3 transition-all hover:shadow-sm ${
        overdue ? "border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-950/10" : ""
      } ${todayTask && !overdue ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/10" : ""} ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      {/* Checkbox */}
      <div className="mt-0.5">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(task)}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={`text-sm font-semibold ${
              isCompleted ? "text-muted-foreground line-through" : "text-foreground"
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              priorityConfig.bg
            } ${priorityConfig.text} ${
              task.priority === "urgente" ? "animate-pulse" : ""
            }`}
          >
            {priorityConfig.label}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {clientName}
            {clientCompany && (
              <span className="text-muted-foreground/60">- {clientCompany}</span>
            )}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="size-3" />
            <span className={dueDateColor}>{dueDateLabel}</span>
            {overdue && <AlertTriangle className="size-3 text-red-500" />}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              STATUS_CONFIG[task.status].variant === "default"
                ? "bg-primary/10 text-primary"
                : STATUS_CONFIG[task.status].variant === "secondary"
                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                : STATUS_CONFIG[task.status].variant === "destructive"
                ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <statusConfig.icon className="size-2.5" />
            {statusConfig.label}
          </span>
        </div>

        {task.description && (
          <p
            className={`mt-1.5 text-xs text-muted-foreground/80 line-clamp-1 ${
              isCompleted ? "line-through" : ""
            }`}
          >
            {task.description}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(task)} title="Editar">
          <Pencil className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onDelete(task.id)}
          title="Excluir"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  clientName,
  clientCompany,
  isOverdue: overdue,
  isTodayTask: todayTask,
  onToggleStatus,
  onEdit,
  onDelete,
}: {
  task: Task;
  clientName: string;
  clientCompany: string;
  isOverdue: boolean;
  isTodayTask: boolean;
  onToggleStatus: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}) {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  const statusConfig = STATUS_CONFIG[task.status];
  const isCompleted = task.status === "concluida";

  let dueDateLabel = "";
  let dueDateColor = "text-muted-foreground";
  try {
    const parsed = parseISO(task.dueDate);
    dueDateLabel = format(parsed, "dd MMM yyyy", { locale: ptBR });
    if (overdue) dueDateColor = "text-red-600 dark:text-red-400 font-medium";
    else if (todayTask) dueDateColor = "text-blue-600 dark:text-blue-400 font-medium";
  } catch {
    dueDateLabel = task.dueDate;
  }

  return (
    <tr
      className={`border-b transition-colors hover:bg-muted/30 ${
        overdue ? "bg-red-50/50 dark:bg-red-950/10" : ""
      } ${todayTask && !overdue ? "bg-blue-50/50 dark:bg-blue-950/10" : ""} ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <td className="px-3 py-2">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggleStatus(task)}
        />
      </td>
      <td className="px-3 py-2">
        <span
          className={`font-medium ${
            isCompleted ? "text-muted-foreground line-through" : ""
          }`}
        >
          {task.title}
        </span>
        {task.description && (
          <p className="mt-0.5 max-w-[300px] truncate text-xs text-muted-foreground/70">
            {task.description}
          </p>
        )}
      </td>
      <td className="px-3 py-2 text-xs text-muted-foreground">
        {clientName}
        {clientCompany && (
          <span className="block text-[10px] text-muted-foreground/60">{clientCompany}</span>
        )}
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            priorityConfig.bg
          } ${priorityConfig.text} ${
            task.priority === "urgente" ? "animate-pulse" : ""
          }`}
        >
          {priorityConfig.label}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className={`flex items-center gap-1 text-xs ${dueDateColor}`}>
          <Calendar className="size-3" />
          {dueDateLabel}
          {overdue && <AlertTriangle className="size-3 text-red-500" />}
        </span>
      </td>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
            statusConfig.variant === "default"
              ? "bg-primary/10 text-primary"
              : statusConfig.variant === "secondary"
              ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
              : statusConfig.variant === "destructive"
              ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <statusConfig.icon className="size-2.5" />
          {statusConfig.label}
        </span>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(task)} title="Editar">
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete(task.id)}
            title="Excluir"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function TaskDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  editingTask,
  clients,
  onSave,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: TaskFormData;
  setFormData: React.Dispatch<React.SetStateAction<TaskFormData>>;
  editingTask: Task | null;
  clients: Client[];
  onSave: () => void;
  onDelete: () => void;
}) {
  const priorities: { value: TaskPriority; label: string }[] = [
    { value: "baixa", label: "Baixa" },
    { value: "media", label: "Média" },
    { value: "alta", label: "Alta" },
    { value: "urgente", label: "Urgente" },
  ];

  const statuses: { value: TaskStatus; label: string }[] = [
    { value: "pendente", label: "Pendente" },
    { value: "em_andamento", label: "Em Andamento" },
    { value: "concluida", label: "Concluída" },
    { value: "cancelada", label: "Cancelada" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingTask ? "Editar Tarefa" : "Nova Tarefa"}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Título <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Ex: Follow-up com cliente..."
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Cliente
            </label>
            <select
              value={formData.clientId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, clientId: e.target.value }))
              }
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
              <label className="text-xs font-medium text-muted-foreground">
                Prioridade
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as TaskPriority,
                  }))
                }
                className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
              >
                {priorities.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: e.target.value as TaskStatus,
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
            <label className="text-xs font-medium text-muted-foreground">
              Data de Vencimento
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              placeholder="Detalhes da tarefa..."
              className="resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:border-ring focus:ring-3 focus:ring-ring/50"
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex w-full items-center justify-between">
            {editingTask ? (
              <Button variant="destructive" size="sm" onClick={onDelete}>
                <Trash2 className="size-3.5" />
                Excluir
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={onSave}>
                <CheckCircle2 className="size-3.5" />
                Salvar
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
