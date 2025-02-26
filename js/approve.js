document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const returnBtn = document.getElementById('return-btn');
    const acoes = document.getElementById('acoes');

    const table = document.querySelector('table');
    const recordCount = document.getElementById('record-count');
    const pageNum = document.getElementById('page-num');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let clientes = [];
    let clientesFiltrados = [];
    let currentPage = 1;
    const recordsPerPage = 5;

    if (!token) {
        alert('Acesso não autorizado. Faça login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    if (role === 'vendedor' && returnBtn) {
        returnBtn.style.display = 'none';
        acoes.style.display = 'none';
    }

    const fetchClientes = async () => {
        try {
            const response = await fetch('https://www.sansolenergiasolar.com.br/api/clientes', {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Erro ao buscar clientes');

            clientes = await response.json();
            clientesFiltrados = clientes;
            
            recordCount.textContent = `Total de registros: ${clientes.length}`;

            displayClientes();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar os dados dos clientes.');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        const filterDateInput = document.getElementById('filter-date');
        const filterOriginInput = document.getElementById('filter-origin');
        const applyFiltersBtn = document.getElementById('apply-filters');

        applyFiltersBtn.addEventListener('click', () => {
            const filterDate = filterDateInput.value;
            const filterOrigin = filterOriginInput.value.toLowerCase().trim();

            console.log(`Filtro de Data: ${filterDate}, Filtro de Origem: ${filterOrigin}`); 

            clientesFiltrados = clientes.filter(cliente => {
                const dataCliente = cliente.createdAt ? cliente.createdAt.split('T')[0] : '';
                const origemCliente = cliente.origem ? cliente.origem.toLowerCase() : '';

                const filtraData = filterDate ? dataCliente === filterDate : true;
                const filtraOrigem = filterOrigin ? origemCliente.includes(filterOrigin) : true;

                return filtraData && filtraOrigem;
            });

            console.log(`Clientes filtrados:`, clientesFiltrados); 

            recordCount.textContent = `Total de registros: ${clientesFiltrados.length}`

            currentPage = 1;
            displayClientes(clientesFiltrados);
        });
    });

    const deleteCliente = async (id) => {
        if (confirm('Tem certeza que deseja excluir este cliente?')) {
            try {
                const response = await fetch(`https://www.sansolenergiasolar.com.br/api/clientes/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    clientes = clientes.filter(cliente => cliente.id !== id);
                    clientesFiltrados = clientesFiltrados.filter(cliente => cliente.id !== id);

                    alert('Cliente removido com sucesso.');
                    displayClientes();
                } else {
                    alert('Falha ao remover o cliente.');
                }
            } catch (error) {
                console.error('Erro ao excluir cliente:', error);
            }
        }
    };

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', options).format(date);
    };

    const displayClientes = () => {
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        tbody.innerHTML = '';

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const clientesPagina = clientesFiltrados.slice(start, end);

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
                <td>
                    <button class="btn-delete" style="${role === 'vendedor' ? 'display: none;' : ''}" onclick="deleteCliente('${cliente.id}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

            if (cliente.status && cliente.status.trim().toLowerCase() === 'visualizado') {
                tr.classList.add('visualizado-row');
            }

            tbody.appendChild(tr);
        });

        recordCount.textContent = `Total de registros: ${clientesFiltrados.length}`

        pageNum.textContent = `Página ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = end >= clientesFiltrados.length;
    };

    window.deleteCliente = deleteCliente;

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayClientes();
        }
    });

    nextBtn.addEventListener('click', () => {
        if ((currentPage * recordsPerPage) < clientesFiltrados.length) {
            currentPage++;
            displayClientes();
        }
    });

    fetchClientes();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('phone');
    alert("Você foi deslogado.");

    window.location.href = 'login.html';
}


// async function fetchPageViews() {

//     const response = await fetch('https://api.exemplo.com/analytics/visitas', {
//       method: 'GET',
//       headers: {
//         'Authorization': `Bearer YOUR_ACCESS_TOKEN`
//       }
//     });

//     const data = await response.json();

//     const pageViews = data.pageViews;

//     document.getElementById('visitCount').innerText = pageViews;
//   }

//   window.onload = fetchPageViews;

async function abrirWhatsApp(link, id) {
    const token = localStorage.getItem('token');

    try {
        window.open(link, '_blank');

        const response = await fetch(`https://www.sansolenergiasolar.com.br/api/clientes/${id}/visualizado`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
            alert('Status do cliente atualizado para "visualizado".');
            fetchClientes();
        } else {
            alert('Falha ao atualizar o status do cliente.');
        }
    } catch (error) {
        // console.error('Erro ao abrir o WhatsApp ou atualizar status:', error);
        // alert('Ocorreu um erro ao processar a ação.');
    }
}


