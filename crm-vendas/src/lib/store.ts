import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Client,
  Conversation,
  Task,
  Notification,
  CalendarEvent,
  User,
  NegotiationStatus,
  Temperature,
  TaskStatus,
  TaskPriority,
  NotificationType,
  ContactChannel,
  EventType,
} from "./types";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

const DEMO_USERS: User[] = [
  {
    id: "user-1",
    name: "Carlos Silva",
    email: "carlos@empresa.com.br",
    avatar: "",
    role: "gerente",
  },
  {
    id: "user-2",
    name: "Ana Oliveira",
    email: "ana@empresa.com.br",
    avatar: "",
    role: "vendedor",
  },
  {
    id: "user-3",
    name: "Pedro Santos",
    email: "pedro@empresa.com.br",
    avatar: "",
    role: "vendedor",
  },
];

const DEMO_CLIENTS: Client[] = [
  {
    id: "cli-1",
    name: "Marcos Ferreira",
    company: "TechBR Soluções",
    position: "Diretor de TI",
    phone: "(11) 99876-5432",
    whatsapp: "(11) 99876-5432",
    email: "marcos.ferreira@techbr.com.br",
    city: "São Paulo",
    state: "SP",
    leadSource: "indicacao",
    productOfInterest: "Plano Enterprise",
    estimatedValue: 48000,
    status: "fechado_ganho",
    temperature: "quente",
    score: 95,
    probability: 100,
    lastContactDate: daysAgo(2),
    nextContactDate: daysFromNow(30),
    manualNextContact: false,
    responsibleId: "user-1",
    tags: ["enterprise", "ti", "sp"],
    notes: "Fechou contrato anual. Cliente muito satisfeito. Potencial para upsell em Q3.",
    createdAt: daysAgo(45),
    updatedAt: daysAgo(2),
  },
  {
    id: "cli-2",
    name: "Juliana Costa",
    company: "Moda Express",
    position: "Proprietária",
    phone: "(21) 99765-4321",
    whatsapp: "(21) 99765-4321",
    email: "juliana@modaexpress.com.br",
    city: "Rio de Janeiro",
    state: "RJ",
    leadSource: "instagram",
    productOfInterest: "Plano Profissional",
    estimatedValue: 12000,
    status: "proposta_enviada",
    temperature: "quente",
    score: 78,
    probability: 75,
    lastContactDate: daysAgo(1),
    nextContactDate: daysFromNow(1),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["moda", "e-commerce", "rj"],
    notes: "Enviada proposta personalizada. Ela quer integrar com a loja virtual. Segunda-feira decidi.",
    createdAt: daysAgo(20),
    updatedAt: daysAgo(1),
  },
  {
    id: "cli-3",
    name: "Ricardo Mendes",
    company: "Mendes & Associados",
    position: "Sócio-Diretor",
    phone: "(31) 99654-3210",
    whatsapp: "(31) 99654-3210",
    email: "ricardo@mendesassociados.com.br",
    city: "Belo Horizonte",
    state: "MG",
    leadSource: "linkedin",
    productOfInterest: "Plano Básico",
    estimatedValue: 6000,
    status: "em_negociacao",
    temperature: "morno",
    score: 55,
    probability: 50,
    lastContactDate: daysAgo(5),
    nextContactDate: daysFromNow(2),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["advocacia", "mg"],
    notes: "Advogado tradicional, cético com tecnologia. Precisa de demonstração prática.",
    createdAt: daysAgo(30),
    updatedAt: daysAgo(5),
  },
  {
    id: "cli-4",
    name: "Fernanda Lima",
    company: "Saúde Total Clinic",
    position: "Gerente Administrativa",
    phone: "(11) 99543-2109",
    whatsapp: "(11) 99543-2109",
    email: "fernanda@saudetotal.com.br",
    city: "São Paulo",
    state: "SP",
    leadSource: "site",
    productOfInterest: "Plano Profissional",
    estimatedValue: 18000,
    status: "follow_up",
    temperature: "quente",
    score: 82,
    probability: 70,
    lastContactDate: daysAgo(3),
    nextContactDate: daysFromNow(1),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["saúde", "clínica", "sp"],
    notes: "Clínica com 5 unidades. Quer sistema para agendamento e gestão. Comparando com concorrente.",
    createdAt: daysAgo(25),
    updatedAt: daysAgo(3),
  },
  {
    id: "cli-5",
    name: "Roberto Almeida",
    company: "Almeida Construtora",
    position: "Presidente",
    phone: "(41) 99432-1098",
    whatsapp: "(41) 99432-1098",
    email: "roberto@almeidaconstrutora.com.br",
    city: "Curitiba",
    state: "PR",
    leadSource: "evento",
    productOfInterest: "Plano Enterprise",
    estimatedValue: 36000,
    status: "primeiro_contato",
    temperature: "morno",
    score: 40,
    probability: 30,
    lastContactDate: daysAgo(10),
    nextContactDate: daysFromNow(3),
    manualNextContact: false,
    responsibleId: "user-3",
    tags: ["construção", "pr"],
    notes: "Encontrado no evento de construção civil. Interessado mas precisa validar orçamento com sócios.",
    createdAt: daysAgo(12),
    updatedAt: daysAgo(10),
  },
  {
    id: "cli-6",
    name: "Patrícia Souza",
    company: "Pet Love Shop",
    position: "Proprietária",
    phone: "(11) 99321-0987",
    whatsapp: "(11) 99321-0987",
    email: "patricia@petloveshop.com.br",
    city: "Campinas",
    state: "SP",
    leadSource: "google_ads",
    productOfInterest: "Plano Básico",
    estimatedValue: 4800,
    status: "novo_lead",
    temperature: "frio",
    score: 25,
    probability: 15,
    lastContactDate: "",
    nextContactDate: daysFromNow(1),
    manualNextContact: false,
    responsibleId: "user-3",
    tags: ["pet", "varejo", "sp"],
    notes: "Lead novo do Google Ads. Pet shop com 2 filiais. Primeiro contato ainda não realizado.",
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
  {
    id: "cli-7",
    name: "Lucas Barbosa",
    company: "Barbosa Transportes",
    position: "Diretor Comercial",
    phone: "(71) 99210-9876",
    whatsapp: "(71) 99210-9876",
    email: "lucas@barbosatransportes.com.br",
    city: "Salvador",
    state: "BA",
    leadSource: "indicacao",
    productOfInterest: "Plano Enterprise",
    estimatedValue: 54000,
    status: "em_negociacao",
    temperature: "quente",
    score: 72,
    probability: 65,
    lastContactDate: daysAgo(2),
    nextContactDate: daysFromNow(1),
    manualNextContact: false,
    responsibleId: "user-1",
    tags: ["transporte", "enterprise", "ba"],
    notes: "Indicado pelo Marcos (cli-1). Frota de 200+ veículos. Quer rastreamento e gestão integrada.",
    createdAt: daysAgo(18),
    updatedAt: daysAgo(2),
  },
  {
    id: "cli-8",
    name: "Amanda Ribeiro",
    company: "Escola Futuro",
    position: "Diretora Pedagógica",
    phone: "(85) 99109-8765",
    whatsapp: "(85) 99109-8765",
    email: "amanda@escolafuturo.com.br",
    city: "Fortaleza",
    state: "CE",
    leadSource: "ligacao_fria",
    productOfInterest: "Plano Profissional",
    estimatedValue: 9600,
    status: "perdido",
    temperature: "perdido",
    score: 10,
    probability: 0,
    lastContactDate: daysAgo(20),
    nextContactDate: "",
    manualNextContact: false,
    responsibleId: "user-3",
    tags: ["educação", "ce"],
    notes: "Perdeu para concorrente que ofereceu desconto agressivo. Manter contato para possível reverte.",
    createdAt: daysAgo(60),
    updatedAt: daysAgo(20),
  },
  {
    id: "cli-9",
    name: "Gustavo Nascimento",
    company: "Nascimento Advocacia",
    position: "Advogado",
    phone: "(61) 99098-7654",
    whatsapp: "(61) 99098-7654",
    email: "gustavo@nascimentoadv.com.br",
    city: "Brasília",
    state: "DF",
    leadSource: "linkedin",
    productOfInterest: "Plano Básico",
    estimatedValue: 7200,
    status: "primeiro_contato",
    temperature: "frio",
    score: 30,
    probability: 20,
    lastContactDate: daysAgo(8),
    nextContactDate: daysFromNow(5),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["advocacia", "df"],
    notes: "Advogado independente. Busca organização de processos e prazos. Retornar na semana que vem.",
    createdAt: daysAgo(15),
    updatedAt: daysAgo(8),
  },
  {
    id: "cli-10",
    name: "Camila Ferreira",
    company: "Studio Criativo",
    position: "CEO",
    phone: "(48) 98987-6543",
    whatsapp: "(48) 98987-6543",
    email: "camila@studiocriativo.com.br",
    city: "Florianópolis",
    state: "SC",
    leadSource: "instagram",
    productOfInterest: "Plano Profissional",
    estimatedValue: 14400,
    status: "proposta_enviada",
    temperature: "quente",
    score: 85,
    probability: 80,
    lastContactDate: daysAgo(1),
    nextContactDate: daysFromNow(2),
    manualNextContact: false,
    responsibleId: "user-1",
    tags: ["marketing", "criativo", "sc"],
    notes: "Proposta enviada com desconto de 15% para pagamento anual. Muito empolgada com a proposta.",
    createdAt: daysAgo(14),
    updatedAt: daysAgo(1),
  },
  {
    id: "cli-11",
    name: "Bruno Oliveira",
    company: "Oliveira Auto Peças",
    position: "Proprietário",
    phone: "(19) 98876-5432",
    whatsapp: "(19) 98876-5432",
    email: "bruno@oliveiraautopecas.com.br",
    city: "Campinas",
    state: "SP",
    leadSource: "evento",
    productOfInterest: "Plano Básico",
    estimatedValue: 3600,
    status: "novo_lead",
    temperature: "frio",
    score: 20,
    probability: 10,
    lastContactDate: "",
    nextContactDate: daysFromNow(2),
    manualNextContact: false,
    responsibleId: "user-3",
    tags: ["automotivo", "varejo", "sp"],
    notes: "Encontrado na feira de auto peças. Trocou cartão mas não respondeu mensagens ainda.",
    createdAt: daysAgo(7),
    updatedAt: daysAgo(7),
  },
  {
    id: "cli-12",
    name: "Tatiane Martins",
    company: "Clínica Bem Estar",
    position: "Proprietária",
    phone: "(81) 98765-4321",
    whatsapp: "(81) 98765-4321",
    email: "tatiane@bemestar.com.br",
    city: "Recife",
    state: "PE",
    leadSource: "indicacao",
    productOfInterest: "Plano Profissional",
    estimatedValue: 10800,
    status: "follow_up",
    temperature: "morno",
    score: 60,
    probability: 55,
    lastContactDate: daysAgo(7),
    nextContactDate: daysAgo(2),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["saúde", "pe"],
    notes: "Enviou proposta há uma semana. Ela disse que ia consultar com o marido. Follow-up atrasado.",
    createdAt: daysAgo(22),
    updatedAt: daysAgo(7),
  },
  {
    id: "cli-13",
    name: "Eduardo Vieira",
    company: "Vieira Contabilidade",
    position: "Sócio",
    phone: "(51) 98654-3210",
    whatsapp: "(51) 98654-3210",
    email: "eduardo@vieiracontabilidade.com.br",
    city: "Porto Alegre",
    state: "RS",
    leadSource: "site",
    productOfInterest: "Plano Enterprise",
    estimatedValue: 42000,
    status: "em_negociacao",
    temperature: "quente",
    score: 88,
    probability: 85,
    lastContactDate: daysAgo(1),
    nextContactDate: daysFromNow(1),
    manualNextContact: false,
    responsibleId: "user-1",
    tags: ["contabilidade", "enterprise", "rs"],
    notes: "Escritório com 15 contadores. Quer migrar do sistema atual. Demonstração agendada para quarta.",
    createdAt: daysAgo(10),
    updatedAt: daysAgo(1),
  },
  {
    id: "cli-14",
    name: "Mariana Lopes",
    company: "Loja Natural",
    position: "Gerente de Vendas",
    phone: "(47) 98543-2109",
    whatsapp: "(47) 98543-2109",
    email: "mariana@lojanatural.com.br",
    city: "Joinville",
    state: "SC",
    leadSource: "google_ads",
    productOfInterest: "Plano Básico",
    estimatedValue: 5400,
    status: "fechado_ganho",
    temperature: "quente",
    score: 100,
    probability: 100,
    lastContactDate: daysAgo(15),
    nextContactDate: daysFromNow(60),
    manualNextContact: false,
    responsibleId: "user-3",
    tags: ["alimentação", "varejo", "sc"],
    notes: "Contrato assinado. Loja de produtos naturais com 3 filiais. Implementação concluída.",
    createdAt: daysAgo(90),
    updatedAt: daysAgo(15),
  },
  {
    id: "cli-15",
    name: "Thiago Santos",
    company: "Santos Fitness",
    position: "Proprietário",
    phone: "(31) 98432-1098",
    whatsapp: "(31) 98432-1098",
    email: "thiago@santosfitness.com.br",
    city: "Belo Horizonte",
    state: "MG",
    leadSource: "instagram",
    productOfInterest: "Plano Profissional",
    estimatedValue: 8400,
    status: "novo_lead",
    temperature: "morno",
    score: 35,
    probability: 25,
    lastContactDate: "",
    nextContactDate: daysFromNow(3),
    manualNextContact: false,
    responsibleId: "user-2",
    tags: ["fitness", "academia", "mg"],
    notes: "Rede de academias com 4 unidades. Interesse em gestão de alunos e agenda. Aguardando primeiro contato.",
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
  },
];

const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: "conv-1",
    clientId: "cli-1",
    date: daysAgo(2),
    time: "14:30",
    channel: "reuniao",
    summary: "Reunião de fechamento. Marcos confirmou contrato anual Enterprise. Ajustes finais feitos no escopo.",
    objections: "Nenhuma objeção restante. Apenas pediu ajuste no SLA.",
    needs: "Integração com ERP Oracle, suporte 24/7, treinamento para 50 usuários.",
    nextSteps: "Enviar contrato finalizado. Agendar kickoff para semana que vem.",
    responsible: "user-1",
    attachments: ["proposta_final.pdf"],
    aiAnalysis: {
      summary: "Reunião extremamente produtiva. Cliente confiante e comprometido.",
      nextAction: "Enviar contrato e agendar kickoff",
      suggestedDate: daysFromNow(3),
      mentalTriggers: ["escassez de tempo", "ROI comprovado", "caso de sucesso similar"],
      salesTechniques: ["prova social", "urgência controlada"],
      probableObjections: [],
      suggestedMessages: [],
      sentiment: "positivo",
      purchaseIntent: "alto",
      closingChance: 100,
      upsellOpportunities: ["módulo de BI", "treinamento avançado"],
    },
    createdAt: daysAgo(2),
  },
  {
    id: "conv-2",
    clientId: "cli-2",
    date: daysAgo(1),
    time: "10:00",
    channel: "whatsapp",
    summary: "Enviei a proposta personalizada para a Moda Express. Juliana pediu tempo para analisar com o marido.",
    objections: "Preço um pouco acima do orçamento. Precisa validar com sócio.",
    needs: "Integração com Shopify, controle de estoque multi-loja, relatórios de vendas.",
    nextSteps: "Follow-up segunda-feira pelas 10h. Enviar cases de clientes do segmento de moda.",
    responsible: "user-2",
    attachments: ["proposta_moda_express.pdf"],
    aiAnalysis: {
      summary: "Cliente interessada mas precisa de validação interna. Enviar reforço.",
      nextAction: "Enviar cases de sucesso do segmento moda",
      suggestedDate: daysFromNow(1),
      mentalTriggers: ["FOMO de concorrência", "cases similares", "sucesso comprovado"],
      salesTechniques: ["ancoragem de valor", "prova social"],
      probableObjections: ["preço", "migração de dados", "tempo de implementação"],
      suggestedMessages: [
        "Juliana, separei alguns cases de lojas de moda que aumentaram 40% a eficiência com nosso sistema!",
      ],
      sentiment: "neutro",
      purchaseIntent: "medio",
      closingChance: 75,
      upsellOpportunities: ["módulo de e-commerce", "integração com marketplace"],
    },
    createdAt: daysAgo(1),
  },
  {
    id: "conv-3",
    clientId: "cli-4",
    date: daysAgo(3),
    time: "15:00",
    channel: "ligacao",
    summary: "Ligação de follow-up. Fernanda confirmou que vai apresentar a proposta para a diretora clínica.",
    objections: "Concorrente ofereceu preço 20% menor. Mas nosso sistema é mais completo.",
    needs: "Sistema integrado de agendamento, prontuário digital, faturamento com convênios.",
    nextSteps: "Enviar material comparativo. Agendar demonstração com a diretora clínica.",
    responsible: "user-2",
    attachments: [],
    aiAnalysis: {
      summary: "Competição acirrada com concorrente. Precisa de differentiação clara.",
      nextAction: "Preparar material comparativo detalhado",
      suggestedDate: daysFromNow(1),
      mentalTriggers: ["dor da perda de pacientes", "qualidade superior", "suporte especializado"],
      salesTechniques: ["comparação direta", "demonstração de valor"],
      probableObjections: ["preço", "complexidade da migração"],
      suggestedMessages: [
        "Fernanda, separei uma comparação detalhada mostrando como nosso sistema resolve X pontos que o concorrente não cobre.",
      ],
      sentiment: "neutro",
      purchaseIntent: "medio",
      closingChance: 70,
      upsellOpportunities: ["módulo de telemedicina", "app para pacientes"],
    },
    createdAt: daysAgo(3),
  },
  {
    id: "conv-4",
    clientId: "cli-7",
    date: daysAgo(2),
    time: "09:30",
    channel: "reuniao",
    summary: "Reunião presencial na sede da Barbosa Transportes. Demonstração do sistema de rastreamento.",
    objections: "Preocupação com integração ao sistema atual de frota.",
    needs: "Rastreamento em tempo real, gestão de manutenção, controle de motoristas.",
    nextSteps: "Proposta técnica e comercial até sexta-feira.",
    responsible: "user-1",
    attachments: ["demo_rastreamento.mp4"],
    aiAnalysis: {
      summary: "Demonstração muito bem recebida. Cliente impressionado com funcionalidades.",
      nextAction: "Enviar proposta técnica e comercial completa",
      suggestedDate: daysFromNow(2),
      mentalTriggers: ["economia de combustível", "segurança da frota", "redução de custos"],
      salesTechniques: ["demonstração ao vivo", "calculadora de ROI"],
      probableObjections: ["prazo de implementação", "custo total do projeto"],
      suggestedMessages: [
        "Lucas, separei os números de ROI para a frota de 200 veículos. Economia estimada de R$ 180 mil/ano.",
      ],
      sentiment: "positivo",
      purchaseIntent: "alto",
      closingChance: 65,
      upsellOpportunities: ["módulo de telemetria", "app motorista", "gestão de cargas"],
    },
    createdAt: daysAgo(2),
  },
  {
    id: "conv-5",
    clientId: "cli-13",
    date: daysAgo(1),
    time: "11:00",
    channel: "reuniao",
    summary: "Reunião online com Eduardo e equipe técnica. Demonstração do módulo contábil.",
    objections: "Dúvidas sobre conformidade com normas da Receita Federal.",
    needs: "Automação de cálculos fiscais, integração com SPED, relatórios para clientes.",
    nextSteps: "Demonstração técnica agendada para quarta-feira com equipe de TI.",
    responsible: "user-1",
    attachments: ["demo_contabil.pdf"],
    aiAnalysis: {
      summary: "Excelente recepção da equipe técnica. Eduardo confia na solução.",
      nextAction: "Demonstração técnica para equipe de TI",
      suggestedDate: daysFromNow(2),
      mentalTriggers: ["conformidade fiscal", "eficiência operacional", "redução de erros"],
      salesTechniques: ["envolvimento técnico", "decisor por influência"],
      probableObjections: ["tempo de migração", "custo de treinamento"],
      suggestedMessages: [],
      sentiment: "positivo",
      purchaseIntent: "alto",
      closingChance: 85,
      upsellOpportunities: ["módulo fiscal avançado", "API para clientes"],
    },
    createdAt: daysAgo(1),
  },
];

