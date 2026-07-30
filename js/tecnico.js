// ============================================================
// PÁGINA DO TÉCNICO — tecnico.js
// ============================================================

let tecnicoState = {
  perfil: null,
  agendamentos: [],
  filtroAtivo: "aguardando", // "aguardando" | "futuros" | "concluidos"
};

document.addEventListener("DOMContentLoaded", async () => {
  const perfil = await verificarAcessoTecnico();
  if (!perfil) return;

  tecnicoState.perfil = perfil;
  await carregarAgendamentos();
  renderFiltros();
  renderListaAgendamentos();
});

async function verificarAcessoTecnico() {
  if (typeof getPerfil !== "function") return null;
  const perfil = await getPerfil();

  if (!perfil || perfil.cargo !== "colaborador") {
    window.location.href = "index.html";
    return null;
  }

  if (!perfil.especialidade) {
    alert("Seu perfil de técnico ainda não tem uma especialidade definida. Contate o administrador.");
    window.location.href = "index.html";
    return null;
  }

  return perfil;
}

async function carregarAgendamentos() {
  const { data, error } = await window.supabaseClient
    .from("agendamentos")
    .select("*")
    .order("detalhes->>data", { ascending: true });

  if (error) {
    console.error("Erro ao buscar agendamentos:", error);
    tecnicoState.agendamentos = [];
    return;
  }

  const especialidade = tecnicoState.perfil.especialidade;
  tecnicoState.agendamentos = (data || []).filter((ag) =>
    (ag.itens || []).some((i) => i.category === especialidade)
  );
}

function classificarAgendamento(ag) {
  const status = (ag.status || "").toLowerCase();

  if (status === "concluído" || status === "concluido") return "concluidos";
  if (status.includes("aguardando")) return "aguardando";

  // Já confirmado, cancelado entra à parte (não aparece em nenhum filtro por padrão, ou trate como quiser)
  if (status.includes("cancel")) return "cancelados";

  return "futuros";
}

function getAgendamentosFiltrados() {
  return tecnicoState.agendamentos.filter(
    (ag) => classificarAgendamento(ag) === tecnicoState.filtroAtivo
  );
}

function renderFiltros() {
  const root = document.getElementById("tecnico-filtros");
  if (!root) return;

  const contagem = { aguardando: 0, futuros: 0, concluidos: 0 };
  tecnicoState.agendamentos.forEach((ag) => {
    const grupo = classificarAgendamento(ag);
    if (contagem[grupo] !== undefined) contagem[grupo] += 1;
  });

  root.innerHTML = `
    <button class="filtro-btn ${tecnicoState.filtroAtivo === "aguardando" ? "active" : ""}" onclick="mudarFiltro('aguardando')">
      Aguardando confirmação (${contagem.aguardando})
    </button>
    <button class="filtro-btn ${tecnicoState.filtroAtivo === "futuros" ? "active" : ""}" onclick="mudarFiltro('futuros')">
      Futuros (${contagem.futuros})
    </button>
    <button class="filtro-btn ${tecnicoState.filtroAtivo === "concluidos" ? "active" : ""}" onclick="mudarFiltro('concluidos')">
      Concluídos (${contagem.concluidos})
    </button>
  `;
}

function mudarFiltro(filtro) {
  tecnicoState.filtroAtivo = filtro;
  renderFiltros();
  renderListaAgendamentos();
}

function renderListaAgendamentos() {
  const root = document.getElementById("tecnico-lista");
  if (!root) return;

  const lista = getAgendamentosFiltrados();

  if (lista.length === 0) {
    root.innerHTML = `<p style="color:var(--ink-muted);font-size:13.5px">Nenhum agendamento nesse filtro.</p>`;
    return;
  }

  const fmtMoney = typeof formatBRL === "function"
    ? formatBRL
    : (v) => (typeof v === "number" ? `R$ ${v.toFixed(2)}` : "A combinar");

  root.innerHTML = lista
    .map((ag) => {
      const d = ag.detalhes || {};
      const cliente = d.cliente || {};
      const fmtDate = typeof formatDatePtBr === "function" ? formatDatePtBr(d.data) : d.data;

      const itensHTML = (ag.itens || [])
        .map((i) => `<li>${i.name} (x${i.qty}) — ${fmtMoney(i.price)}</li>`)
        .join("");

      return `
        <div class="agendamento-card">
          <div class="agendamento-head">
            <strong>#${String(ag.id).substring(0, 8)}</strong>
            <span>${fmtDate} às ${d.horario || "-"}</span>
          </div>
          <p><strong>Cliente:</strong> ${cliente.nome || "-"} — ${cliente.telefone || "-"}</p>
          <p><strong>Endereço:</strong> ${cliente.endereco || "-"}</p>
          ${cliente.obs ? `<p><strong>Obs:</strong> ${cliente.obs}</p>` : ""}
          <ul class="agendamento-itens">${itensHTML}</ul>
          <div class="agendamento-status">
            <label>Status:</label>
            <select onchange="handleMudarStatus('${ag.id}', this.value)">
              ${["Aguardando confirmação", "Confirmado", "Em andamento", "Concluído", "Cancelado"]
                .map((s) => `<option value="${s}" ${ag.status === s ? "selected" : ""}>${s}</option>`)
                .join("")}
            </select>
          </div>
        </div>`;
    })
    .join("");
}

async function handleMudarStatus(id, novoStatus) {
  const { error } = await window.supabaseClient
    .from("agendamentos")
    .update({ status: novoStatus })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar status:", error);
    if (typeof showToast === "function") showToast("Erro ao atualizar status.");
    return;
  }

  if (typeof showToast === "function") showToast("Status atualizado!");

  // Atualiza localmente e re-renderiza
  const ag = tecnicoState.agendamentos.find((a) => a.id === id);
  if (ag) ag.status = novoStatus;

  renderFiltros();
  renderListaAgendamentos();
}