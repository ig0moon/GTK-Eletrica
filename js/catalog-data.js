// ============================================================
// CATÁLOGO DE SERVIÇOS
// category: "elec" | "ti"
// price: valor "a partir de", em reais — ajuste conforme sua tabela
// ============================================================
const CATALOG = [
  // ---------- ELÉTRICA ----------
  {
    id: "elec-tomadas",
    category: "elec",
    icon: "🔌",
    name: "Instalação de tomadas",
    desc: "Instalação ou troca de tomadas comuns, USB ou de alta potência.",
    price: 90,
  },
  {
    id: "elec-quadro",
    category: "elec",
    icon: "🧰",
    name: "Quadro elétrico",
    desc: "Instalação, troca ou organização do quadro de disjuntores.",
    price: 320,
  },
  {
    id: "elec-cameras",
    category: "elec",
    icon: "📷",
    name: "Instalação de câmeras",
    desc: "Fixação, cabeamento e configuração de câmeras de segurança.",
    price: 180,
  },
  {
    id: "elec-campainhas",
    category: "elec",
    icon: "🔔",
    name: "Campainhas",
    desc: "Instalação de campainhas comuns ou inteligentes (vídeo porteiro).",
    price: 110,
  },
  {
    id: "elec-lampadas",
    category: "elec",
    icon: "💡",
    name: "Instalação de lâmpadas",
    desc: "Troca de lâmpadas, luminárias, spots e arandelas.",
    price: 60,
  },
  {
    id: "elec-chuveiros",
    category: "elec",
    icon: "🚿",
    name: "Chuveiros",
    desc: "Instalação e manutenção de chuveiros elétricos.",
    price: 100,
  },
  {
    id: "elec-torneiras",
    category: "elec",
    icon: "🚰",
    name: "Torneiras elétricas",
    desc: "Instalação e reparo de torneiras elétricas e misturadores.",
    price: 95,
  },
  {
    id: "elec-manutencao",
    category: "elec",
    icon: "⚡",
    name: "Manutenção elétrica geral",
    desc: "Diagnóstico de curtos, quedas de energia e problemas na fiação.",
    price: 130,
  },

  // ---------- T.I. ----------
  {
    id: "ti-formatacao",
    category: "ti",
    icon: "💽",
    name: "Formatação de PCs",
    desc: "Formatação completa com reinstalação do sistema e drivers.",
    price: 90,
  },
  {
    id: "ti-manutencao-pc",
    category: "ti",
    icon: "🖥️",
    name: "Manutenção de PCs",
    desc: "Limpeza interna, troca de pasta térmica e diagnóstico de falhas.",
    price: 110,
  },
  {
    id: "ti-roteadores",
    category: "ti",
    icon: "📶",
    name: "Manutenção de roteadores",
    desc: "Configuração, otimização de sinal e resolução de quedas de Wi-Fi.",
    price: 80,
  },
  {
    id: "ti-switches",
    category: "ti",
    icon: "🔀",
    name: "Manutenção de switches",
    desc: "Configuração e diagnóstico de switches em redes residenciais e comerciais.",
    price: 100,
  },
  {
    id: "ti-redes",
    category: "ti",
    icon: "🧵",
    name: "Instalação de rede cabeada",
    desc: "Passagem de cabos de rede e organização de pontos.",
    price: 150,
  },
  {
    id: "ti-suporte",
    category: "ti",
    icon: "🛠️",
    name: "Suporte técnico geral",
    desc: "Instalação de programas, remoção de vírus e ajustes gerais.",
    price: 70,
  },
];

function getCatalogByCategory(cat) {
  return CATALOG.filter((s) => s.category === cat);
}

function findService(id) {
  return CATALOG.find((s) => s.id === id);
}
