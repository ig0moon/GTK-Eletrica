// ============================================================
// AUTENTICAÇÃO COM SUPABASE (GLOBAL)
// ============================================================

// 1. Conexão segura (verifica se o Supabase existe na página antes de conectar)
if (typeof supabase !== 'undefined' && !window.supabaseClient) {
  window.supabaseClient = supabase.createClient(
    'https://xiulxcmuktmevzwahgne.supabase.co',
    'sb_publishable_HPBycOl241NPLVq1P6FFnw_9lqUzuQB'
  );
}

// 2. FORÇAR FUNÇÕES A SEREM GLOBAIS NO HTML (Resolve o "is not defined")
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.logout = logout;
window.getSession = getSession;

// ------------------------------------------------------------
// LÓGICA DE SESSÃO E AUTH
// ------------------------------------------------------------

async function getSession() {
  if (!window.supabaseClient) return null;
  const { data: { session }, error } = await window.supabaseClient.auth.getSession();
  if (error || !session) return null;

  return {
    nome: session.user.user_metadata?.nome || session.user.email.split('@')[0],
    email: session.user.email,
    role: session.user.user_metadata?.role || "cliente" 
  };
}

async function logout() {
  const { error } = await window.supabaseClient.auth.signOut();
  if (error) {
    if (typeof showToast === "function") showToast("Erro ao sair: " + error.message);
    return;
  }
  await refreshAuthHeaderState();
  if (typeof showToast === "function") showToast("Sessão encerrada.");
  
  // Redireciona para a home se o usuário der logout dentro da conta
  if (document.body.getAttribute('data-page') === 'conta') {
      window.location.href = 'index.html';
  }
}

function capitalize(str) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

async function refreshAuthHeaderState() {
  const authArea = document.getElementById("auth-header-area");
  const footerLinks = document.getElementById("footer-account-links");

  const user = await getSession();

  // HEADER
  if (authArea) {
    if (user) {
      authArea.innerHTML = `
        <div class="header-controls">
          <a href="conta.html" class="icon-circle-btn"><span class="material-symbols-outlined">person</span></a>
          <button class="icon-circle-btn" onclick="logout()"><span class="material-symbols-outlined">logout</span></button>
        </div>
      `;
    } else {
      authArea.innerHTML = `
        <button class="btn sm" onclick="openAuthModal('login')">Entrar</button>
      `;
    }
  }

  // FOOTER
  if (footerLinks) {
    if (user) {
      footerLinks.innerHTML = `
        <a href="conta.html">Minha Conta</a>
      `;
    } else {
      footerLinks.innerHTML = `
        <a href="#" onclick="openAuthModal('login'); return false;">Entrar</a>
        <a href="#" onclick="openAuthModal('register'); return false;">Criar conta</a>
      `;
    }
  }
}

// ------------------------------------------------------------
// MODAL DE AUTENTICAÇÃO
// ------------------------------------------------------------
function ensureAuthModal() {
  if (document.getElementById("auth-overlay")) return;
  const div = document.createElement("div");
  div.innerHTML = `
    <div class="overlay hidden" id="auth-overlay" onclick="if(event.target===this) closeAuthModal()">
      <div class="modal" id="login-box">
        <h2>Entrar na sua conta</h2>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="login-email" placeholder="seu@email.com">
        </div>
        <div class="field">
          <label>Senha</label>
          <input type="password" id="login-senha" placeholder="••••••••">
        </div>
        <button class="btn primary block" onclick="handleLogin()">Entrar</button>
        <div class="auth-link">Não tem conta? <a href="#" onclick="openAuthModal('register'); return false;">Cadastre-se</a></div>
      </div>

      <div class="modal hidden" id="register-box">
        <h2>Criar conta</h2>
        <div class="field">
          <label>Nome completo</label>
          <input type="text" id="reg-nome" placeholder="Como quer ser chamado?">
        </div>
        <div class="field">
          <label>E-mail</label>
          <input type="email" id="reg-email" placeholder="seu@email.com">
        </div>
        <div class="field">
          <label>Senha</label>
          <input type="password" id="reg-senha" placeholder="Mínimo de 6 caracteres">
        </div>
        <button class="btn primary block" onclick="handleRegister()">Cadastrar</button>
        <div class="auth-link">Já tem conta? <a href="#" onclick="openAuthModal('login'); return false;">Faça login</a></div>
      </div>
    </div>
  `;
  document.body.appendChild(div.firstElementChild);
}

function openAuthModal(mode = "login") {
  ensureAuthModal();
  document.getElementById("auth-overlay").classList.remove("hidden");
  toggleAuthMode(mode);
}

function closeAuthModal() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.classList.add("hidden");
}

function toggleAuthMode(mode) {
  document.getElementById("login-box").classList.toggle("hidden", mode !== "login");
  document.getElementById("register-box").classList.toggle("hidden", mode !== "register");
}

// ------------------------------------------------------------
// HANDLERS ASSÍNCRONOS
// ------------------------------------------------------------

async function handleLogin() {
  if (!window.supabaseClient) return alert("Erro: Conexão com o servidor falhou.");

  const email = document.getElementById("login-email").value.trim();
  const senha = document.getElementById("login-senha").value;

  if (!email || !senha) return showToast("Preencha e-mail e senha.");

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    if (error.message === 'Invalid login credentials') return showToast("E-mail ou senha inválidos.");
    return showToast(error.message);
  }

  await refreshAuthHeaderState();
  closeAuthModal();
  
  const nome = data.user.user_metadata?.nome || email.split('@')[0];
  showToast(`Bem-vindo, ${nome.split(" ")[0]}!`);
}

async function handleRegister() {
  if (!window.supabaseClient) return alert("Erro: Conexão com o servidor falhou.");

  const nome = document.getElementById("reg-nome").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const senha = document.getElementById("reg-senha").value;

  if (!nome || !email || senha.length < 6) {
    return showToast("Preencha nome, e-mail e uma senha com 6+ caracteres.");
  }

  const { data, error } = await window.supabaseClient.auth.signUp({
    email,
    password: senha,
    options: {
      data: {
        nome: capitalize(nome),
        role: "cliente" 
      }
    }
  });

  if (error) return showToast(error.message);

  await refreshAuthHeaderState();
  closeAuthModal();
  
  if (data.session === null) {
    showToast(`Conta criada!`);
  } else {
    showToast(`Conta criada! Bem-vindo, ${capitalize(nome).split(" ")[0]}.`);
  }
}

// ------------------------------------------------------------
// INICIALIZAÇÃO
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  // Não chama refreshAuthHeaderState() aqui: nesse momento o footer
  // (renderizado por header.js) ainda não existe no DOM, então a busca
  // por #footer-account-links sempre falhava. header.js chama essa
  // função uma única vez, depois de montar header E footer.
  if (window.supabaseClient) {
    window.supabaseClient.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION cobre o caso de navegar entre páginas já logado:
      // o Supabase restaura a sessão salva e dispara esse evento no
      // carregamento, mesmo sem um login/logout acontecer agora.
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'INITIAL_SESSION') {
        refreshAuthHeaderState();
      }
    });
  }
});