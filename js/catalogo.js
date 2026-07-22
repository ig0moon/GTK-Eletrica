function renderServiceGrid(containerId, category) {
  const root = document.getElementById(containerId);
  if (!root) return;
  const items = getCatalogByCategory(category);
  root.innerHTML = items
    .map(
      (s) => `
    <div class="service-card ${s.category}">
      <div class="swatch">${s.icon}</div>
      <h4>${s.name}</h4>
      <p class="desc">${s.desc}</p>
      <div class="price-row">
        <span class="price">${formatBRL(s.price)}<br><small>a partir de</small></span>
        <button class="btn ${s.category === "elec" ? "elec" : "ti"} sm" onclick="addToCart(findService('${s.id}'))">+ Carrinho</button>
      </div>
    </div>`
    )
    .join("");
}

function setBreakerScroll(target) {
  const el = document.getElementById(target);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

document.addEventListener("DOMContentLoaded", () => {
  renderServiceGrid("grid-elec", "elec");
  renderServiceGrid("grid-ti", "ti");

  // se a URL trouxer #elec ou #ti, ajusta o breaker e rola até lá
  const hash = window.location.hash.replace("#", "");
  if (hash === "ti") {
    document.getElementById("breaker-ti").checked = true;
  }
});
