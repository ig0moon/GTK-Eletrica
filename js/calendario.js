// ============================================================
// CALENDÁRIO DE AGENDAMENTO
// ------------------------------------------------------------
// Protótipo front-end: disponibilidade é simulada aqui (sem
// finais de semana, sem datas passadas, e alguns horários
// sorteados como já ocupados). Em produção, troque
// getAvailableSlots(date) por uma consulta à tabela
// `agendamentos` no Supabase, filtrando os horários já
// reservados para aquele técnico/dia.
// ============================================================
const MONTH_NAMES = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
const DOW_NAMES = ["dom","seg","ter","qua","qui","sex","sáb"];
const ALL_SLOTS = ["08:00","09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"];

let calState = {
  viewYear: new Date().getFullYear(),
  viewMonth: new Date().getMonth(),
  selectedDate: null, // "YYYY-MM-DD"
  selectedSlot: null,
  onChange: null,
};

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// disponibilidade determinística (mesma seed sempre gera o mesmo resultado)
function seedRandom(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function getAvailableSlots(key) {
  const seed = seedRandom(key);
  return ALL_SLOTS.filter((_, i) => (seed + i * 7) % 5 !== 0);
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

function renderCalendar(containerId) {
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
  renderCalendar(containerId);
}

function selectCalendarDay(containerId, key) {
  calState.selectedDate = key;
  calState.selectedSlot = null;
  renderCalendar(containerId);
  notifyCalendarChange();
}

function renderSlots(containerId) {
  const slotRoot = document.getElementById(`${containerId}-slots`);
  if (!slotRoot) return;
  if (!calState.selectedDate) {
    slotRoot.innerHTML = `<p style="margin-top:16px;font-size:12.5px;color:var(--ink-muted)">Escolha um dia disponível para ver os horários.</p>`;
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
