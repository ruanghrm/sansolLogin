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

    if (!token) {
        alert('Acesso não autorizado. Faça login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    if (role === 'vendedor' && returnBtn) {
        returnBtn.style.display = 'none';
    }

    const fetchClientes = async () => {
        try {
            const response = await fetch('https://www.sansolenergiasolar.com.br/api/clientes', {
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

    const applyFilters = () => {
        const dateFilter = document.getElementById('filter-date').value;
        const originFilter = document.getElementById('filter-origin').value.toLowerCase(); // Ignorando maiúsculas/minúsculas

        const filteredClientes = clientes.filter(cliente => {
            const matchDate = dateFilter ? cliente.createdAt.startsWith(dateFilter) : true;
            const matchOrigin = originFilter ? cliente.origem.toLowerCase().includes(originFilter) : true;
            return matchDate && matchOrigin;
        });

        displayClientes(filteredClientes);
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    };

    const displayClientes = (clientesToDisplay = clientes) => {
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        tbody.innerHTML = '';

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const clientesPagina = clientesToDisplay.slice(start, end);

        clientesPagina.forEach(cliente => {
            const valorConta = cliente.contaLuz.trim().startsWith('R$') ? cliente.contaLuz : `R$ ${cliente.contaLuz}`;
            const dataCadastro = formatDate(cliente.createdAt);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente.nome}</td>
                <td>${cliente.origem}</td>
                <td>${cliente.numero}</td>
                <td>${valorConta}</td>
                <td>${dataCadastro}</td>
                <td>${cliente.status}</td>
                <td>
                    <button class="btn-zap" onclick="abrirWhatsApp('${cliente.whatsappLink}', '${cliente.id}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </td>
            `;

            if (cliente.status && cliente.status.trim().toLowerCase() === 'visualizado') {
                tr.classList.add('visualizado-row');
            }
            console.log(cliente.vendedor)

            tbody.appendChild(tr);
        });

        pageNum.textContent = `Página ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = end >= clientesToDisplay.length;
    };

    document.getElementById('apply-filters').addEventListener('click', applyFilters);

    window.abrirWhatsApp = async (link, id) => {
        window.open(link, '_blank');
        try {
            const response = await fetch(`https://www.sansolenergiasolar.com.br/api/clientes/${id}/visualizado`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const cliente = clientes.find(c => c.id === id);
                if (cliente) cliente.status = 'visualizado';
                displayClientes(); 
            } else {
                console.error('Erro ao atualizar status');
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    };

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

    window.logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    };

    fetchClientes();
});