const DEMO_TASKS: Task[] = [
  {
    id: "task-1",
    clientId: "cli-2",
    title: "Follow-up proposta Moda Express",
    priority: "alta",
    dueDate: daysFromNow(1),
    status: "pendente",
    description: "Ligar para Juliana na segunda às 10h para verificar decisão sobre proposta.",
  },
  {
    id: "task-2",
    clientId: "cli-4",
    title: "Enviar material comparativo Clínica",
    priority: "media",
    dueDate: daysFromNow(1),
    status: "pendente",
    description: "Preparar e enviar documento comparativo entre nosso sistema e o concorrente.",
  },
  {
    id: "task-3",
    clientId: "cli-7",
    title: "Proposta técnica Barbosa Transportes",
    priority: "urgente",
    dueDate: daysFromNow(2),
    status: "em_andamento",
    description: "Elaborar proposta técnica e comercial para envio até sexta-feira.",
  },
  {
    id: "task-4",
    clientId: "cli-12",
    title: "Follow-up atrasado Clínica Bem Estar",
    priority: "urgente",
    dueDate: daysAgo(2),
    status: "pendente",
    description: "Tatiane não retornou a proposta. Follow-up urgentemente!",
  },
  {
    id: "task-5",
    clientId: "cli-13",
    title: "Demonstração técnica Vieira Contabilidade",
    priority: "alta",
    dueDate: daysFromNow(2),
    status: "pendente",
    description: "Agendar e preparar demonstração do módulo contábil para equipe de TI.",
  },
  {
    id: "task-6",
    clientId: "cli-10",
    title: "Confirmar recebimento proposta Studio Criativo",
    priority: "media",
    dueDate: daysFromNow(2),
    status: "pendente",
    description: "Ligar para Camila para confirmar que recebeu a proposta e esclarecer dúvidas.",
  },
  {
    id: "task-7",
    clientId: "cli-3",
    title: "Demonstração prática Mendes Advocacia",
    priority: "media",
    dueDate: daysFromNow(5),
    status: "pendente",
    description: "Agendar demo presencial ou online. Ricardo precisa ver o sistema funcionando.",
  },
  {
    id: "task-8",
    clientId: "cli-1",
    title: "Kickoff contrato Enterprise TechBR",
    priority: "alta",
    dueDate: daysFromNow(5),
    status: "pendente",
    description: "Preparar cronograma de implementação e agendar kickoff com Marcos.",
  },
  {
    id: "task-9",
    clientId: "cli-6",
    title: "Primeiro contato Pet Love Shop",
    priority: "media",
    dueDate: daysFromNow(1),
    status: "pendente",
    description: "Ligar para Patrícia. Lead novo do Google Ads. Apresentar solução.",
  },
  {
    id: "task-10",
    clientId: "cli-5",
    title: "Reengajar Roberta Almeida Construtora",
    priority: "baixa",
    dueDate: daysFromNow(7),
    status: "pendente",
    description: "Roberto sumiu há 10 dias. Enviar mensagem de reengajamento.",
  },
];

