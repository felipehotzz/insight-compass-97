// General Metrics Data
export const arrData = [
  { month: "Jul", mantido: 1050000, novo: 180000, churn: 30000 },
  { month: "Ago", mantido: 1100000, novo: 210000, churn: 30000 },
  { month: "Set", mantido: 1180000, novo: 200000, churn: 30000 },
  { month: "Out", mantido: 1250000, novo: 200000, churn: 30000 },
  { month: "Nov", mantido: 1320000, novo: 210000, churn: 30000 },
  { month: "Dez", mantido: 1380000, novo: 230000, churn: 30000 },
];

export const clientsData = [
  { month: "Jul", mantido: 38, novo: 5, churn: 1 },
  { month: "Ago", mantido: 41, novo: 5, churn: 1 },
  { month: "Set", mantido: 44, novo: 5, churn: 1 },
  { month: "Out", mantido: 47, novo: 6, churn: 1 },
  { month: "Nov", mantido: 51, novo: 6, churn: 1 },
  { month: "Dez", mantido: 55, novo: 6, churn: 1 },
];

export const grossMarginData = [
  { month: "Jul", value: 68 },
  { month: "Ago", value: 70 },
  { month: "Set", value: 72 },
  { month: "Out", value: 71 },
  { month: "Nov", value: 73 },
  { month: "Dez", value: 75 },
];

export const netIncomeData = [
  { month: "Jul", value: 180000 },
  { month: "Ago", value: 195000 },
  { month: "Set", value: 210000 },
  { month: "Out", value: 225000 },
  { month: "Nov", value: 240000 },
  { month: "Dez", value: 260000 },
];

export const employeesData = [
  { month: "Jul", value: 35 },
  { month: "Ago", value: 37 },
  { month: "Set", value: 38 },
  { month: "Out", value: 40 },
  { month: "Nov", value: 42 },
  { month: "Dez", value: 45 },
];

// Growth Data
export const funnelData = [
  { name: "Lead (Funil de Vendas)", value: 220 },
  { name: "Tentativa de Contato", value: 306 },
  { name: "Conectado", value: 7 },
  { name: "Qualificação", value: 19 },
  { name: "Oportunidade", value: 10 },
  { name: "Proposta", value: 16 },
  { name: "Fechamento", value: 2 },
];

export const funnelValueData = [
  { name: "Qualificação", value: 162000 },
  { name: "Oportunidade", value: 705900 },
  { name: "Proposta", value: 847696 },
  { name: "Fechamento", value: 138096 },
];

export const pipelineByMonth = [
  { name: "Set 2025", pipeline: 96096, commit: 0, bestCase: 0 },
  { name: "Nov 2025", pipeline: 123300, commit: 0, bestCase: 0 },
  { name: "Jan 2026", pipeline: 279820, commit: 427464, bestCase: 0 },
  { name: "Mar 2026", pipeline: 117000, commit: 0, bestCase: 0 },
  { name: "Mai 2026", pipeline: 300000, commit: 0, bestCase: 0 },
];

export const opportunitiesByValue = [
  { name: "Grendene", value: 300000 },
  { name: "Syngenta", value: 180000 },
  { name: "CBMM", value: 117000 },
  { name: "Alpargatas", value: 96000 },
  { name: "SESC Nacional", value: 86400 },
  { name: "Metro BH", value: 67200 },
  { name: "Softplan", value: 57820 },
  { name: "Eucatex", value: 42000 },
  { name: "Caixa Consórcios", value: 33600 },
  { name: "CJ do Brasil", value: 29964 },
];

export const lostReasons = [
  { name: "Preço", value: 2 },
  { name: "Interesse futuro", value: 4 },
  { name: "Sem interesse", value: 4 },
  { name: "Fechou concorrente", value: 2 },
  { name: "Não respondeu", value: 7 },
];

// Presence & Media Data
export const linkedinMetrics = {
  followers: 12500,
  newFollowers: 450,
  posts: 24,
  impressions: 85000,
  comments: 320,
  reactions: 2100,
  pageViews: 4500,
  uniqueVisitors: 1800,
};

export const siteMetrics = {
  visitors: 25000,
  blogPosts: 12,
};

export const communityMetrics = {
  whatsappMembers: 850,
  postsMade: 45,
};

export const emailMetrics = {
  productUpdates: 3200,
  newsletters: 4500,
  invites: 1200,
};

// Presence Monthly Data for Charts
export const visitorsMonthlyData = [
  { month: "Jul", value: 18000, conversions: 180 },
  { month: "Ago", value: 19500, conversions: 210 },
  { month: "Set", value: 21000, conversions: 245 },
  { month: "Out", value: 22500, conversions: 280 },
  { month: "Nov", value: 24000, conversions: 310 },
  { month: "Dez", value: 25000, conversions: 350 },
];

