// ============================================================
// CALENDÁRIO DE AGENDAMENTO
// ============================================================
const MONTH_NAMES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DOW_NAMES = ["D","S","T","Q","Q","S","S"];
const ALL_SLOTS = ["09:00","13:00","17:00"];
const CAL_MAX_POR_HORARIO = 2; // aumente se tiver mais de um técnico por horário

let calState = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selectedDate: null, // "AAAA-MM-DD"
  selectedSlot: null,
  onChange: null,
};

// map "AAAA-MM-DD" -> { "09:00": quantidade_ocupada, ... }, cache do mês em exibição
let calBusyMap = {};

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function injectCompactStyles(containerId) {
  const styleId = `${containerId}-compact-styles`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    #${containerId} .calendar-card { max-width: 300px; margin: 0 auto; padding: 14px; }
    #${containerId} .calendar-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
    #${containerId} .calendar-head h4 { font-size: 13px; margin: 0; text-transform: capitalize; }
    #${containerId} .calendar-nav-btn { width: 26px; height: 26px; font-size: 13px; }
    #${containerId} .calendar-grid { display:grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
    #${containerId} .dow { text-align:center; font-size: 10px; color: var(--ink-muted); padding-bottom: 3px; }
    #${containerId} .day { aspect-ratio: 1; display:flex; align-items:center; justify-content:center; font-size: 12px; border-radius: 6px; }
    #${containerId} .day.available { cursor: pointer; }
    #${containerId} .day.available:hover { border: 1px solid var(--border); }
    #${containerId} .day.unavailable { opacity: .35; }
    #${containerId} .day.selected { background: var(--ink); color: #fff; }
    #${containerId} .slot-grid { display:grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 12px; }
    #${containerId} .slot-btn { padding: 7px 4px; font-size: 12px; }
  `;
  document.head.appendChild(style);
}

async function fetchMonthBusyMap(year, month) {
  const db = window.supabaseClient;
  if (!db) return {};

  const start = dateKey(year, month, 1);
  const nextMonthDate = month === 11 ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);
  const end = dateKey(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1);

  const { data, error } = await db
    .from("agendamentos")
    .select("detalhes, itens")
    .gte("detalhes->>data", start)
    .lt("detalhes->>data", end)
    .not("status", "ilike", "%cancel%");

  if (error) {
    console.error("Erro ao buscar disponibilidade:", error);
    return {};
  }

  const map = {};
  (data || []).forEach((row) => {
    const d = row.detalhes || {};
    if (!d.data || !d.horario) return;

    // Descobre a(s) categoria(s) presentes nesse agendamento
    const categorias = new Set((row.itens || []).map((i) => i.category));

    map[d.data] = map[d.data] || {};
    map[d.data][d.horario] = map[d.data][d.horario] || { elec: 0, ti: 0 };

    // Se o agendamento tiver serviço elétrico, ocupa uma vaga de elec; se tiver TI, ocupa uma vaga de ti
    if (categorias.has("elec")) map[d.data][d.horario].elec += 1;
    if (categorias.has("ti")) map[d.data][d.horario].ti += 1;
  });
  return map;
}

function getCategoriasNoCarrinho() {
  const cart = typeof getCart === "function" ? getCart() : [];
  const categorias = new Set(cart.map((i) => i.category));
  return categorias;
}

function getAvailableSlots(key) {
  const ocupados = calBusyMap[key] || {};
  const categoriasCarrinho = getCategoriasNoCarrinho();

  let slots = ALL_SLOTS.filter((s) => {
    const contagem = ocupados[s] || { elec: 0, ti: 0 };
    if (categoriasCarrinho.has("elec") && contagem.elec >= 1) return false;
    if (categoriasCarrinho.has("ti") && contagem.ti >= 1) return false;
    return true;
  });

  const todayKey = dateKey(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  if (key === todayKey) {
    const agora = new Date();
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
    slots = slots.filter((s) => {
      const [h, m] = s.split(":").map(Number);
      return h * 60 + m > minutosAgora;
    });
  }

  return slots;
}

function isDayAvailable(y, m, d) {
  const date = new Date(y, m, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) return false;
  const dow = date.getDay();
  if (dow === 0 || dow === 6) return false; // sem fins de semana
  return getAvailableSlots(dateKey(y, m, d)).length > 0;
}

function initCalendar(containerId, onChange) {
  calState.onChange = onChange;
  renderCalendar(containerId);
}

async function renderCalendar(containerId) {
  const root = document.getElementById(containerId);
  if (!root) return;
  injectCompactStyles(containerId);

  root.innerHTML = `<p style="font-size:12.5px;color:var(--ink-muted);text-align:center;padding:20px 0;">Carregando disponibilidade...</p>`;

  const { viewYear, viewMonth } = calState;
  calBusyMap = await fetchMonthBusyMap(viewYear, viewMonth);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  let cells = "";
  for (let i = 0; i < firstDow; i++) cells += `<div class="day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const available = isDayAvailable(viewYear, viewMonth, d);
    const selected = key === calState.selectedDate;
    cells += `<div class="day ${available ? "available" : "unavailable"} ${selected ? "selected" : ""}"
                    ${available ? `onclick="selectCalendarDay('${containerId}','${key}')"` : ""}>${d}</div>`;
  }

  const dowHTML = DOW_NAMES.map((d) => `<div class="dow">${d}</div>`).join("");

  root.innerHTML = `
    <div class="calendar-card">
      <div class="calendar-head">
        <button class="calendar-nav-btn" onclick="shiftCalendarMonth('${containerId}', -1)">‹</button>
        <h4>${MONTH_NAMES[viewMonth]} de ${viewYear}</h4>
        <button class="calendar-nav-btn" onclick="shiftCalendarMonth('${containerId}', 1)">›</button>
      </div>
      <div class="calendar-grid">${dowHTML}${cells}</div>
      <div id="${containerId}-slots"></div>
    </div>
  `;

  renderSlots(containerId);
}

