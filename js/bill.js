document.addEventListener('DOMContentLoaded', function () {
    // --- 🔐 Verificação de login ---
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    const vendedorNome = localStorage.getItem('vendedorNome');

    if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        window.location.href = 'login.html';
        return;
    }

    console.log('✅ Usuário logado:', userData);

    // --- 🧾 Obter valores salvos no localStorage ---
    const name = localStorage.getItem('name');
    const contaComSolar = localStorage.getItem('contaComSolar');

    // --- 🧍 Exibir o nome do cliente ---
    const nameElement = document.getElementById('name');
    if (name && nameElement) {
        nameElement.textContent = name;
    }

    // --- 💡 Exibir o valor da conta com solar ---
    const totalToPayElement = document.getElementById('total-to-pay');
    if (contaComSolar && totalToPayElement) {
        const valorNumerico = parseFloat(contaComSolar);
        totalToPayElement.textContent = 
            `R$ ${valorNumerico.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })}`;
    }

    // --- ⬅️ Botão "Voltar" ---
    const btnVoltar = document.getElementById('btn-voltar');
    if (btnVoltar) {
        btnVoltar.addEventListener('click', () => {
            const vendedor = vendedorNome || userData?.nome || 'vendedor';

            // 👇 Tente com o nome de arquivo que realmente existe
            const paginasPossiveis = [
                'vendedor.html',
                'conta-energiaVendor.html'
            ];

            // Escolhe a primeira que existir no mesmo diretório
            const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
            const destino = base + (paginasPossiveis.includes('vendedor.html') ? 'vendedor.html' : 'conta-energiaVendor.html') + `?vendedor=${encodeURIComponent(vendedor)}`;

            console.log('🔙 Redirecionando para:', destino);
            window.location.href = destino;
        });
    } else {
        console.warn('Botão "Voltar" não encontrado no DOM.');
    }
});
