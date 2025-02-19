document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
  
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Acesso não autorizado. Faça login primeiro.');
      window.location.href = 'login.html';
      return;
    }
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
  
      const nome = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const senha = document.getElementById('password').value.trim();
      const role = document.getElementById('role').value === 'Administrador' ? 'admin' : 'vendedor';
  
      if (!nome || !email || !senha || !role) {
        alert('Por favor, preencha todos os campos.');
        return;
      }
  
      const userData = { nome, email, senha, role };
      console.log('📤 Dados a serem enviados:', userData);
  
      try {
        const response = await fetch('http://35.184.186.154:3000/usuarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(userData),
        });
  
        const data = await response.json();
        console.log('📩 Resposta da API:', data);
  
        if (response.ok) {
          alert('✅ Usuário cadastrado com sucesso!');
          window.location.href = 'admin.html';
        } else {
          console.error('❌ Erro ao cadastrar usuário:', data);
          alert(`Erro ao cadastrar usuário: ${data.error || data.message || 'Tente novamente.'}`);
          if (response.status === 401) {
            alert('Sessão expirada. Faça login novamente.');
            window.location.href = 'login.html';
          }
        }
      } catch (error) {
        console.error('🔥 Erro inesperado na requisição:', error);
        alert(`Erro de rede ou no servidor: ${error.message}`);
      }
    });
  });
  