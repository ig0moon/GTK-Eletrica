function renderCartPage() {
  const cart = getCart();
  const listRoot = document.getElementById("cart-list");
  const emptyRoot = document.getElementById("cart-empty");
  const summaryRoot = document.getElementById("cart-summary-body");
  const checkoutBtn = document.getElementById("go-checkout");

  if (cart.length === 0) {
    listRoot.innerHTML = "";
    emptyRoot.classList.remove("hidden");
    summaryRoot.innerHTML = `<div class="summary-row total"><span>Total</span><span>${formatBRL(0)}</span></div>`;
    checkoutBtn.setAttribute("disabled", "disabled");
    return;
  }

  emptyRoot.classList.add("hidden");
  checkoutBtn.removeAttribute("disabled");

  listRoot.innerHTML = cart
    .map(
      (item) => `
    <div class="cart-item">
      <div class="swatch" style="background:${item.category === "elec" ? "var(--elec-bg)" : "var(--ti-bg)"};color:${item.category === "elec" ? "var(--elec-ink)" : "var(--ti-ink)"}">${item.icon}</div>
      <div class="info">
        <h4>${item.name}</h4>
        <span>${formatBRL(item.price)} · a partir de</span>
      </div>
      <div class="qty-stepper">
        <button onclick="changeQty('${item.id}', -1); renderCartPage();">–</button>
        <span>${item.qty}</span>
        <button onclick="changeQty('${item.id}', 1); renderCartPage();">+</button>
      </div>
      <button class="btn icon-btn sm" title="Remover" onclick="removeFromCart('${item.id}'); renderCartPage();">✕</button>
    </div>`
    )
    .join("");

  const subtotal = cartTotal();
  summaryRoot.innerHTML = `
    <div class="summary-row"><span>Itens (${cartCount()})</span><span>${formatBRL(subtotal)}</span></div>
    <div class="summary-row"><span>Visita técnica</span><span>Incluída</span></div>
    <div class="summary-row total"><span>Total estimado</span><span>${formatBRL(subtotal)}</span></div>
  `;
}

document.addEventListener("DOMContentLoaded", renderCartPage);
