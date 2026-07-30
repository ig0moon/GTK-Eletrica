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
    (l) =>
      `<a href="${l.href}" class="${l.page === activePage ? "active" : ""}">${l.label}</a>`,
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
    <span id="theme-icon" class="material-symbols-outlined" style="font-size:20px">dark_mode</span>
  </button>

  <a href="tecnico.html" class="icon-circle-btn hidden" id="btn-area-tecnico" title="Área do Técnico">
    <span class="material-symbols-outlined" style="font-size:20px">engineering</span>
  </a>

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
}

function verificarBotaoTecnico() {
  if (!window.supabaseClient) return;

  window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
    const btnTecnico = document.getElementById("btn-area-tecnico");
    if (!btnTecnico) return;

    if (!session) {
      btnTecnico.classList.add("hidden");
      return;
    }

    const perfil = typeof getPerfil === "function" ? await getPerfil() : null;
    const temAcesso =
      perfil &&
      ((perfil.cargo === "colaborador" && perfil.especialidade) ||
        perfil.cargo === "admin");
    btnTecnico.classList.toggle("hidden", !temAcesso);
  });
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
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
        <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
      </svg>
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

  if (typeof refreshAuthHeaderState === "function") {
    refreshAuthHeaderState();
  }

  verificarBotaoTecnico(); // agora só registra o listener, não faz a checagem direto
});
