"use client";

import { useState, useEffect } from "react";
import { useCRMStore } from "@/lib/store";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import { Grip, Plus, Calendar, Clock } from "lucide-react";
import type { NegotiationStatus, Client, Temperature } from "@/lib/types";
import { CRMLayout } from "@/components/layout/crm-layout";

const STATUSES: NegotiationStatus[] = [
  "novo_lead",
  "primeiro_contato",
  "em_negociacao",
  "proposta_enviada",
  "follow_up",
  "fechado_ganho",
  "perdido",
];

const STATUS_LABELS: Record<NegotiationStatus, string> = {
  novo_lead: "Novo Lead",
  primeiro_contato: "Primeiro Contato",
  em_negociacao: "Em Negociacao",
  proposta_enviada: "Proposta Enviada",
  follow_up: "Follow-up",
  fechado_ganho: "Fechado - Ganho",
  perdido: "Perdido",
};

const STATUS_DOT_COLORS: Record<NegotiationStatus, string> = {
  novo_lead: "bg-blue-500",
  primeiro_contato: "bg-indigo-500",
  em_negociacao: "bg-yellow-500",
  proposta_enviada: "bg-purple-500",
  follow_up: "bg-orange-500",
  fechado_ganho: "bg-green-500",
  perdido: "bg-red-500",
};

const STATUS_COLUMN_BG: Record<NegotiationStatus, string> = {
  novo_lead: "bg-blue-50/80 dark:bg-blue-950/20",
  primeiro_contato: "bg-indigo-50/80 dark:bg-indigo-950/20",
  em_negociacao: "bg-yellow-50/80 dark:bg-yellow-950/20",
  proposta_enviada: "bg-purple-50/80 dark:bg-purple-950/20",
  follow_up: "bg-orange-50/80 dark:bg-orange-950/20",
  fechado_ganho: "bg-green-50/80 dark:bg-green-950/20",
  perdido: "bg-red-50/80 dark:bg-red-950/20",
};

const TEMP_EMOJI: Record<Temperature, string> = {
  quente: "\uD83D\uDD25",
  morno: "\uD83D\uDFE1",
  frio: "\uD83D\uDD35",
  perdido: "\u26AB",
};

const TEMP_BORDER: Record<Temperature, string> = {
  quente: "border-l-red-500",
  morno: "border-l-yellow-500",
  frio: "border-l-blue-500",
  perdido: "border-l-gray-400",
};

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function ClientCard({ client, index }: { client: Client; index: number }) {
  const daysSinceLastContact = client.lastContactDate
    ? formatDistanceToNow(new Date(client.lastContactDate), {
        locale: ptBR,
        addSuffix: false,
      })
    : null;

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all dark:border-gray-800 dark:bg-gray-900 ${
            snapshot.isDragging ? "rotate-2 shadow-lg" : ""
          } border-l-[3px] ${TEMP_BORDER[client.temperature]}`}
        >
          <div className="mb-1 flex items-start justify-between">
            <h4 className="text-sm font-semibold leading-tight text-gray-900 dark:text-gray-100">
              {client.name}
            </h4>
            <span
              {...provided.dragHandleProps}
              className="mt-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <Grip className="h-3.5 w-3.5" />
            </span>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {client.company}
          </p>

          {client.productOfInterest && (
            <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-300">
              {client.productOfInterest}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              {formatCurrency(client.estimatedValue)}
            </span>
            <span className="text-base" title={client.temperature}>
              {TEMP_EMOJI[client.temperature]}
            </span>
          </div>

          <div className="mt-2 flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
            {daysSinceLastContact && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Ha {daysSinceLastContact}</span>
              </div>
            )}
            {client.nextContactDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>
                  {format(new Date(client.nextContactDate), "dd/MM/yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function PipelinePage() {
  const clients = useCRMStore((s) => s.clients);
  const updateClient = useCRMStore((s) => s.updateClient);

  const [mounted, setMounted] = useState(false);
  const [clientOrder, setClientOrder] = useState<Record<string, string[]>>(
    {}
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const grouped: Record<string, string[]> = {};
    for (const s of STATUSES) grouped[s] = [];
    for (const c of clients) {
      if (!grouped[c.status]) grouped[c.status] = [];
      grouped[c.status].push(c.id);
    }
    setClientOrder(grouped);
  }, [clients, mounted]);

  function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const newStatus = destination.droppableId as NegotiationStatus;
    const client = clients.find((c) => c.id === draggableId);
    if (!client) return;

    setClientOrder((prev) => {
      const next = { ...prev };
      const srcCol = [...(next[source.droppableId] || [])];
      const destCol =
        source.droppableId === destination.droppableId
          ? srcCol
          : [...(next[destination.droppableId] || [])];

      srcCol.splice(source.index, 1);
      destCol.splice(destination.index, 0, draggableId);

      next[source.droppableId] = srcCol;
      next[destination.droppableId] = destCol;
      return next;
    });

    if (client.status !== newStatus) {
      updateClient(draggableId, { status: newStatus });
    }
  }

  const totalValue = clients
    .filter((c) => c.status !== "fechado_ganho" && c.status !== "perdido")
    .reduce((sum, c) => sum + c.estimatedValue * (c.probability / 100), 0);

  const getClientById = (id: string) => clients.find((c) => c.id === id)!;

  const columnTotals: Record<string, number> = {};
  for (const s of STATUSES) {
    const ids = clientOrder[s] || [];
    columnTotals[s] = ids.reduce((sum, id) => {
      const c = getClientById(id);
      return c ? sum + c.estimatedValue : sum;
    }, 0);
  }

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
            Pipeline de Vendas
          </h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            Valor total do pipeline:{" "}
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {formatCurrency(totalValue)}
            </span>
          </p>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto px-6 pb-6">
          <div className="flex gap-4 py-2" style={{ minWidth: "min-content" }}>
            {STATUSES.map((status) => {
              const ids = clientOrder[status] || [];
              const total = columnTotals[status] || 0;

              return (
                <div
                  key={status}
                  className={`flex w-[290px] min-w-[280px] max-w-[320px] flex-shrink-0 flex-col rounded-xl ${STATUS_COLUMN_BG[status]} border border-gray-200 dark:border-gray-800`}
                >
                  <div className="flex items-center justify-between px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_COLORS[status]}`}
                      />
                      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {STATUS_LABELS[status]}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-gray-200/80 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700/80 dark:text-gray-300">
                        {ids.length}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  <Droppable droppableId={status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2 transition-colors ${
                          snapshot.isDraggingOver
                            ? "bg-gray-100/50 dark:bg-gray-800/30"
                            : ""
                        }`}
                        style={{ minHeight: 60 }}
                      >
                        {ids.map((id, index) => {
                          const client = getClientById(id);
                          if (!client) return null;
                          return (
                            <ClientCard
                              key={client.id}
                              client={client}
                              index={index}
                            />
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>

                  {status === "novo_lead" && (
                    <div className="px-2 pb-3">
                      <a
                        href="/clientes"
                        className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-medium text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Adicionar cliente
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
    </CRMLayout>
  );
}
