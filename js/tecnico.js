// ============================================================
// PAINEL DO TÉCNICO — tecnico.js
// ============================================================

let tecnicoState = {
  perfil: null,
  agendamentos: [],
  filtroAtivo: "aguardando", // "aguardando" | "confirmado" | "andamento" | "concluido" | "cancelado"
};

document.addEventListener("DOMContentLoaded", async () => {
  const perfil = await verificarAcessoTecnico();
  if (!perfil) return;

  tecnicoState.perfil = perfil;
  preencherCabecalho(perfil);

  await carregarAgendamentos();
  renderFiltros();
  renderListaAgendamentos();
});

// ------------------------------------------------------------
// ACESSO E PERFIL
// ------------------------------------------------------------

async function verificarAcessoTecnico() {
  if (typeof getPerfil !== "function") return null;
  const perfil = await getPerfil();

  if (!perfil) {
    window.location.href = "index.html";
    return null;
  }

  if (perfil.cargo === "admin") {
    return perfil; // admin sempre passa, não precisa de especialidade
  }

  if (perfil.cargo !== "colaborador") {
    window.location.href = "index.html";
    return null;
  }

  if (!perfil.especialidade) {
    if (typeof showToast === "function") {
      showToast(
        "Seu perfil ainda não tem especialidade definida. Contate o administrador.",
      );
    }
    window.location.href = "index.html";
    return null;
  }

  return perfil;
}

function preencherCabecalho(perfil) {
  const nomeEl = document.getElementById("tecnico-nome");
  const labelEl = document.getElementById("tecnico-especialidade-label");

  if (nomeEl)
    nomeEl.textContent = perfil.nome
      ? `Olá, ${perfil.nome.split(" ")[0]}`
      : "Painel do Técnico";

  if (labelEl) {
    if (perfil.cargo === "admin") {
      labelEl.textContent = "Área do Técnico · Administrador";
    } else {
      labelEl.textContent =
        perfil.especialidade === "elec"
          ? "Área do Técnico · Elétrica"
          : "Área do Técnico · T.I.";
    }
  }
}

// ------------------------------------------------------------
// BUSCA DE AGENDAMENTOS
// ------------------------------------------------------------

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

  const perfil = tecnicoState.perfil;

  if (perfil.cargo === "admin") {
    tecnicoState.agendamentos = data || [];
    return;
  }

  const especialidade = perfil.especialidade;
  tecnicoState.agendamentos = (data || []).filter((ag) =>
    (ag.itens || []).some((i) => i.category === especialidade),
  );
}

function classificarAgendamento(ag) {
  const status = (ag.status || "").toLowerCase();

  if (status.includes("aguardando")) return "aguardando";
  if (status.includes("andamento")) return "andamento";
  if (status.includes("conclu")) return "concluido";
  if (status.includes("cancel")) return "cancelado";
  if (status.includes("confirmado")) return "confirmado";
  return "aguardando"; // fallback de segurança, não deveria cair aqui
}

function getAgendamentosFiltrados() {
  return tecnicoState.agendamentos.filter(
    (ag) => classificarAgendamento(ag) === tecnicoState.filtroAtivo,
  );
}

// ------------------------------------------------------------
// ABAS (mesmo padrão do switchTab de conta.js)
// ------------------------------------------------------------

const FILTROS_INFO = {
  aguardando: { titulo: "Aguardando confirmação" },
  confirmado: { titulo: "Confirmado" },
  andamento: { titulo: "Em andamento" },
  concluido: { titulo: "Concluído" },
  cancelado: { titulo: "Cancelado" },
};

function mudarFiltro(filtro) {
  tecnicoState.filtroAtivo = filtro;
  renderFiltros();
  renderListaAgendamentos();
}

function renderFiltros() {
  ["aguardando", "confirmado", "andamento", "concluido", "cancelado"].forEach(
    (f) => {
      const tab = document.getElementById(`tab-${f}`);
      if (tab) tab.classList.toggle("active", f === tecnicoState.filtroAtivo);
    },
  );

  const tituloEl = document.getElementById("tecnico-filtro-titulo");
  if (tituloEl)
    tituloEl.textContent = FILTROS_INFO[tecnicoState.filtroAtivo].titulo;
}

// ------------------------------------------------------------
// RENDERIZAÇÃO DA LISTA
// ------------------------------------------------------------