const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    type: "followup_vencido",
    title: "Follow-up atrasado!",
    message: "Tatiane Martins (Clínica Bem Estar) está aguardando retorno há 2 dias.",
    clientId: "cli-12",
    read: false,
    createdAt: daysAgo(2),
  },
  {
    id: "notif-2",
    type: "contato_hoje",
    title: "Contato agendado para hoje",
    message: "Juliana Costa (Moda Express) - Follow-up sobre proposta.",
    clientId: "cli-2",
    read: false,
    createdAt: today(),
  },
  {
    id: "notif-3",
    type: "lead_esfriando",
    title: "Lead esfriando!",
    message: "Roberto Almeida (Almeida Construtora) sem contato há 10 dias.",
    clientId: "cli-5",
    read: false,
    createdAt: daysAgo(10),
  },
  {
    id: "notif-4",
    type: "proposta_sem_retorno",
    title: "Proposta sem resposta",
    message: "Amanda Ribeiro (Escola Futuro) não retornou a proposta há 20 dias.",
    clientId: "cli-8",
    read: true,
    createdAt: daysAgo(20),
  },
  {
    id: "notif-5",
    type: "contato_hoje",
    title: "Demonstração agendada",
    message: "Eduardo Vieira (Vieira Contabilidade) - Demo técnica amanhã.",
    clientId: "cli-13",
    read: false,
    createdAt: today(),
  },
  {
    id: "notif-6",
    type: "followup_vencido",
    title: "Follow-up pendente",
    message: "Lucas Barbosa (Barbosa Transportes) aguarda proposta técnica.",
    clientId: "cli-7",
    read: false,
    createdAt: daysAgo(1),
  },
];

