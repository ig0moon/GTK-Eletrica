// ============================================================
// CARRINHO LOCAL (BLINDADO E GLOBAL)
// ============================================================

window.CART_KEY = "gtk_cart";

// ------------------------------------------------------------
// 1. GERENCIAMENTO DE ESTADO (LocalStorage)
// ------------------------------------------------------------

window.getCart = function() {
  try {
    return JSON.parse(localStorage.getItem(window.CART_KEY)) || [];
  } catch {
    return [];
  }
};

window.saveCart = function(cart) {
  localStorage.setItem(window.CART_KEY, JSON.stringify(cart));
  window.updateCartBadge();
};

window.addToCart = function(service) {
  const cart = window.getCart();
  const existing = cart.find((i) => i.id === service.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...service, qty: 1 });
  }
  window.saveCart(cart);
  if (typeof showToast === "function") showToast(`"${service.name}" adicionado ao carrinho`);
};

window.removeFromCart = function(id) {
  window.saveCart(window.getCart().filter((i) => i.id !== id));
  // Atualiza as telas onde o carrinho estiver visível
  if (typeof window.renderCartPage === "function") window.renderCartPage();
  if (typeof window.renderReviewStep === "function") window.renderReviewStep(); 
};

window.changeQty = function(id, delta) {
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

window.clearCart = function() {
  localStorage.removeItem(window.CART_KEY);
  window.updateCartBadge();
  if (typeof window.renderCartPage === "function") window.renderCartPage();
};

window.cartCount = function() {
  return window.getCart().reduce((sum, i) => sum + i.qty, 0);
};

window.cartTotal = function() {
  return window.getCart().reduce((sum, i) => {
    return typeof i.price === "number" ? sum + i.qty * i.price : sum;
  }, 0);
};

window.formatBRL = function(value) {
  if (typeof value !== "number") return "A combinar";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

window.cartHasQuoteItems = function() {
  return window.getCart().some((i) => typeof i.price !== "number");
};

// ------------------------------------------------------------
// 2. RENDERIZAÇÃO DA INTERFACE (Página Carrinho)
// ------------------------------------------------------------

window.updateCartBadge = function() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = window.cartCount();
  badge.textContent = count;
  badge.classList.toggle("hidden", count === 0);
};

window.renderCartPage = function() {
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

  listRoot.innerHTML = cart.map((item) => `
    <div class="cart-item">
      <div class="swatch" style="background:${item.category === "elec" ? "var(--elec-bg)" : "var(--ti-bg)"};color:${item.category === "elec" ? "var(--elec-ink)" : "var(--ti-ink)"}">
        <span class="material-symbols-outlined">${item.icon}</span>
      </div>
      <div class="info">
        <h4>${item.name}</h4>
        <span>${window.formatBRL(item.price)} · a partir de</span>
      </div>
      <div class="qty-stepper">
        <button onclick="changeQty('${item.id}', -1)">–</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item.id}', 1)">+</button>
      </div>
      <button class="btn icon-btn sm" style="border:none; background:transparent" title="Remover" onclick="removeFromCart('${item.id}')">
        <span class="material-symbols-outlined" style="font-size:18px; color:var(--danger)">delete</span>
      </button>
    </div>`
  ).join("");

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

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  window.updateCartBadge();
  window.renderCartPage();
});