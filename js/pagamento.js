// ============================================================
// PAGAMENTO E CHECKOUT
// ============================================================

let checkoutStep = 1;

// Define a função goToStep no objeto window para o HTML encontrar
window.goToStep = function (step) {
  // Pega o contador global de itens do cart.js
  const totalItens = typeof cartCount === "function" ? cartCount() : 0;

  if (step === 2 && totalItens === 0) {
    if (typeof showToast === "function")
      showToast("Seu carrinho está vazio. Adicione um serviço primeiro.");
    else alert("Seu carrinho está vazio.");
    return;
  }

  if (step === 3) {
    // Garante que o calendário foi preenchido
    const selection =
      typeof getCalendarSelection === "function"
        ? getCalendarSelection()
        : { slot: null };
    if (!selection.slot) {
      if (typeof showToast === "function")
        showToast("Escolha um dia e horário antes de continuar.");
      else alert("Escolha um dia e horário antes de continuar.");
      return;
    }
  }

  checkoutStep = step;
  renderCheckoutSteps();
};

function renderCheckoutSteps() {
  [1, 2, 3].forEach((n) => {
    const stepEl = document.getElementById(`step-indicator-${n}`);
    const panelEl = document.getElementById(`step-panel-${n}`);
    if (!stepEl || !panelEl) return;

    stepEl.classList.toggle("active", n === checkoutStep);
    stepEl.classList.toggle("done", n < checkoutStep);
    panelEl.classList.toggle("active", n === checkoutStep);
  });

  if (checkoutStep === 1) renderReviewStep();
  if (checkoutStep === 3) renderSelectedSlotSummary();
}

function renderReviewStep() {
  const root = document.getElementById("review-list");
  if (!root) return;

  // Garante acesso à função do cart.js
  const cart = typeof getCart === "function" ? getCart() : [];

  if (cart.length === 0) {
    root.innerHTML = `<p style="color:var(--ink-muted);font-size:13.5px">Nenhum serviço no carrinho ainda. <a href="catalogo.html" style="color:var(--ti)">Ver catálogo</a>.</p>`;
    return;
  }

  // Função fallback para formatação de moeda caso o cart.js demore a carregar
  const fmtMoney =
    typeof formatBRL === "function"
      ? formatBRL
      : (val) =>
          val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // 1. Gera o HTML da lista de itens
  let html = cart
    .map((i) => {
      const valorItem =
        typeof i.price === "number" ? fmtMoney(i.price * i.qty) : "A combinar";
      return `<div class="cart-item">
      <div class="swatch" style="background:${i.category === "elec" ? "var(--elec-bg)" : "var(--ti-bg)"};color:${i.category === "elec" ? "var(--elec-ink)" : "var(--ti-ink)"}">
        <span class="material-symbols-outlined">${i.icon}</span>
      </div>
      <div class="info">
        <h4>${i.name}</h4>
        <span>Qtd: ${i.qty}</span>
      </div>
      <span class="mono">${valorItem}</span>
    </div>`;
    })
    .join("");

  // 2. Verifica se tem algum item "a combinar"
  const temOrcamento =
    typeof window.cartHasQuoteItems === "function"
      ? window.cartHasQuoteItems()
      : cart.some((i) => typeof i.price !== "number");

  // 3. Adiciona o bloco de aviso se necessário
  if (temOrcamento) {
    html += `
    <div style="margin-top: 16px; padding: 12px; border: 1px dashed var(--ink-muted); border-radius: 8px; font-size: 13px; color: var(--ink-muted); display: flex; gap: 8px; align-items: start; line-height: 1.4;">
      <span class="material-symbols-outlined" style="font-size: 18px;">info</span>
      <span><strong>Aviso sobre valores:</strong> Você possui itens "A combinar". Mais informações e detalhes deverão ser repassados via WhatsApp ao final do agendamento para a formulação do orçamento.</span>
    </div>`;
  }

  root.innerHTML = html;
}

function renderSelectedSlotSummary() {
  if (typeof getCalendarSelection !== "function") return;
  const { date, slot } = getCalendarSelection();
  const el = document.getElementById("selected-slot-summary");

  const fmtDate =
    typeof formatDatePtBr === "function" ? formatDatePtBr(date) : date;

  if (el) el.textContent = `${fmtDate} às ${slot}`;
}

// Expõe a função para o HTML
window.selectPaymentMethod = function (method, el) {
  document
    .querySelectorAll(".payment-method")
    .forEach((n) => n.classList.remove("selected"));
  el.classList.add("selected");
  window.selectedPaymentMethod = method;
};