const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "evt-1",
    clientId: "cli-2",
    title: "Follow-up - Moda Express",
    type: "ligacao",
    date: daysFromNow(1),
    startTime: "10:00",
    endTime: "10:30",
    description: "Ligar para Juliana verificar decisão da proposta.",
    status: "agendado",
  },
  {
    id: "evt-2",
    clientId: "cli-13",
    title: "Demo técnica - Vieira Contabilidade",
    type: "reuniao",
    date: daysFromNow(2),
    startTime: "14:00",
    endTime: "15:30",
    description: "Demonstração do módulo contábil para equipe de TI.",
    status: "agendado",
  },
  {
    id: "evt-3",
    clientId: "cli-7",
    title: "Reunião - Barbosa Transportes",
    type: "reuniao",
    date: daysFromNow(3),
    startTime: "09:00",
    endTime: "10:30",
    description: "Apresentação da proposta técnica e comercial.",
    status: "agendado",
  },
  {
    id: "evt-4",
    clientId: "cli-1",
    title: "Kickoff - TechBR Soluções",
    type: "reuniao",
    date: daysFromNow(5),
    startTime: "14:00",
    endTime: "16:00",
    description: "Kickoff do contrato Enterprise. Apresentar cronograma de implementação.",
    status: "agendado",
  },
  {
    id: "evt-5",
    clientId: "cli-6",
    title: "Primeiro contato - Pet Love Shop",
    type: "ligacao",
    date: daysFromNow(1),
    startTime: "11:00",
    endTime: "11:30",
    description: "Ligar para Patrícia apresentar a solução.",
    status: "agendado",
  },
  {
    id: "evt-6",
    clientId: "cli-3",
    title: "Demonstração - Mendes Advocacia",
    type: "reuniao",
    date: daysFromNow(5),
    startTime: "10:00",
    endTime: "11:30",
    description: "Demo presencial do sistema para Ricardo.",
    status: "agendado",
  },
  {
    id: "evt-7",
    clientId: "cli-4",
    title: "Reunião diretora - Saúde Total",
    type: "reuniao",
    date: daysFromNow(2),
    startTime: "16:00",
    endTime: "17:00",
    description: "Apresentar proposta para diretora clínica.",
    status: "agendado",
  },
];