function shiftCalendarMonth(containerId, delta) {
  calState.viewMonth += delta;
  if (calState.viewMonth < 0) { calState.viewMonth = 11; calState.viewYear--; }
  if (calState.viewMonth > 11) { calState.viewMonth = 0; calState.viewYear++; }
  calState.selectedDate = null;
  calState.selectedSlot = null;
  renderCalendar(containerId);
  notifyCalendarChange();
}

function selectCalendarDay(containerId, key) {
  calState.selectedDate = key;
  calState.selectedSlot = null;
  renderCalendarKeepingBusyMap(containerId);
  notifyCalendarChange();
}

// re-renderiza a grade sem buscar o mês de novo (já está em cache)
function renderCalendarKeepingBusyMap(containerId) {
  const root = document.getElementById(containerId);
  if (!root) return;
  const { viewYear, viewMonth } = calState;

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  let cells = "";
  for (let i = 0; i < firstDow; i++) cells += `<div class="day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(viewYear, viewMonth, d);
    const available = isDayAvailable(viewYear, viewMonth, d);
    const selected = key === calState.selectedDate;
    cells += `<div class="day ${available ? "available" : "unavailable"} ${selected ? "selected" : ""}"
                    ${available ? `onclick="selectCalendarDay('${containerId}','${key}')"` : ""}>${d}</div>`;
  }

  const grid = root.querySelector(".calendar-grid");
  const dowHTML = DOW_NAMES.map((d) => `<div class="dow">${d}</div>`).join("");
  if (grid) grid.innerHTML = dowHTML + cells;

  renderSlots(containerId);
}

function renderSlots(containerId) {
  const slotRoot = document.getElementById(`${containerId}-slots`);
  if (!slotRoot) return;
  if (!calState.selectedDate) {
    slotRoot.innerHTML = `<p style="margin-top:12px;font-size:12px;color:var(--ink-muted)">Escolha um dia disponível para ver os horários.</p>`;
    return;
  }
  const slots = getAvailableSlots(calState.selectedDate);
  const buttons = ALL_SLOTS.map((s) => {
    const disponivel = slots.includes(s);
    const selected = s === calState.selectedSlot;
    return `<button class="slot-btn ${selected ? "selected" : ""}" ${disponivel ? "" : "disabled"}
              onclick="selectCalendarSlot('${containerId}','${s}')">${s}</button>`;
  }).join("");
  slotRoot.innerHTML = `<div class="slot-grid">${buttons}</div>`;
}

function selectCalendarSlot(containerId, slot) {
  calState.selectedSlot = slot;
  renderSlots(containerId);
  notifyCalendarChange();
}

function notifyCalendarChange() {
  if (typeof calState.onChange === "function") {
    calState.onChange({ date: calState.selectedDate, slot: calState.selectedSlot });
  }
}

function getCalendarSelection() {
  return { date: calState.selectedDate, slot: calState.selectedSlot };
}

function formatDatePtBr(key) {
  if (!key) return "";
  const [y, m, d] = key.split("-").map(Number);
  return `${String(d).padStart(2, "0")} de ${MONTH_NAMES[m - 1]} de ${y}`;
}
