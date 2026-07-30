/**
 * js/agendamentos.js
 * Carrega, exibe e permite excluir os agendamentos reais do usuário logado,
 * substituindo os cartões estáticos de exemplo em conta.html.
 *
 * Compatível com o formato gravado por js/pagamento.js:
 *   { id, cliente_id, itens, total, status,
 *     detalhes: { cliente: {nome, telefone, endereco, obs}, data, horario, pagamento } }
 *
 * Depende de:
 *  - window.supabaseClient (mesmo cliente usado em pagamento.js)
 *  - showToast(msg) — já existe no projeto
 *  - conta.html com um <div id="agendamentos-list"></div> dentro de #panel-agendamentos
 */

const AGENDAMENTOS_STATUS_LABEL = {
  "Aguardando confirmação": { label: "Aguardando confirmação", style: "color: var(--warning, #b8860b);" },
  "Confirmado": { label: "Confirmado", style: "" },
  "Aguardando técnico": { label: "Aguardando técnico", style: "color: var(--warning, #b8860b);" },
  "Concluído": { label: "Concluído", style: "color: var(--success, #1a7f37);" },
  "Cancelado": { label: "Cancelado", style: "color: var(--danger, #c0392b); text-decoration: line-through;" },
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
    // formatDatePtBr espera "AAAA-MM-DD"; se já vier formatada, cai no fallback abaixo
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

function renderAgendamentosEmpty(container) {
  container.innerHTML = `
    <div class="empty-state">
      <div class="icon-box"><span class="material-symbols-outlined">event_busy</span></div>
      <h3>Nenhum agendamento</h3>
      <p>Você ainda não possui serviços marcados conosco.</p>
      <a href="catalogo.html" class="btn primary" style="margin-top: 16px;">Ver catálogo</a>
    </div>
  `;
}

function renderAgendamentosLista(container, agendamentos) {
  container.innerHTML = agendamentos
    .map((ag) => {
      const detalhes = ag.detalhes || {};
      const primeiroItem = Array.isArray(ag.itens) && ag.itens.length ? ag.itens[0] : null;
      const categoria = primeiroItem?.category === "elec" ? "elec" : "ti";
      const icone = primeiroItem?.icon || (categoria === "elec" ? "bolt" : "computer");
      const titulo =
        Array.isArray(ag.itens) && ag.itens.length
          ? ag.itens.map((i) => i.name).join(", ")
          : "Serviço agendado";
      const statusInfo = AGENDAMENTOS_STATUS_LABEL[ag.status] || { label: ag.status, style: "" };
      const podeExcluir = ag.status !== "Concluído";
      const dataFmt = formatDataAgendamento(detalhes.data);
      const horario = detalhes.horario || "";

      return `
      <div class="cart-item" data-agendamento-id="${ag.id}">
        <div class="swatch" style="background: var(--${categoria}-bg); color: var(--${categoria}-ink);">
          <span class="material-symbols-outlined">${icone}</span>
        </div>
        <div class="info">
          <h4>${titulo}</h4>
          <span>${dataFmt}${horario ? `, ${horario}` : ""} • Status: <strong style="${statusInfo.style}">${statusInfo.label}</strong></span>
        </div>
        <div class="price">${formatBRLLocal(ag.total)}</div>
        ${
          podeExcluir
            ? `<button class="btn icon-btn sm" title="Excluir agendamento" onclick="excluirAgendamento('${ag.id}')">
                <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
                </button>`
            : ""
        }
      </div>
    `;
    })
    .join("");
}

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

  if (!data || data.length === 0) {
    renderAgendamentosEmpty(container);
    return;
  }

  renderAgendamentosLista(container, data);
}

async function excluirAgendamento(id) {
  if (!confirm("Tem certeza que deseja excluir este agendamento?")) return;

  const db = window.supabaseClient;
  if (!db) return;

  const {
    data: { session },
  } = await db.auth.getSession();
  if (!session) return;

  const { error } = await db.from("agendamentos").delete().eq("id", id).eq("cliente_id", session.user.id);

  if (error) {
    console.error(error);
    agendaToast("Erro ao excluir agendamento.");
    return;
  }

  const item = document.querySelector(`[data-agendamento-id="${id}"]`);
  if (item) item.remove();

  agendaToast("Agendamento excluído.");

  const container = document.getElementById("agendamentos-list");
  if (container && !container.querySelector(".cart-item")) {
    renderAgendamentosEmpty(container);
  }
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
