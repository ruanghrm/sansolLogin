document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('form');

  // Não remover ou ler 'usuarioLogado' aqui no carregamento para evitar logs errados

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('password').value.trim();

    if (!email || !senha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const response = await fetch('https://www.sansolenergiasolar.com.br/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Login realizado com sucesso!');

        // Armazenar dados no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        const nomeUsuario = data.nome || email;
        localStorage.setItem('nome', nomeUsuario);

        // Armazena objeto usuarioLogado para facilitar leitura depois
        localStorage.setItem('usuarioLogado', JSON.stringify({ nome: nomeUsuario }));

        console.log('Usuário logado:', nomeUsuario); // Log só após login bem-sucedido

        // Redireciona conforme perfil
        if (data.role === 'admin') {
          window.location.href = 'admin.html';
        } else if (data.role === 'vendedor') {
          window.location.href = 'approve.html';
        } else {
          alert('⚠️ Perfil de usuário desconhecido.');
        }
      } else {
        alert(`❌ Erro ao fazer login: ${data.error || 'Credenciais inválidas.'}`);
      }
    } catch (error) {
      console.error('❗ Erro na requisição:', error);
      alert('🌐 Erro de rede. Tente novamente mais tarde.');
    }
  });
});