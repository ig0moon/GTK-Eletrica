/**
 * js/agendamentos.js
 * Carrega, exibe e permite excluir os agendamentos reais do usuário logado,
 * substituindo os cartões estáticos de exemplo em conta.html.
 *
 * Compatível com o formato gravado por js/pagamento.js:
 *   { id, cliente_id, itens, total, status,
 *     detalhes: { cliente: {nome, telefone, endereco, obs}, data, horario, pagamento } }
 *
 * Cards no mesmo padrão visual usado no painel do técnico (tecnico.js),
 * mas sem controle de status — aqui o cliente só visualiza e pode excluir
 * agendamentos que ainda não foram concluídos.
 *
 * Depende de:
 *  - window.supabaseClient (mesmo cliente usado em pagamento.js)
 *  - showToast(msg) — já existe no projeto
 *  - conta.html com:
 *      <div id="agendamentos-tabs">
 *        <button id="tab-ativos" onclick="mudarFiltroAgendamentos('ativos')">Ativos</button>
 *        <button id="tab-historico" onclick="mudarFiltroAgendamentos('historico')">Histórico</button>
 *      </div>
 *      <div id="agendamentos-list"></div>
 *    dentro de #panel-agendamentos
 */

const AGENDAMENTOS_STATUS_BADGE_CLASS = {
  "Aguardando confirmação": "aguardando",
  Confirmado: "confirmado",
  "Aguardando técnico": "aguardando",
  "Em andamento": "andamento",
  Concluído: "concluido",
  Cancelado: "cancelado",
};

// status que vão para a aba "Histórico"
const AGENDAMENTOS_STATUS_HISTORICO = ["Concluído", "Cancelado"];

let agendamentosState = {
  todos: [],
  filtroAtivo: "ativos", // "ativos" | "historico"
};

function agendaToast(msg) {
  if (typeof showToast === "function") showToast(msg);
  else alert(msg);
}

function formatBRLLocal(v) {
  return typeof formatBRL === "function"
    ? formatBRL(v)
    : `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
}

function formatDataAgendamento(dataStr) {
  if (typeof formatDatePtBr === "function") {
    try {
      const formatada = formatDatePtBr(dataStr);
      if (formatada) return formatada;
    } catch (e) {}
  }
  return dataStr || "";
}

function getAgendamentosContainer() {
  let list = document.getElementById("agendamentos-list");
  if (!list) {
    const panel = document.getElementById("panel-agendamentos");
    if (!panel) return null;
    list = document.createElement("div");
    list.id = "agendamentos-list";
    panel.appendChild(list);
  }
  return list;
}

function isAgendamentoHistorico(ag) {
  return AGENDAMENTOS_STATUS_HISTORICO.includes(ag.status);
}

function getAgendamentosFiltrados() {
  return agendamentosState.todos.filter((ag) =>
    agendamentosState.filtroAtivo === "historico"
      ? isAgendamentoHistorico(ag)
      : !isAgendamentoHistorico(ag),
  );
}

// ------------------------------------------------------------
// ABAS
// ------------------------------------------------------------

function mudarFiltroAgendamentos(filtro) {
  agendamentosState.filtroAtivo = filtro;
  renderAgendamentosTabs();
  renderAgendamentosView();
}

function renderAgendamentosTabs() {
  const tabAtivos = document.getElementById("tab-ativos");
  const tabHistorico = document.getElementById("tab-historico");
  if (tabAtivos)
    tabAtivos.classList.toggle(
      "active",
      agendamentosState.filtroAtivo === "ativos",
    );
  if (tabHistorico)
    tabHistorico.classList.toggle(
      "active",
      agendamentosState.filtroAtivo === "historico",
    );
}

// ------------------------------------------------------------
// RENDER
// ------------------------------------------------------------

function renderAgendamentosEmpty(container) {
  const historico = agendamentosState.filtroAtivo === "historico";
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon-box"><span class="material-symbols-outlined">${historico ? "history" : "event_busy"}</span></div>
      <h3>${historico ? "Nenhum histórico" : "Nenhum agendamento"}</h3>
      <p>${historico ? "Seus agendamentos concluídos ou cancelados aparecerão aqui." : "Você ainda não possui serviços marcados conosco."}</p>
      ${historico ? "" : '<a href="catalogo.html" class="btn primary" style="margin-top: 16px;">Ver catálogo</a>'}
    </div>
  `;
}