export interface CRMState {
  clients: Client[];
  conversations: Conversation[];
  tasks: Task[];
  notifications: Notification[];
  calendarEvents: CalendarEvent[];
  currentUser: User;
  users: User[];
  theme: "light" | "dark";
  sidebarOpen: boolean;

  addClient: (client: Omit<Client, "id" | "createdAt" | "updatedAt">) => string;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientById: (id: string) => Client | undefined;

  addConversation: (conversation: Omit<Conversation, "id" | "createdAt">) => string;
  getConversationsByClient: (clientId: string) => Conversation[];

  addTask: (task: Omit<Task, "id">) => string;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  getTasksByClient: (clientId: string) => Task[];

  addNotification: (notification: Omit<Notification, "id" | "createdAt">) => string;
  markAsRead: (id: string) => void;
  markAllRead: () => void;
  getUnreadCount: () => number;

  addEvent: (event: Omit<CalendarEvent, "id">) => string;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsByDate: (date: string) => CalendarEvent[];

  toggleTheme: () => void;
  toggleSidebar: () => void;

  getClientsByStatus: (status: NegotiationStatus) => Client[];
  getClientsByTemperature: (temp: Temperature) => Client[];
  getOverdueFollowups: () => Client[];
  getTodayContacts: () => Client[];
  getUpcomingContacts: () => Client[];
  conversionRate: () => number;
  closedSales: () => number;
  totalPipelineValue: () => number;
}

