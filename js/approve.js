document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const returnBtn = document.getElementById('return-btn');

    const table = document.querySelector('table');
    const recordCount = document.getElementById('record-count');
    const pageNum = document.getElementById('page-num');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let clientes = [];
    let currentPage = 1;
    const recordsPerPage = 5;

    // ✅ Bloqueio de acesso caso não esteja logado
    if (!token) {
        alert('Acesso não autorizado. Faça login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    // ✅ O botão "Retornar" só some para Vendedor
    if (role === 'vendedor' && returnBtn) {
        returnBtn.style.display = 'none';
    }

    // 🚀 Função para buscar os clientes
    const fetchClientes = async () => {
        try {
            const response = await fetch('http://35.184.186.154:3000/clientes', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Erro ao buscar clientes');

            clientes = await response.json();
            recordCount.textContent = `Total de registros: ${clientes.length}`;
            displayClientes();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar os dados dos clientes.');
        }
    };

    // 🎨 Exibição dos clientes com linha acinzentada se "visualizado"
    const displayClientes = () => {
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        tbody.innerHTML = '';

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const clientesPagina = clientes.slice(start, end);

        clientesPagina.forEach(cliente => {
            const valorConta = cliente.contaLuz.trim().startsWith('R$') ? cliente.contaLuz : `R$ ${cliente.contaLuz}`;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.numero}</td>
                <td>${valorConta}</td>
                <td>${cliente.status}</td>
                <td>
                    <button class="btn-zap" onclick="abrirWhatsApp('${cliente.whatsappLink}', '${cliente.id}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </td>
            `;

            // ✅ Linha acinzentada caso "visualizado"
            if (cliente.status && cliente.status.trim().toLowerCase() === 'visualizado') {
                tr.classList.add('visualizado-row');
            }

            tbody.appendChild(tr);
        });

        pageNum.textContent = `Página ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = end >= clientes.length;
    };

    // 📞 Abre o WhatsApp e marca o cliente como "visualizado"
    window.abrirWhatsApp = async (link, id) => {
        window.open(link, '_blank');
        try {
            const response = await fetch(`http://35.184.186.154:3000/clientes/${id}/visualizado`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const cliente = clientes.find(c => c.id === id);
                if (cliente) cliente.status = 'visualizado';
                displayClientes(); // Atualiza a tabela
            } else {
                console.error('Erro ao atualizar status');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    };

    // 🔄 Paginação
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayClientes();
        }
    });

    nextBtn.addEventListener('click', () => {
        if ((currentPage * recordsPerPage) < clientes.length) {
            currentPage++;
            displayClientes();
        }
    });

    // 🚪 Logout
    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    };

    // 🚀 Inicialização
    fetchClientes();
});
