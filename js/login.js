document.addEventListener('DOMContentLoaded', () => {
  // --- Elementos do DOM ---
  const loginForm = document.querySelector('form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitButton = loginForm.querySelector('button[type="submit"]');

  // --- Constantes ---
  const API_URL = 'https://backend.sansolenergiasolar.com.br/api/v1/auth/login';

  /**
   * Gerencia o estado de carregamento do formulário, desabilitando o botão
   * e alterando seu texto para fornecer feedback visual ao usuário.
   * @param {boolean} isLoading - `true` se a requisição está em andamento, `false` caso contrário.
   */
  const setFormLoading = (isLoading) => {
    submitButton.disabled = isLoading;
    submitButton.textContent = isLoading ? 'Entrando...' : 'Entrar';
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim();
    const senha = passwordInput.value.trim();

    if (!email || !senha) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    setFormLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();
      console.log('📥 Resposta completa da API de login:', data);

      if (response.ok) {
        // Armazena o token e dados do usuário no localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({
          nome: data.nome,
          email: data.email,
          role: data.role
        }));

        console.log(`✅ Login bem-sucedido: ${data.nome} (${data.role})`);

        // Redireciona o usuário de acordo com a role
        if (data.role === 'admin') {
          window.location.href = 'admin.html';
        } else if (data.role === 'vendedor') {
          window.location.href = 'approve.html';
        } else if (data.role === 'prospect') {
          window.location.href = 'approve.html' 
        } else if (data.role === 'sdr') {
          window.location.href = 'approve.html' 
        } else if (data.role === 'bdr') {
          window.location.href = 'approve.html' 
        }
         else {
          alert(`⚠️ Perfil "${data.role}" não possui página configurada.`);
          setFormLoading(false);
        }
      } else {
        alert(`❌ Erro ao fazer login: ${data.error || 'Credenciais inválidas.'}`);
        setFormLoading(false);
      }
    } catch (error) {
      console.error('❗ Erro na requisição:', error);
      alert('🌐 Erro de rede. Tente novamente mais tarde.');
      setFormLoading(false);
    }
  });
});