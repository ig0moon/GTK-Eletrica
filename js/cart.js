// ============================================================
// CARRINHO LOCAL (BLINDADO E GLOBAL)
// ============================================================

window.CART_KEY = "gtk_cart";

// ------------------------------------------------------------
// 1. GERENCIAMENTO DE ESTADO (LocalStorage)
// ------------------------------------------------------------

window.getCart = function () {
  try {
    return JSON.parse(localStorage.getItem(window.CART_KEY)) || [];
  } catch {
    return [];
  }
};

window.saveCart = function (cart) {
  localStorage.setItem(window.CART_KEY, JSON.stringify(cart));
  window.updateCartBadge();
};

window.addToCart = function (service) {
  const cart = window.getCart();
  const existing = cart.find((i) => i.id === service.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...service, qty: 1 });
  }
  window.saveCart(cart);
  if (typeof showToast === "function")
    showToast(`"${service.name}" adicionado ao carrinho`);
};

window.removeFromCart = function (id) {
  window.saveCart(window.getCart().filter((i) => i.id !== id));
  // Atualiza as telas onde o carrinho estiver visível
  if (typeof window.renderCartPage === "function") window.renderCartPage();
  if (typeof window.renderReviewStep === "function") window.renderReviewStep();
};

window.changeQty = function (id, delta) {
  const cart = window.getCart();
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.qty += delta;

  if (item.qty <= 0) {
    window.saveCart(cart.filter((i) => i.id !== id));
  } else {
    window.saveCart(cart);
  }

  if (typeof window.renderCartPage === "function") window.renderCartPage();
  if (typeof window.renderReviewStep === "function") window.renderReviewStep();
};

window.clearCart = function () {
  localStorage.removeItem(window.CART_KEY);
  window.updateCartBadge();
  if (typeof window.renderCartPage === "function") window.renderCartPage();
};

window.cartCount = function () {
  return window.getCart().reduce((sum, i) => sum + i.qty, 0);
};

window.cartTotal = function () {
  return window.getCart().reduce((sum, i) => {
    return typeof i.price === "number" ? sum + i.qty * i.price : sum;
  }, 0);
};

window.formatBRL = function (value) {
  if (typeof value !== "number") return "A combinar";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

window.cartHasQuoteItems = function () {
  return window.getCart().some((i) => typeof i.price !== "number");
};

// ------------------------------------------------------------
// 2. RENDERIZAÇÃO DA INTERFACE (Página Carrinho)
// ------------------------------------------------------------

window.updateCartBadge = function () {
  const count = window.cartCount();
  
  // Atualiza o carrinho lá no Header (topo)
  const badge = document.getElementById("cart-count");
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }

  // Atualiza e controla a exibição do botão flutuante
  const floatBtn = document.getElementById("floating-cart-btn");
  const floatBadge = document.getElementById("floating-cart-count");
  
  if (floatBtn && floatBadge) {
    floatBadge.textContent = count;
    // Só mostra o botão flutuante se tiver algo no carrinho!
    floatBtn.style.display = count > 0 ? "flex" : "none";
  }
};