function renderAgendamentosLista(container, agendamentos) {
  const historico = agendamentosState.filtroAtivo === "historico";

  container.innerHTML = agendamentos
    .map((ag) => {
      const d = ag.detalhes || {};
      const cliente = d.cliente || {};
      const fmtDate = formatDataAgendamento(d.data);
      const badgeClass =
        AGENDAMENTOS_STATUS_BADGE_CLASS[ag.status] || "aguardando";
      const podeExcluir = !historico && ag.status !== "Concluído";

      // Lógica para exibir a OS formatada ou o ID antigo como fallback
      let displayId = "";
      if (ag.ordem_servico) {
        displayId = "OS-" + String(ag.ordem_servico).padStart(4, "0");
      } else {
        displayId = "#" + String(ag.id).substring(0, 8);
      }

      const itensHTML = (ag.itens || [])
        .map((i) => {
          const valor =
            typeof i.price === "number"
              ? formatBRLLocal(i.price)
              : "A combinar";
          return `<li><span>${i.name} <strong>×${i.qty}</strong></span><span>${valor}</span></li>`;
        })
        .join("");

      return `
        <div class="agendamento-card" data-agendamento-id="${ag.id}">
          <div class="agendamento-top">
            <span class="agendamento-id">${displayId}</span>
            <span class="status-badge ${badgeClass}">${ag.status || "-"}</span>
          </div>

          <div class="agendamento-datahora">
            <span class="material-symbols-outlined">event</span>
            ${fmtDate}${d.horario ? ` às ${d.horario}` : ""}
          </div>

          <div class="agendamento-body" style="margin-top:14px">
            <!-- NOVO: Bloco mostrando o nome do titular do agendamento -->
            <div class="info-block" style="margin-bottom:8px">
              <label>Cliente</label>
              <span>${cliente.nome || "-"}</span>
            </div>
            <div class="info-block">
              <label>Endereço</label>
              <span>${cliente.endereco || "-"}</span>
              ${cliente.obs ? `<br><span style="color:var(--ink-muted)">Obs: ${cliente.obs}</span>` : ""}
            </div>
          </div>

          <ul class="agendamento-itens">${itensHTML}</ul>

          <div class="agendamento-footer">
            <span class="agendamento-total">${formatBRLLocal(ag.total)}</span>
            ${
              podeExcluir
                ? `<button class="btn-excluir-agendamento" title="Excluir agendamento" onclick="excluirAgendamento('${ag.id}')">
                     <span class="material-symbols-outlined">delete</span>
                     <span>Excluir</span>
                   </button>`
                : ""
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderAgendamentosView() {
  const container = getAgendamentosContainer();
  if (!container) return;

  const lista = getAgendamentosFiltrados();

  if (lista.length === 0) {
    renderAgendamentosEmpty(container);
    return;
  }

  renderAgendamentosLista(container, lista);
}

// ------------------------------------------------------------
// CARGA DE DADOS
// ------------------------------------------------------------

async function carregarAgendamentos() {
  const container = getAgendamentosContainer();
  if (!container) return;

  const db = window.supabaseClient;
  if (!db) {
    console.error("window.supabaseClient não encontrado — confira config.js");
    return;
  }

  container.innerHTML = `<p style="color: var(--ink-muted);">Carregando agendamentos...</p>`;

  const {
    data: { session },
  } = await db.auth.getSession();

  if (!session) {
    container.innerHTML = `<p style="color: var(--ink-muted);">Faça login para ver seus agendamentos.</p>`;
    return;
  }

  const { data, error } = await db
    .from("agendamentos")
    .select("*")
    .eq("cliente_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = `<p style="color: var(--danger, #c0392b);">Não foi possível carregar seus agendamentos.</p>`;
    return;
  }

  agendamentosState.todos = data || [];
  renderAgendamentosTabs();
  renderAgendamentosView();
}

async function excluirAgendamento(id) {
  if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

  const db = window.supabaseClient;
  if (!db) return;

  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session) return;

  const { error } = await db
    .from("agendamentos")
    .delete()
    .eq("id", id)
    .eq("cliente_id", session.user.id);

  if (error) {
    console.error(error);
    agendaToast("Erro ao excluir agendamento.");
    return;
  }

  agendamentosState.todos = agendamentosState.todos.filter(
    (ag) => ag.id !== id,
  );

  const item = document.querySelector(`[data-agendamento-id="${id}"]`);
  if (item) {
    item.classList.add("saindo");
    setTimeout(() => renderAgendamentosView(), 180);
  } else {
    renderAgendamentosView();
  }

  agendaToast("Agendamento excluído.");
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