const STATUS_BADGE_CLASS = {
  "Aguardando confirmação": "aguardando",
  Confirmado: "confirmado",
  "Em andamento": "andamento",
  Concluído: "concluido",
  Cancelado: "cancelado",
};

function renderListaAgendamentos() {
  const root = document.getElementById("tecnico-lista");
  if (!root) return;

  const lista = getAgendamentosFiltrados();

  if (lista.length === 0) {
    root.innerHTML = `<p style="color:var(--ink-muted); font-size:13.5px; text-align:center; padding:30px 0">Nenhum agendamento nesse filtro.</p>`;
    return;
  }

  const fmtMoney =
    typeof formatBRL === "function"
      ? formatBRL
      : (v) => (typeof v === "number" ? `R$ ${v.toFixed(2)}` : "A combinar");

  root.innerHTML = lista
    .map((ag) => {
      const d = ag.detalhes || {};
      const cliente = d.cliente || {};
      const fmtDate =
        typeof formatDatePtBr === "function" ? formatDatePtBr(d.data) : d.data;
      
      // NOVO: Lógica da Ordem de Serviço
      let displayId = "";
      if (ag.ordem_servico) {
        displayId = "OS-" + String(ag.ordem_servico).padStart(4, '0');
      } else {
        displayId = "#" + String(ag.id).substring(0, 8);
      }

      const badgeClass = STATUS_BADGE_CLASS[ag.status] || "aguardando";

      const itensHTML = (ag.itens || [])
        .map((i) => {
          const valor =
            typeof i.price === "number" ? fmtMoney(i.price) : "A combinar";
          return `<li><span>${i.name} <strong>×${i.qty}</strong></span><span>${valor}</span></li>`;
        })
        .join("");

      const statusOptions = [
        "Aguardando confirmação",
        "Confirmado",
        "Em andamento",
        "Concluído",
        "Cancelado",
      ]
        .map(
          (s) =>
            `<option value="${s}" ${ag.status === s ? "selected" : ""}>${s}</option>`,
        )
        .join("");

      return `
        <div class="agendamento-card">
          <div class="agendamento-top">
            <span class="agendamento-id">${displayId}</span>
            <span class="status-badge ${badgeClass}">${ag.status || "-"}</span>
          </div>

          <div class="agendamento-datahora">
            <span class="material-symbols-outlined">event</span>
            ${fmtDate} às ${d.horario || "-"}
          </div>

          <div class="agendamento-body" style="margin-top:14px">
            <div class="info-block" style="margin-bottom:8px">
              <label>Cliente</label>
              <span>${cliente.nome || "-"}</span><br>
              <span style="color:var(--ink-muted); font-size: 13.5px;">${cliente.telefone || "-"}</span>
            </div>
            <div class="info-block">
              <label>Endereço</label>
              <span>${cliente.endereco || "-"}</span>
              ${cliente.obs ? `<br><span style="color:var(--ink-muted)">Obs: ${cliente.obs}</span>` : ""}
            </div>
          </div>

          <ul class="agendamento-itens">${itensHTML}</ul>

          <div class="agendamento-status-row">
            <label>Status:</label>
            <select onchange="handleMudarStatus('${ag.id}', this.value)">
              ${statusOptions}
            </select>
          </div>
        </div>`;
    })
    .join("");
}

// ------------------------------------------------------------
// ATUALIZAÇÃO DE STATUS
// ------------------------------------------------------------

async function handleMudarStatus(id, novoStatus) {
  const resultado = await window.supabaseClient
    .from("agendamentos")
    .update({ status: novoStatus })
    .eq("id", id)
    .select(); // importante: .select() no final pra devolver a linha atualizada

  console.log("Resultado do update:", resultado);

  if (resultado.error) {
    console.error("Erro ao atualizar status:", resultado.error);
    if (typeof showToast === "function") showToast("Erro ao atualizar status.");
    return;
  }

  if (!resultado.data || resultado.data.length === 0) {
    console.warn(
      "Update não retornou nenhuma linha — provável bloqueio de RLS.",
    );
    if (typeof showToast === "function")
      showToast("Sem permissão para atualizar esse agendamento.");
    return;
  }

  if (typeof showToast === "function") showToast("Status atualizado!");

  const ag = tecnicoState.agendamentos.find((a) => a.id === id);
  if (ag) ag.status = novoStatus;

  renderFiltros();
  renderListaAgendamentos();
}