// ============================================================
// INTEGRAÇÃO SUPABASE - FINALIZAR PEDIDO
// ============================================================
window.confirmBooking = async function () {
  const nome = document.getElementById("chk-nome")?.value.trim();
  const telefone = document.getElementById("chk-telefone")?.value.trim();
  const endereco = document.getElementById("chk-endereco")?.value.trim();
  const obs = document.getElementById("chk-obs")?.value.trim();

  if (!nome || !telefone || !endereco) {
    if (typeof showToast === "function")
      return showToast("Preencha nome, telefone e endereço.");
    return alert("Preencha todos os campos.");
  }

  if (!window.selectedPaymentMethod) {
    if (typeof showToast === "function")
      return showToast("Escolha uma forma de pagamento.");
    return alert("Escolha uma forma de pagamento.");
  }

  // Checagem de segurança dupla do Supabase
  if (!window.supabaseClient) {
    return alert("Erro interno: Supabase não está conectado.");
  }

  const { data: authData, error: authError } =
    await window.supabaseClient.auth.getSession();

  if (authError || !authData.session) {
    if (typeof showToast === "function")
      showToast("Você precisa estar logado para agendar.");
    if (typeof openAuthModal === "function") openAuthModal("login");
    return;
  }

  // Estado visual do botão
  const btn = document.querySelector("#step-panel-3 .btn.primary");
  const btnOriginalText = btn ? btn.innerText : "Confirmar";
  if (btn) {
    btn.innerText = "Agendando...";
    btn.disabled = true;
  }

  const { date, slot } =
    typeof getCalendarSelection === "function"
      ? getCalendarSelection()
      : { date: "", slot: "" };
  const cartItems = typeof getCart === "function" ? getCart() : [];
  const valorTotal = typeof cartTotal === "function" ? cartTotal() : 0;

  const novoAgendamento = {
    cliente_id: authData.session.user.id,
    itens: cartItems,
    total: valorTotal,
    status: "Aguardando confirmação",
    detalhes: {
      cliente: { nome, telefone, endereco, obs },
      data: date,
      horario: slot,
      pagamento: window.selectedPaymentMethod,
    },
  };

  const { data: savedData, error } = await window.supabaseClient
    .from("agendamentos")
    .insert([novoAgendamento])
    .select();

  // Restaura o botão
  if (btn) {
    btn.innerText = btnOriginalText;
    btn.disabled = false;
  }

  if (error) {
    console.error("Erro no Supabase:", error);
    if (typeof showToast === "function")
      return showToast("Erro ao agendar. Tente novamente.");
    return alert("Erro ao agendar.");
  }

  // Puxando o ID e o novo número sequencial da OS
  const bookingId =
    savedData && savedData[0]
      ? savedData[0].id
      : "AG-" + Date.now().toString().slice(-6);

  // Pega o número sequencial do banco. Se por acaso falhar, cria um número provisório.
  const numeroOS =
    savedData && savedData[0] && savedData[0].ordem_servico
      ? savedData[0].ordem_servico
      : Math.floor(Math.random() * 9000 + 1000);

  // Transforma o número "1" em "0001" para ficar mais profissional
  const osFormatada = String(numeroOS).padStart(4, "0");

  // Adicionamos a 'osFormatada' dentro do objeto para o PDF e WhatsApp usarem
  const bookingDataForPDF = {
    id: bookingId,
    os: osFormatada,
    cliente: novoAgendamento.detalhes.cliente,
    itens: cartItems,
    total: valorTotal,
    data: date,
    horario: slot,
    pagamento: window.selectedPaymentMethod,
  };

  localStorage.setItem("gtk_last_booking", JSON.stringify(bookingDataForPDF));

  // Esvazia o carrinho usando a função nativa ou direto no localStorage
  if (typeof clearCart === "function") {
    clearCart();
  } else {
    localStorage.setItem("gtk_cart", JSON.stringify([]));
  }

  // Altera para a tela de sucesso
  const formArea = document.getElementById("checkout-form-area");
  const successArea = document.getElementById("checkout-success");

  if (formArea) formArea.classList.add("hidden");
  if (successArea) successArea.classList.remove("hidden");

  const fmtDate =
    typeof formatDatePtBr === "function" ? formatDatePtBr(date) : date;

  // Mostra a OS nova na tela de sucesso ao invés do código picotado
  const summaryEl = document.getElementById("success-summary");
  if (summaryEl) {
    summaryEl.innerHTML = `
      Agendamento <strong class="mono">OS-${osFormatada}</strong> confirmado para
      <strong>${fmtDate} às ${slot}</strong>.
    `;
  }

  const waBtn = document.getElementById("success-wa");
  if (waBtn && typeof gtkWhatsappLink === "function") {
    const mensagemWa = `Olá! Acabei de confirmar o agendamento da OS-${osFormatada} pelo site da GTK, agendado para ${fmtDate} às ${slot}.`;
    waBtn.href = gtkWhatsappLink(mensagemWa);
  }
};

