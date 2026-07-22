// ============================================================
// CONFIGURAÇÃO GERAL DO SITE — edite os valores abaixo
// ============================================================
const GTK_CONFIG = {
  // Número de WhatsApp da empresa (com DDI + DDD, só números)
  whatsappNumber: "5542998072016",
  whatsappMessage: "Olá! Vim pelo site da GTK Elétrica e Info e gostaria de mais informações.",

  // Preencher quando o projeto Supabase estiver criado.
  // As policies de RLS sugeridas estão em /sql/schema.sql
  supabaseUrl: "https://xiulxcmuktmevzwahgne.supabase.co",
  supabaseAnonKey: "sb_publishable_HPBycOl241NPLVq1P6FFnw_9lqUzuQB",
};

function gtkWhatsappLink(customMessage) {
  const msg = encodeURIComponent(customMessage || GTK_CONFIG.whatsappMessage);
  return `https://wa.me/${GTK_CONFIG.whatsappNumber}?text=${msg}`;
}