export const blogPostsMonthlyData = [
  { month: "Jul", value: 6, previousValue: 5 },
  { month: "Ago", value: 7, previousValue: 5 },
  { month: "Set", value: 8, previousValue: 6 },
  { month: "Out", value: 9, previousValue: 7 },
  { month: "Nov", value: 11, previousValue: 8 },
  { month: "Dez", value: 12, previousValue: 9 },
];

export const whatsappMembersMonthlyData = [
  { month: "Jul", value: 650, previousValue: 580 },
  { month: "Ago", value: 700, previousValue: 610 },
  { month: "Set", value: 750, previousValue: 640 },
  { month: "Out", value: 790, previousValue: 680 },
  { month: "Nov", value: 820, previousValue: 720 },
  { month: "Dez", value: 850, previousValue: 760 },
];

export const postsMadeMonthlyData = [
  { month: "Jul", value: 28, previousValue: 22 },
  { month: "Ago", value: 32, previousValue: 25 },
  { month: "Set", value: 35, previousValue: 28 },
  { month: "Out", value: 38, previousValue: 30 },
  { month: "Nov", value: 42, previousValue: 34 },
  { month: "Dez", value: 45, previousValue: 38 },
];

export const followersMonthlyData = [
  { month: "Jul", value: 10500, previousValue: 9200 },
  { month: "Ago", value: 10900, previousValue: 9600 },
  { month: "Set", value: 11400, previousValue: 10000 },
  { month: "Out", value: 11900, previousValue: 10400 },
  { month: "Nov", value: 12200, previousValue: 10800 },
  { month: "Dez", value: 12500, previousValue: 11200 },
];

export const newFollowersMonthlyData = [
  { month: "Jul", value: 320, previousValue: 280 },
  { month: "Ago", value: 350, previousValue: 300 },
  { month: "Set", value: 380, previousValue: 320 },
  { month: "Out", value: 400, previousValue: 340 },
  { month: "Nov", value: 420, previousValue: 360 },
  { month: "Dez", value: 450, previousValue: 380 },
];

export const postsLinkedinMonthlyData = [
  { month: "Jul", value: 16, previousValue: 12 },
  { month: "Ago", value: 18, previousValue: 14 },
  { month: "Set", value: 19, previousValue: 15 },
  { month: "Out", value: 21, previousValue: 17 },
  { month: "Nov", value: 22, previousValue: 18 },
  { month: "Dez", value: 24, previousValue: 20 },
];

export const impressionsMonthlyData = [
  { month: "Jul", value: 58000, previousValue: 48000 },
  { month: "Ago", value: 64000, previousValue: 52000 },
  { month: "Set", value: 70000, previousValue: 58000 },
  { month: "Out", value: 75000, previousValue: 62000 },
  { month: "Nov", value: 80000, previousValue: 68000 },
  { month: "Dez", value: 85000, previousValue: 72000 },
];

export const commentsMonthlyData = [
  { month: "Jul", value: 180, previousValue: 150 },
  { month: "Ago", value: 210, previousValue: 170 },
  { month: "Set", value: 240, previousValue: 190 },
  { month: "Out", value: 270, previousValue: 220 },
  { month: "Nov", value: 295, previousValue: 250 },
  { month: "Dez", value: 320, previousValue: 280 },
];

export const reactionsMonthlyData = [
  { month: "Jul", value: 1400, previousValue: 1200 },
  { month: "Ago", value: 1550, previousValue: 1320 },
  { month: "Set", value: 1700, previousValue: 1450 },
  { month: "Out", value: 1850, previousValue: 1580 },
  { month: "Nov", value: 1980, previousValue: 1700 },
  { month: "Dez", value: 2100, previousValue: 1850 },
];

export const pageViewsMonthlyData = [
  { month: "Jul", value: 3000, previousValue: 2600 },
  { month: "Ago", value: 3300, previousValue: 2850 },
  { month: "Set", value: 3600, previousValue: 3100 },
  { month: "Out", value: 3900, previousValue: 3400 },
  { month: "Nov", value: 4200, previousValue: 3700 },
  { month: "Dez", value: 4500, previousValue: 4000 },
];

export const uniqueVisitorsMonthlyData = [
  { month: "Jul", value: 1200, previousValue: 1050 },
  { month: "Ago", value: 1350, previousValue: 1150 },
  { month: "Set", value: 1480, previousValue: 1280 },
  { month: "Out", value: 1600, previousValue: 1400 },
  { month: "Nov", value: 1720, previousValue: 1520 },
  { month: "Dez", value: 1800, previousValue: 1650 },
];

