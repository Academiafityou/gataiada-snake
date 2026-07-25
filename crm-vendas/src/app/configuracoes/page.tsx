"use client";

import { useState, useEffect, useCallback } from "react";
import { useCRMStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Settings,
  User,
  Palette,
  Bell,
  BrainCircuit,
  Database,
  Save,
  Eye,
  EyeOff,
  Download,
  Trash2,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CRMLayout } from "@/components/layout/crm-layout";

function useHydrated() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function Toggle({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-input"
      )}
    >
      <span
        className={cn(
          "pointer-events-none block size-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ConfiguracoesPage() {
  const mounted = useHydrated();
  const { currentUser, theme, toggleTheme } = useCRMStore();

  const [activeTab, setActiveTab] = useState("perfil");

  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileRole, setProfileRole] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);

  const [language, setLanguage] = useState("pt-br");
  const [currency, setCurrency] = useState("BRL");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [notifFollowup, setNotifFollowup] = useState(true);
  const [notifContatoHoje, setNotifContatoHoje] = useState(true);
  const [notifClienteParado, setNotifClienteParado] = useState(true);
  const [notifPropostaRetorno, setNotifPropostaRetorno] = useState(true);
  const [notifLeadEsfriando, setNotifLeadEsfriando] = useState(true);
  const [notifFrequency, setNotifFrequency] = useState("diario");
  const [notifTime, setNotifTime] = useState("09:00");
  const [notifSaved, setNotifSaved] = useState(false);

  const [aiApiKey, setAiApiKey] = useState("sk-****-****-****-a3f2");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [aiTemperature, setAiTemperature] = useState(0.7);
  const [aiPrompt, setAiPrompt] = useState(
    "Você é um assistente de vendas especializado em CRM. Analise as interações e sugira próximas ações estratégicas."
  );
  const [aiKeyVisible, setAiKeyVisible] = useState(false);
  const [aiTesting, setAiTesting] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<"success" | "error" | null>(null);
  const [aiSaved, setAiSaved] = useState(false);

  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (mounted) {
      setProfileName(currentUser.name);
      setProfileEmail(currentUser.email);
      setProfileRole(currentUser.role);
    }
  }, [mounted, currentUser]);

  const handleProfileSave = useCallback(() => {
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  }, []);

  const handlePrefsSave = useCallback(() => {
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2000);
  }, []);

  const handleNotifSave = useCallback(() => {
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  }, []);

  const handleAiSave = useCallback(() => {
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 2000);
  }, []);

  const handleAiTest = useCallback(() => {
    setAiTesting(true);
    setAiTestResult(null);
    setTimeout(() => {
      setAiTesting(false);
      setAiTestResult("success");
      setTimeout(() => setAiTestResult(null), 3000);
    }, 2000);
  }, []);

  const handleClearData = useCallback(() => {
    setClearing(true);
    setTimeout(() => {
      setClearing(false);
      setClearDialogOpen(false);
    }, 1500);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <CRMLayout>
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Settings className="size-5 text-muted-foreground" />
        <div>
          <h1 className="text-lg font-semibold">Configurações</h1>
          <p className="text-xs text-muted-foreground">
            Gerencie seu perfil, preferências e integrações
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="perfil" className="gap-1.5">
            <User className="size-3.5" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-1.5">
            <Palette className="size-3.5" />
            Preferências
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5">
            <Bell className="size-3.5" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="ia" className="gap-1.5">
            <BrainCircuit className="size-3.5" />
            IA
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <Database className="size-3.5" />
            Dados
          </TabsTrigger>
        </TabsList>

        {/* ============ TAB: PERFIL ============ */}
        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Perfil</CardTitle>
              <CardDescription>Informações pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar size="lg" className="size-16">
                  <AvatarFallback className="text-lg">
                    {getInitials(profileName || currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{profileName || currentUser.name}</p>
                  <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Alterar avatar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nome completo</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Seu nome"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="seu@email.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  <Input
                    value={profileRole}
                    onChange={(e) => setProfileRole(e.target.value)}
                    placeholder="Seu cargo"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleProfileSave}>
                  <Save className="size-3.5" />
                  Salvar
                </Button>
                {profileSaved && (
                  <Badge variant="secondary" className="gap-1 text-emerald-600">
                    <CheckCircle2 className="size-3" />
                    Salvo
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TAB: PREFERÊNCIAS ============ */}
        <TabsContent value="preferencias">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>Personalize a aparência do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Tema</Label>
                    <p className="text-xs text-muted-foreground">
                      Escolha entre o tema claro ou escuro
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Sun className="size-4" />
                    </span>
                    <Toggle checked={theme === "dark"} onCheckedChange={toggleTheme} />
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Moon className="size-4" />
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional</CardTitle>
                <CardDescription>Idioma, moeda e fuso horário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Idioma</Label>
                    <Select value={language} onValueChange={(v) => v && setLanguage(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Formato de moeda</Label>
                    <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fuso horário</Label>
                    <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Sao_Paulo">São Paulo (GMT-3)</SelectItem>
                        <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                        <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                        <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Canais de Notificação</CardTitle>
                <CardDescription>Como deseja receber notificações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações push</Label>
                    <p className="text-xs text-muted-foreground">
                      Receba notificações no navegador
                    </p>
                  </div>
                  <Toggle
                    checked={pushNotifications}
                    onCheckedChange={setPushNotifications}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Notificações por e-mail</Label>
                    <p className="text-xs text-muted-foreground">
                      Receba resumos e alertas por e-mail
                    </p>
                  </div>
                  <Toggle
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrefsSave}>
                <Save className="size-3.5" />
                Salvar preferências
              </Button>
              {prefsSaved && (
                <Badge variant="secondary" className="gap-1 text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Salvo
                </Badge>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: NOTIFICAÇÕES ============ */}
        <TabsContent value="notificacoes">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Notificação</CardTitle>
                <CardDescription>
                  Escolha quais alertas deseja receber
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    label: "Follow-up vencido",
                    desc: "Alerta quando um follow-up estiver atrasado",
                    checked: notifFollowup,
                    onChange: setNotifFollowup,
                  },
                  {
                    label: "Contato para hoje",
                    desc: "Lembrete de contatos agendados para o dia",
                    checked: notifContatoHoje,
                    onChange: setNotifContatoHoje,
                  },
                  {
                    label: "Cliente parado há muitos dias",
                    desc: "Alerta de clientes sem interação prolongada",
                    checked: notifClienteParado,
                    onChange: setNotifClienteParado,
                  },
                  {
                    label: "Proposta sem retorno",
                    desc: "Aviso quando proposta não recebe resposta",
                    checked: notifPropostaRetorno,
                    onChange: setNotifPropostaRetorno,
                  },
                  {
                    label: "Lead esfriando",
                    desc: "Alerta de leads perdendo temperatura",
                    checked: notifLeadEsfriando,
                    onChange: setNotifLeadEsfriando,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Toggle checked={item.checked} onCheckedChange={item.onChange} />
                    </div>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo e Horário</CardTitle>
                <CardDescription>Configure a frequência dos resumos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Frequência de resumo</Label>
                    <Select value={notifFrequency} onValueChange={(v) => v && setNotifFrequency(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diario">Diário</SelectItem>
                        <SelectItem value="semanal">Semanal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Horário preferido</Label>
                    <Input
                      type="time"
                      value={notifTime}
                      onChange={(e) => setNotifTime(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleNotifSave}>
                <Save className="size-3.5" />
                Salvar notificações
              </Button>
              {notifSaved && (
                <Badge variant="secondary" className="gap-1 text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Salvo
                </Badge>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: IA ============ */}
        <TabsContent value="ia">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-primary" />
                  Integração com IA
                </CardTitle>
                <CardDescription>Configure a inteligência artificial para análises</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3 rounded-lg border bg-emerald-50 p-3 dark:bg-emerald-950/20">
                  <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <Sparkles className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                      Integração ativa
                    </p>
                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70">
                      Conectado ao modelo {aiModel}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                    Simulado
                  </Badge>
                </div>

                <div className="space-y-1.5">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={aiKeyVisible ? "text" : "password"}
                        value={aiApiKey}
                        onChange={(e) => setAiApiKey(e.target.value)}
                        className="pr-9 font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setAiKeyVisible(!aiKeyVisible)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {aiKeyVisible ? (
                          <EyeOff className="size-3.5" />
                        ) : (
                          <Eye className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Nunca compartilhe sua chave de API com terceiros
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Modelo selecionado</Label>
                    <Select value={aiModel} onValueChange={(v) => v && setAiModel(v)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                        <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Temperatura: {aiTemperature.toFixed(1)}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={aiTemperature}
                      onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                      className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
                    />
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Preciso</span>
                      <span>Criativo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Prompt personalizado</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={4}
                    placeholder="Instruções personalizadas para a IA..."
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Define o comportamento da IA nas análises de vendas
                  </p>
                </div>

                <Separator />

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAiTest}
                    disabled={aiTesting}
                  >
                    {aiTesting ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    {aiTesting ? "Testando..." : "Testar IA"}
                  </Button>
                  {aiTestResult === "success" && (
                    <Badge variant="secondary" className="gap-1 text-emerald-600">
                      <CheckCircle2 className="size-3" />
                      Conexão OK
                    </Badge>
                  )}
                  {aiTestResult === "error" && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="size-3" />
                      Falha na conexão
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleAiSave}>
                <Save className="size-3.5" />
                Salvar configurações IA
              </Button>
              {aiSaved && (
                <Badge variant="secondary" className="gap-1 text-emerald-600">
                  <CheckCircle2 className="size-3" />
                  Salvo
                </Badge>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ============ TAB: DADOS ============ */}
        <TabsContent value="dados">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Exportar Dados</CardTitle>
                <CardDescription>
                  Baixe uma cópia de todos os seus dados do CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Exportar em JSON</p>
                    <p className="text-xs text-muted-foreground">
                      Inclui clientes, conversas, tarefas e configurações
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="size-3.5" />
                    Exportar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Importar Dados</CardTitle>
                <CardDescription>
                  Importe dados de um backup ou sistema externo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Importar arquivo JSON</p>
                    <p className="text-xs text-muted-foreground">
                      Os dados serão adicionados aos registros existentes
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Upload className="size-3.5" />
                    Importar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                <CardDescription>
                  Ações irreversíveis que afetam permanentemente seus dados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Limpar todos os dados</p>
                    <p className="text-xs text-muted-foreground">
                      Remove permanentemente todos os clientes, conversas e tarefas
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setClearDialogOpen(true)}
                  >
                    <Trash2 className="size-3.5" />
                    Limpar dados
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" />
              Limpar todos os dados?
            </DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os seus clientes, conversas, tarefas e
              notificações serão permanentemente removidos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <div className="flex w-full items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setClearDialogOpen(false)}
                disabled={clearing}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleClearData}
                disabled={clearing}
              >
                {clearing ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Limpando...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-3.5" />
                    Sim, limpar tudo
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </CRMLayout>
  );
}