export const useCRMStore = create<CRMState>()(
  persist(
    (set, get) => ({
      clients: DEMO_CLIENTS,
      conversations: DEMO_CONVERSATIONS,
      tasks: DEMO_TASKS,
      notifications: DEMO_NOTIFICATIONS,
      calendarEvents: DEMO_CALENDAR_EVENTS,
      currentUser: DEMO_USERS[0],
      users: DEMO_USERS,
      theme: "light",
      sidebarOpen: true,

      addClient: (client) => {
        const id = generateId();
        const now = new Date().toISOString();
        set((state) => ({
          clients: [
            ...state.clients,
            { ...client, id, createdAt: now, updatedAt: now },
          ],
        }));
        return id;
      },

      updateClient: (id, data) => {
        set((state) => ({
          clients: state.clients.map((c) =>
            c.id === id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteClient: (id) => {
        set((state) => ({
          clients: state.clients.filter((c) => c.id !== id),
        }));
      },

      getClientById: (id) => {
        return get().clients.find((c) => c.id === id);
      },

      addConversation: (conversation) => {
        const id = generateId();
        set((state) => ({
          conversations: [
            ...state.conversations,
            { ...conversation, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      getConversationsByClient: (clientId) => {
        return get()
          .conversations.filter((c) => c.clientId === clientId)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },

      addTask: (task) => {
        const id = generateId();
        set((state) => ({
          tasks: [...state.tasks, { ...task, id }],
        }));
        return id;
      },

      updateTask: (id, data) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        }));
      },

      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        }));
      },

      getTasksByClient: (clientId) => {
        return get().tasks.filter((t) => t.clientId === clientId);
      },

      addNotification: (notification) => {
        const id = generateId();
        set((state) => ({
          notifications: [
            ...state.notifications,
            { ...notification, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.read).length;
      },

      addEvent: (event) => {
        const id = generateId();
        set((state) => ({
          calendarEvents: [...state.calendarEvents, { ...event, id }],
        }));
        return id;
      },

      updateEvent: (id, data) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) =>
            e.id === id ? { ...e, ...data } : e
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          calendarEvents: state.calendarEvents.filter((e) => e.id !== id),
        }));
      },

      getEventsByDate: (date) => {
        return get().calendarEvents.filter((e) => e.date === date);
      },

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        }));
      },

      toggleSidebar: () => {
        set((state) => ({
          sidebarOpen: !state.sidebarOpen,
        }));
      },

      getClientsByStatus: (status) => {
        return get().clients.filter((c) => c.status === status);
      },

      getClientsByTemperature: (temp) => {
        return get().clients.filter((c) => c.temperature === temp);
      },

      getOverdueFollowups: () => {
        const todayStr = today();
        return get().clients.filter(
          (c) =>
            c.nextContactDate &&
            c.nextContactDate < todayStr &&
            c.status !== "fechado_ganho" &&
            c.status !== "perdido"
        );
      },

      getTodayContacts: () => {
        const todayStr = today();
        return get().clients.filter(
          (c) =>
            c.nextContactDate === todayStr &&
            c.status !== "fechado_ganho" &&
            c.status !== "perdido"
        );
      },

      getUpcomingContacts: () => {
        const todayStr = today();
        const weekFromNow = daysFromNow(7);
        return get().clients.filter(
          (c) =>
            c.nextContactDate > todayStr &&
            c.nextContactDate <= weekFromNow &&
            c.status !== "fechado_ganho" &&
            c.status !== "perdido"
        );
      },

      conversionRate: () => {
        const all = get().clients;
        if (all.length === 0) return 0;
        const closed = all.filter((c) => c.status === "fechado_ganho").length;
        return Math.round((closed / all.length) * 100);
      },

      closedSales: () => {
        return get().clients.filter((c) => c.status === "fechado_ganho").length;
      },

      totalPipelineValue: () => {
        return get()
          .clients.filter(
            (c) =>
              c.status !== "fechado_ganho" &&
              c.status !== "perdido"
          )
          .reduce((sum, c) => sum + c.estimatedValue * (c.probability / 100), 0);
      },
    }),
    {
      name: "crm-vendas-storage",
    }
  )
);