// Customer Data
export const customersByProduct = [
  { name: "Produto A", value: 25 },
  { name: "Produto B", value: 18 },
  { name: "Produto C", value: 12 },
  { name: "Produto D", value: 5 },
];

export const customersByPlan = [
  { name: "Enterprise", value: 15, amount: 950000 },
  { name: "Business", value: 25, amount: 450000 },
  { name: "Professional", value: 15, amount: 180000 },
  { name: "Starter", value: 5, amount: 20000 },
];

export const customersByCS = [
  { name: "Daniel Santos", value: 18, amount: 520000 },
  { name: "Eduardo Carvalho", value: 22, amount: 480000 },
  { name: "Jessica Bueno", value: 20, amount: 600000 },
];

export const renewals = {
  next30: { total: 8, inProgress: 5, notStarted: 3, value: 180000 },
  next90: { total: 15, inProgress: 8, notStarted: 7, value: 420000 },
  next180: { total: 28, inProgress: 12, notStarted: 16, value: 850000 },
};

export const supportTickets = {
  opened: { n1: 45, n2: 23, n3: 8 },
  closed: { n1: 42, n2: 20, n3: 6 },
  backlog: { n1: 12, n2: 8, n3: 4 },
};

export const ticketsByType = [
  { name: "Bounce", value: 5 },
  { name: "Bug", value: 3 },
  { name: "Colaborador sem acesso", value: 4 },
  { name: "Dúvidas de Utilização", value: 4 },
  { name: "In App", value: 14 },
  { name: "Inclusão de Logo", value: 2 },
  { name: "Solicitação de Relatório", value: 7 },
];

export const ticketsByCustomer = [
  { name: "Comunica.In", value: 12 },
  { name: "In App", value: 14 },
  { name: "Jeffrey Group", value: 7 },
  { name: "Alpargatas", value: 4 },
  { name: "Mercedes Benz", value: 3 },
];

// Customer Detail Data
export const customerDetail = {
  id: 1,
  name: "Grendene",
  contractValue: 300000,
  monthsAsCustomer: 24,
  ltv: 720000,
  currentPlan: "Enterprise",
  remainingMonths: 12,
  csResponsible: {
    name: "Jessica Bueno",
    email: "jessica.bueno@empresa.com",
  },
  champions: [
    { name: "Maria Silva", email: "maria.silva@grendene.com", phone: "+55 11 99999-0001", linkedin: "linkedin.com/in/mariasilva" },
    { name: "João Souza", email: "joao.souza@grendene.com", phone: "+55 11 99999-0002", linkedin: "linkedin.com/in/joaosouza" },
  ],
  meetings: [
    { date: "2025-12-15", title: "Revisão Trimestral", type: "Reunião", theme: "Renovação", link: "https://meet.google.com/abc-123", notes: "Discussão sobre expansão do contrato" },
    { date: "2025-11-20", title: "Onboarding Novos Usuários", type: "Reunião", theme: "Onboarding", link: "https://meet.google.com/def-456", notes: "Treinamento realizado com sucesso" },
    { date: "2025-11-10", title: "Suporte Técnico", type: "E-mail", theme: "Suporte / Dúvidas", link: "", notes: "Resolução de dúvidas" },
    { date: "2025-10-25", title: "Alinhamento Mensal", type: "Reunião", theme: "Relacionamento", link: "https://meet.google.com/ghi-789", notes: "Revisão de métricas" },
    { date: "2025-10-15", title: "Proposta Expansão", type: "E-mail", theme: "Expansão", link: "", notes: "Enviada proposta comercial" },
  ],
  usage: {
    communications: 1250,
    emailPercentage: 45,
    teamsPercentage: 35,
    whatsappPercentage: 20,
    totalDispatches: 8500,
    usersInBase: 5200,
    registeredCollaborators: 3800,
  },
  support: {
    opened: { n1: 8, n2: 3, n3: 1 },
    closed: { n1: 7, n2: 2, n3: 1 },
    backlog: { n1: 1, n2: 1, n3: 0 },
  },
};

export const allCustomers = [
  { id: 1, name: "Grendene", value: 300000 },
  { id: 2, name: "Syngenta", value: 180000 },
  { id: 3, name: "CBMM", value: 117000 },
  { id: 4, name: "Alpargatas", value: 96000 },
  { id: 5, name: "SESC Nacional", value: 86400 },
  { id: 6, name: "Metro BH", value: 67200 },
  { id: 7, name: "Softplan", value: 57820 },
  { id: 8, name: "Eucatex", value: 42000 },
  { id: 9, name: "Caixa Consórcios", value: 33600 },
  { id: 10, name: "CJ do Brasil", value: 29964 },
  { id: 11, name: "Irani", value: 22500 },
  { id: 12, name: "Soprano", value: 22500 },
  { id: 13, name: "Brado Logística", value: 5940 },
];
