function switchTab(tabId) {
  document.querySelectorAll('.help-cat').forEach(btn => btn.classList.remove('active'));
  document.getElementById('tab-' + tabId).classList.add('active');
  document.querySelectorAll('.conta-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById('panel-' + tabId).classList.remove('hidden');
}

async function carregarDadosConta() {
  const user = await window.getSession();
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  document.getElementById('user-greeting').textContent = `Olá, ${user.nome.split(" ")[0]}`;
  document.getElementById('conta-email').value = user.email;

  const perfil = await window.getPerfil();
  if (perfil) {
    document.getElementById('conta-nome').value = perfil.nome || user.nome || '';
    document.getElementById('conta-tel').value = perfil.telefone || '';
    document.getElementById('conta-cep').value = perfil.cep || '';
    document.getElementById('conta-bairro').value = perfil.bairro || '';
    document.getElementById('conta-endereco').value = perfil.logradouro || '';
  } else {
    document.getElementById('conta-nome').value = user.nome || '';
  }
}

window.salvarDados = async function () {
  if (!window.supabaseClient) return showToast("Erro: Supabase não conectado.");

  const { data: { session } } = await window.supabaseClient.auth.getSession();
  if (!session) return showToast("Sessão expirada. Faça login novamente.");

  const nome = document.getElementById('conta-nome').value.trim();
  const telefone = document.getElementById('conta-tel').value.trim();
  const cep = document.getElementById('conta-cep').value.trim();
  const bairro = document.getElementById('conta-bairro').value.trim();
  const logradouro = document.getElementById('conta-endereco').value.trim();

  // Atualiza a tabela perfis
  const { error: perfilError } = await window.supabaseClient
    .from('perfis')
    .update({ nome, telefone, cep, bairro, logradouro, updated_at: new Date().toISOString() })
    .eq('id', session.user.id);

  if (perfilError) {
    console.error(perfilError);
    return showToast("Erro ao salvar dados.");
  }

  // Mantém o nome sincronizado no user_metadata (usado no header/saudação)
  await window.supabaseClient.auth.updateUser({ data: { nome, telefone } });

  showToast("Dados salvos com sucesso!");
  document.getElementById('user-greeting').textContent = `Olá, ${nome.split(" ")[0]}`;
}; 

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(carregarDadosConta, 500);
});