window.renderCartPage = function () {
  const listRoot = document.getElementById("cart-list");
  const emptyRoot = document.getElementById("cart-empty");
  const summaryRoot = document.getElementById("cart-summary-body");
  const checkoutBtn = document.getElementById("go-checkout");

  // Se não estivermos na tela do carrinho principal, interrompe
  if (!listRoot || !emptyRoot || !summaryRoot) return;

  const cart = window.getCart();

  // TRAVA: Carrinho Vazio
  if (cart.length === 0) {
    listRoot.innerHTML = "";
    emptyRoot.classList.remove("hidden");
    summaryRoot.innerHTML = `<div class="summary-row total"><span>Total</span><span>${window.formatBRL(0)}</span></div>`;

    if (checkoutBtn) {
      checkoutBtn.disabled = true;
      checkoutBtn.style.opacity = "0.5";
      checkoutBtn.style.pointerEvents = "none";
    }
    return;
  }

  emptyRoot.classList.add("hidden");

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
    checkoutBtn.style.opacity = "1";
    checkoutBtn.style.pointerEvents = "auto";
  }

  listRoot.innerHTML = cart
    .map(
      (item) => `
  <div class="cart-item">
    <div class="swatch" style="background:${item.category === "elec" ? "var(--elec-bg)" : "var(--ti-bg)"};color:${item.category === "elec" ? "var(--elec-ink)" : "var(--ti-ink)"}">
      <span class="material-symbols-outlined">${item.icon}</span>
    </div>
    <div class="info">
      <h4>${item.name}</h4>
      <span>${window.formatBRL(item.price)} · a partir de</span>
      <div class="cart-item-actions">
        <div class="qty-stepper">
          <button onclick="changeQty('${item.id}', -1)">–</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>
        <button class="btn icon-btn sm cart-remove-btn" title="Remover" onclick="removeFromCart('${item.id}')">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  </div>`,
    )
    .join("");

  const subtotal = window.cartTotal();
  const temOrcamento = window.cartHasQuoteItems();
  const temItemFixo = window.getCart().some((i) => typeof i.price === "number");

  let totalTexto;
  if (temItemFixo && temOrcamento) {
    totalTexto = `${window.formatBRL(subtotal)} + a combinar`;
  } else if (temItemFixo) {
    totalTexto = window.formatBRL(subtotal);
  } else if (temOrcamento) {
    totalTexto = "A combinar";
  } else {
    totalTexto = window.formatBRL(0);
  }

  summaryRoot.innerHTML = `
    <div class="summary-row"><span>Itens (${window.cartCount()})</span><span>${window.formatBRL(subtotal)}</span></div>
    <div class="summary-row"><span>Visita técnica</span><span>A combinar</span></div>
    ${temOrcamento ? `<div class="summary-row"><span>Itens a combinar</span><span>Orçamento à parte</span></div>` : ""}
    <div class="summary-row total"><span>Total estimado</span><span>${totalTexto}</span></div>
  `;
};

// Função que injeta o botão flutuante em todas as páginas
window.injectFloatingCart = function() {
  // Se já estivermos na página do carrinho, não precisa do botão flutuante
  if (document.body.getAttribute('data-page') === 'carrinho') return;

  // Evita criar o botão duplicado
  if (document.getElementById('floating-cart-btn')) return;

  const btn = document.createElement('a');
  btn.id = 'floating-cart-btn';
  btn.href = 'carrinho.html';
  
  // Estilo do botão embutido (fica logo acima do WhatsApp no canto direito)
  btn.style.cssText = `
    position: fixed;
    bottom: 90px; /* Altura ideal para não sobrepor o WhatsApp */
    right: 20px;
    background-color: var(--ink); /* Usa a cor principal do seu tema */
    color: var(--bg);
    width: 56px;
    height: 56px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 998;
    text-decoration: none;
    transition: transform 0.2s ease, background-color 0.2s ease;
    display: none; /* Começa oculto até o JS verificar se tem itens */
  `;

  // HTML interno do botão (Ícone + Bolinha vermelha)
  btn.innerHTML = `
    <span class="material-symbols-outlined" style="font-size: 24px;">shopping_cart</span>
    <span id="floating-cart-count" style="
      position: absolute;
      top: -2px;
      right: -2px;
      background: var(--danger, #e74c3c);
      color: white;
      font-size: 11px;
      font-weight: bold;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--bg);
    ">0</span>
  `;

  // Efeito de pulo ao passar o mouse (desktop)
  btn.onmouseenter = () => btn.style.transform = "scale(1.08)";
  btn.onmouseleave = () => btn.style.transform = "scale(1)";

  document.body.appendChild(btn);
};

// ============================================================
// INICIALIZAÇÃO DO CARRINHO
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  window.injectFloatingCart(); // Cria o botão
  window.updateCartBadge();    // Atualiza contagens e mostra se necessário
  
  if (typeof window.renderCartPage === "function") {
    window.renderCartPage();
  }
});
