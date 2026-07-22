const FAQ = [
  { cat: "agendamento", q: "Como escolho o horário do atendimento?", a: "No carrinho, clique em \"Ir para agendamento\". Na etapa 2 você escolhe um dia disponível no calendário e um horário livre entre os sugeridos." },
  { cat: "agendamento", q: "Posso agendar elétrica e T.I. no mesmo horário?", a: "Sim. Adicione serviços dos dois catálogos ao carrinho e agende tudo em uma única visita, sujeito à disponibilidade do técnico." },
  { cat: "agendamento", q: "Dá para remarcar um agendamento?", a: "Sim, fale com a gente pelo WhatsApp com o número do agendamento (#AG-xxxxxx) que aparece na confirmação." },
  { cat: "orcamento", q: "O orçamento em PDF tem custo?", a: "Não. O PDF é gerado automaticamente ao confirmar o agendamento, com os serviços escolhidos e o valor estimado." },
  { cat: "orcamento", q: "O valor final pode mudar?", a: "Os preços do catálogo são \"a partir de\". O valor final é confirmado após a vistoria técnica no local." },
  { cat: "pagamento", q: "Quais formas de pagamento são aceitas?", a: "Pix, cartão e dinheiro, combinados diretamente com o técnico no dia do atendimento. Pagamento online chega em breve." },
  { cat: "conta", q: "Preciso criar conta para agendar?", a: "Recomendamos criar uma conta para acompanhar seus agendamentos, mas o cadastro é rápido — nome, e-mail e senha." },
  { cat: "conta", q: "Qual a diferença entre cliente, colaborador e admin?", a: "Cliente agenda serviços; colaborador é o técnico que atende os chamados; admin gerencia o catálogo e as permissões do sistema." },
];

const CATS = [
  { id: "agendamento", label: "Agendamento" },
  { id: "orcamento", label: "Orçamento" },
  { id: "pagamento", label: "Pagamento" },
  { id: "conta", label: "Conta" },
];

let activeHelpCat = "agendamento";

function renderHelpCats() {
  const root = document.getElementById("help-cats");
  root.innerHTML = CATS.map(
    (c) => `<div class="help-cat ${c.id === activeHelpCat ? "active" : ""}" onclick="setHelpCat('${c.id}')">${c.label}</div>`
  ).join("");
}

function setHelpCat(cat) {
  activeHelpCat = cat;
  renderHelpCats();
  renderFAQ();
}

function renderFAQ() {
  const root = document.getElementById("faq-list");
  const items = FAQ.filter((f) => f.cat === activeHelpCat);
  root.innerHTML = items
    .map(
      (f, i) => `
    <div class="accordion-item" id="faq-${i}">
      <div class="accordion-q" onclick="toggleFAQ(${i})">
        <span>${f.q}</span>
        <span class="chev">⌄</span>
      </div>
      <div class="accordion-a"><div class="accordion-a-inner">${f.a}</div></div>
    </div>`
    )
    .join("");
}

function toggleFAQ(i) {
  const item = document.getElementById(`faq-${i}`);
  const answer = item.querySelector(".accordion-a");
  const isOpen = item.classList.contains("open");
  document.querySelectorAll(".accordion-item").forEach((el) => {
    el.classList.remove("open");
    el.querySelector(".accordion-a").style.maxHeight = null;
  });
  if (!isOpen) {
    item.classList.add("open");
    answer.style.maxHeight = answer.scrollHeight + "px";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderHelpCats();
  renderFAQ();
});
