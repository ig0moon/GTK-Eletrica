// Função para alternar entre as abas da conta
    function switchTab(tabId) {
      // 1. Remove a classe 'active' de todos os botões
      document.querySelectorAll('.help-cat').forEach(btn => {
        btn.classList.remove('active');
      });
      // 2. Adiciona 'active' no botão clicado
      document.getElementById('tab-' + tabId).classList.add('active');

      // 3. Esconde todos os painéis
      document.querySelectorAll('.conta-panel').forEach(panel => {
        panel.classList.add('hidden');
      });
      // 4. Mostra o painel correto
      document.getElementById('panel-' + tabId).classList.remove('hidden');
    }

    // Carregar dados do usuário assim que a tela abrir
    document.addEventListener("DOMContentLoaded", () => {
      // Pequeno timeout ou Listener dependendo de como você expôs o getSession no JS modular
      setTimeout(async () => {
        // Se a função getSession existir globalmente ou você conseguir acessá-la:
        try {
          // O auth.js (novo) tem o getSession, vamos pegar os dados lá
          // Obs: se getSession não for global, adapte para export/import
          if(window.getSession) {
            const user = await window.getSession();
            if(user) {
              document.getElementById('user-greeting').textContent = `Olá, ${user.nome.split(" ")[0]}`;
              document.getElementById('conta-nome').value = user.nome;
              document.getElementById('conta-email').value = user.email;
            } else {
              // Redireciona para home se tentar acessar a conta deslogado
              window.location.href = 'index.html'; 
            }
          }
        } catch(e) {
           console.log("Aguardando auth.js...", e);
        }
      }, 500);
    });