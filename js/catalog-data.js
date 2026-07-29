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
    icon: "<span class='material-symbols-rounded'>electrical_services</span>",
    name: "Instalação de tomadas",
    desc: "Instalação ou troca de tomadas comuns, USB ou de alta potência.",
    price: 90,
  },
  {
    id: "elec-quadro",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>space_dashboard</span>",
    name: "Quadro elétrico",
    desc: "Instalação, troca ou organização do quadro de disjuntores.",
    price: 320,
  },
  {
    id: "elec-cameras",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>linked_camera</span>",
    name: "Instalação de câmeras",
    desc: "Fixação, cabeamento e configuração de câmeras de segurança.",
    price: 180,
  },
  {
    id: "elec-campainhas",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>notifications_active</span>",
    name: "Campainhas",
    desc: "Instalação de campainhas comuns ou inteligentes (vídeo porteiro).",
    price: 110,
  },
  {
    id: "elec-lampadas",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>lightbulb_2</span>",
    name: "Instalação de lâmpadas",
    desc: "Troca de lâmpadas, luminárias, spots e arandelas.",
    price: 60,
  },
  {
    id: "elec-chuveiros",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>shower</span>",
    name: "Chuveiros",
    desc: "Instalação e manutenção de chuveiros elétricos.",
    price: 100,
  },
  {
    id: "elec-torneiras",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>faucet</span>",
    name: "Torneiras elétricas",
    desc: "Instalação e reparo de torneiras elétricas e misturadores.",
    price: 95,
  },
  {
    id: "elec-manutencao",
    category: "elec",
    icon: "<span class='material-symbols-rounded'>bolt</span>",
    name: "Manutenção elétrica geral",
    desc: "Diagnóstico de curtos, quedas de energia e problemas na fiação.",
    price: 130,
  },

  // ---------- T.I. ----------
  {
    id: "ti-formatacao",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>hard_drive</span>",
    name: "Formatação de PCs",
    desc: "Formatação completa com reinstalação do sistema e drivers.",
    price: 90,
  },
  {
    id: "ti-manutencao-pc",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>desktop_windows</span>",
    name: "Manutenção de PCs",
    desc: "Limpeza interna, troca de pasta térmica e diagnóstico de falhas.",
    price: 110,
  },
  {
    id: "ti-roteadores",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>router</span>",
    name: "Manutenção de roteadores",
    desc: "Configuração, otimização de sinal e resolução de quedas de Wi-Fi.",
    price: 80,
  },
  {
    id: "ti-switches",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>device_hub</span>",
    name: "Manutenção de switches",
    desc: "Configuração e diagnóstico de switches em redes residenciais e comerciais.",
    price: 100,
  },
  {
    id: "ti-redes",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>cable</span>",
    name: "Instalação de rede cabeada",
    desc: "Passagem de cabos de rede e organização de pontos.",
    price: 150,
  },
  {
    id: "ti-suporte",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>build</span>",
    name: "Suporte técnico geral",
    desc: "Instalação de programas, remoção de vírus e ajustes gerais.",
    price: 70,
  },
  {
    id: "ti-3d",
    category: "ti",
    icon: "<span class='material-symbols-rounded'>print</span>",
    name: "Impressão 3D",
    desc: "Impressão de arquivos .STL e outros.",
    price: "A combinar",
  },
];

function getCatalogByCategory(cat) {
  return CATALOG.filter((s) => s.category === cat);
}

function findService(id) {
  return CATALOG.find((s) => s.id === id);
}