// ============================================================
// PDF
// ============================================================
window.downloadOrcamentoPDF = function () {
  const booking = JSON.parse(
    localStorage.getItem("gtk_last_booking") || "null",
  );
  if (!booking) {
    if (typeof showToast === "function")
      showToast("Nenhum orçamento para baixar.");
    return;
  }

  if (!window.jspdf) {
    alert("Erro: Biblioteca PDF não carregada.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Pegamos a altura total da página (numa A4 padrão é aprox 297)
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginBottom = 20; // Margem de segurança no final da folha
  const maxY = pageHeight - marginBottom;

  const fmtMoney =
    typeof formatBRL === "function" ? formatBRL : (v) => "R$ " + v;
  const fmtDate =
    typeof formatDatePtBr === "function"
      ? formatDatePtBr(booking.data)
      : booking.data;

  // FUNÇÃO MÁGICA: Checa se a próxima linha vai estourar a página
  const checkPageBreak = (currentY, espacoNecessario) => {
    if (currentY + espacoNecessario > maxY) {
      doc.addPage();
      return 20; // Retorna o Y para o topo da nova página
    }
    return currentY;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GTK Elétrica e Info — Orçamento", 14, 18);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Usa o código OS salvo no checkout
  const numeroOS = booking.os || String(booking.id).substring(0, 8);
  doc.text(`Ordem de Serviço: OS-${numeroOS}`, 14, 28);
  doc.text(`Cliente: ${booking.cliente.nome}`, 14, 34);
  doc.text(`Telefone: ${booking.cliente.telefone}`, 14, 40);
  doc.text(`Endereço: ${booking.cliente.endereco}`, 14, 46);
  doc.text(`Data/horário: ${fmtDate} às ${booking.horario}`, 14, 52);
  doc.text(`Forma de pagamento: ${booking.pagamento}`, 14, 58);

  let y = 68;

  // Renderiza as observações linha por linha (para poder quebrar a página no meio delas se precisar)
  if (booking.cliente.obs && booking.cliente.obs.trim() !== "") {
    doc.setFont("helvetica", "bold");
    doc.text("Observações:", 14, y);
    doc.setFont("helvetica", "normal");
    y += 6;

    const obsLines = doc.splitTextToSize(booking.cliente.obs, 180);

    for (let i = 0; i < obsLines.length; i++) {
      y = checkPageBreak(y, 5); // Checa antes de cada linha
      doc.text(obsLines[i], 14, y);
      y += 5; // desce o espaço da linha
    }
    y += 4; // Espacinho extra antes da tabela
  } else {
    y = 76;
  }

  // Checa se o cabeçalho da tabela cabe
  y = checkPageBreak(y, 10);
  doc.setFont("helvetica", "bold");
  doc.text("Serviços", 14, y);
  doc.text("Qtd", 140, y);
  doc.text("Valor", 165, y);

  y += 6;
  doc.setFont("helvetica", "normal");

  // Renderiza os itens checando o fim da página
  if (booking.itens && Array.isArray(booking.itens)) {
    booking.itens.forEach((item) => {
      y = checkPageBreak(y, 7); // Checa antes de desenhar o item

      doc.text(item.name, 14, y);
      doc.text(String(item.qty), 143, y);
      const valorItem =
        typeof item.price === "number"
          ? fmtMoney(item.price * item.qty)
          : "A combinar";
      doc.text(valorItem, 165, y);
      y += 7;
    });
  }

  // Checa se tem espaço para o rodapé (total e mensagem final)
  y = checkPageBreak(y, 20);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.text(`Total estimado: ${fmtMoney(booking.total)}`, 14, y);

  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    "Orçamento sem compromisso. Valores podem variar após vistoria técnica.",
    14,
    y,
  );

  doc.save(`orcamento-gtk-OS-${numeroOS}.pdf`);
};

// ============================================================
// INICIALIZAÇÃO
// ============================================================
// Adicionamos o parâmetro "forcar" (padrão é falso)
async function preencherDadosCheckout(forcar = false) {
  if (typeof getPerfil !== "function") return;

  const perfil = await getPerfil();
  if (!perfil) return;

  const nomeEl = document.getElementById("chk-nome");
  const telEl = document.getElementById("chk-telefone");
  const endEl = document.getElementById("chk-endereco");

  // Agora ele preenche se estiver vazio OU se forçarmos a atualização
  if (nomeEl && (forcar || !nomeEl.value) && perfil.nome) {
    nomeEl.value = perfil.nome;
  }

  if (telEl && (forcar || !telEl.value) && perfil.telefone) {
    telEl.value = perfil.telefone;
  }

  if (
    endEl &&
    (forcar || !endEl.value) &&
    (perfil.logradouro || perfil.bairro)
  ) {
    const partes = [perfil.logradouro, perfil.bairro, perfil.cep].filter(
      Boolean,
    );
    endEl.value = partes.join(" - ");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof initCalendar === "function") {
    initCalendar("checkout-calendar", () => {});
  }

  setTimeout(() => {
    renderCheckoutSteps();
    preencherDadosCheckout(); // Carrega normal se a tela abrir
  }, 300);

  // NOVO: Fica escutando mudanças na autenticação do Supabase
  if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      // Se o evento for de login bem-sucedido
      if (event === "SIGNED_IN") {
        // Passamos 'true' para FORÇAR a substituição, apagando o que o
        // cliente digitou e colocando os dados reais do banco
        preencherDadosCheckout(true);
      }
    });
  }
});
