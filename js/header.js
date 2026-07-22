// ============================================================
// LAYOUT COMPARTILHADO — injeta header, footer, botão de WhatsApp
// e o container de toast em qualquer página que tenha os
// elementos <div id="site-header">, <div id="site-footer"> e
// <div id="toast-root">.
// ============================================================
const NAV_LINKS = [
  { href: "index.html", label: "Início", page: "inicio" },
  { href: "catalogo.html", label: "Catálogo", page: "catalogo" },
  { href: "sobre.html", label: "Sobre", page: "sobre" },
  { href: "ajuda.html", label: "Ajuda", page: "ajuda" },
];

function renderHeader() {
  const root = document.getElementById("site-header");
  if (!root) return;
  const activePage = document.body.dataset.page || "";

  const navHTML = NAV_LINKS.map(
    (l) => `<a href="${l.href}" class="${l.page === activePage ? "active" : ""}">${l.label}</a>`
  ).join("");

  root.innerHTML = `
    <div class="header-inner">
      <a href="index.html" class="brand">
        <span class="bolt">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 11-14h-7z"/></svg>
        </span>
        <span>GTK<small>Elétrica &amp; Info</small></span>
      </a>

      <nav class="main-nav" id="main-nav">${navHTML}</nav>

      <div class="header-controls">
        <button class="icon-circle-btn" onclick="toggleDarkMode()" title="Alternar modo escuro">
          <span id="theme-icon" class="material-symbols-outlined" style="font-size:19px">dark_mode</span>
        </button>

        <a href="carrinho.html" class="icon-circle-btn" title="Carrinho">
          <span id="cart-header" class="material-symbols-outlined">shopping_cart</span>
          <span id="cart-count" class="cart-badge hidden">0</span>
        </a>

        <div id="auth-header-area">
          <button class="btn sm" onclick="openAuthModal('login')">Entrar</button>
        </div>

        <button class="hamburger" onclick="toggleMobileNav()" title="Menu">☰</button>
      </div>
    </div>
  `;

  updateThemeIcon();
  updateCartBadge();
  refreshAuthHeaderState();
}

function toggleMobileNav() {
  document.getElementById("main-nav").classList.toggle("mobile-open");
}

function renderFooter() {
  const root = document.getElementById("site-footer");
  if (!root) return;
  root.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="brand" style="margin-bottom:10px">
            <span class="bolt"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h7l-1 8 11-14h-7z"/></svg></span>
            <span>GTK<small>Elétrica &amp; Info</small></span>
          </div>
          <p>Elétrica e T.I no mesmo agendamento — para casa e escritório.</p>
        </div>
        <div>
          <h5>Navegação</h5>
          <a href="catalogo.html">Catálogo</a>
          <a href="carrinho.html">Carrinho</a>
          <a href="sobre.html">Sobre</a>
        </div>
        <div>
          <h5>Suporte</h5>
          <a href="ajuda.html">Central de ajuda</a>
          <a href="#" id="footer-wa-link">Falar no WhatsApp</a>
        </div>
        <div>
          <h5>Conta</h5>
          <div id="footer-account-links">
            <a href="#" onclick="openAuthModal('login'); return false;">Entrar</a>
            <a href="#" onclick="openAuthModal('register'); return false;">Criar conta</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${new Date().getFullYear()} GTK Elétrica e Info</span>
        <span>Feito para agendar rápido e sem dor de cabeça.</span>
      </div>
    </div>
  `;
  const waLink = document.getElementById("footer-wa-link");
  if (waLink) waLink.href = gtkWhatsappLink();
}

function renderWhatsappFloat() {
  const root = document.getElementById("wa-float-root");
  if (!root) return;
  root.innerHTML = `
    <a class="wa-float" href="${gtkWhatsappLink()}" target="_blank" rel="noopener" title="Falar no WhatsApp">
      <svg width="28" height="28" viewBox="0 0 32 32" fill="#fff"><path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.383.7 4.6 1.902 6.463L4 29l7.72-1.862A11.93 11.93 0 0 0 16.001 27C22.63 27 28 21.627 28 15S22.63 3 16.001 3zm0 21.7c-1.98 0-3.82-.55-5.393-1.503l-.386-.23-4.58 1.104 1.13-4.463-.252-.398A9.66 9.66 0 0 1 5.3 15c0-5.906 4.794-10.7 10.7-10.7S26.7 9.094 26.7 15 21.907 24.7 16.001 24.7zm5.86-8.02c-.32-.16-1.89-.933-2.183-1.04-.293-.107-.507-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.213-.373.24-.693.08-.32-.16-1.35-.497-2.573-1.587-.951-.848-1.593-1.895-1.78-2.215-.187-.32-.02-.493.14-.653.144-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.213.053-.4-.027-.56-.08-.16-.72-1.733-.986-2.373-.26-.626-.524-.54-.72-.55l-.613-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.666s1.146 3.093 1.306 3.307c.16.213 2.253 3.44 5.46 4.826.763.33 1.359.527 1.823.674.766.244 1.463.21 2.014.127.614-.092 1.89-.773 2.157-1.52.267-.746.267-1.386.187-1.52-.08-.133-.293-.213-.613-.373z"/></svg>
    </a>
  `;
}

function showToast(message, duration = 2600) {
  let toast = document.getElementById("toast");
  if (!toast) {
    const root = document.getElementById("toast-root") || document.body;
    toast = document.createElement("div");
    toast.className = "toast";
    toast.id = "toast";
    root.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("show"), duration);
}

document.addEventListener("DOMContentLoaded", () => {
  renderHeader();
  renderFooter();
  renderWhatsappFloat();
});
