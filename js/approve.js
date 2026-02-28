document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'https://backend.sansolenergiasolar.com.br/api/v1';
    const RECORDS_PER_PAGE = 5; // 5 registros por página
    let currentPage = 1;
    let clientes = [];
    let pagination = {};

    let totalClientes = 0;
    let totalVisualizados = 0;
    let totalPendentes = 0;

    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { role, nome: nomeUsuario } = user;

    if (!token) {
        alert('Acesso não autorizado. Faça login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    // Função genérica para verificar validade do token nas requisições
    async function safeFetch(url, options = {}) {
        const response = await fetch(url, options);
        if (response.status === 401) {
            alert('Sua sessão expirou. Faça login novamente.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            throw new Error('Token expirado');
        }
        return response;
    }

    // Elementos do DOM
    const returnBtn = document.getElementById('return-btn');
    const excel = document.getElementById('excel');
    const table = document.querySelector('table');
    const tableBody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
    const recordCount = document.getElementById('record-count');
    const pageNum = document.getElementById('page-num');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const filterDateInput = document.getElementById('filter-date');
    const filterOriginInput = document.getElementById('filter-origin');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const clearFiltersBtn = document.getElementById('clear-filters');
    const registerClientBtn = document.getElementById('register-client-btn');
    const logoutBtn = document.getElementById('logout-btn');

    const safeLower = (v) => (v ?? '').toString().trim().toLowerCase();

    // Estado do filtro
    let filteredClientes = null;

    /** Busca todos os clientes apenas para contagem de status */
    const fetchAllClientesStatus = async () => {
        try {
            const response = await safeFetch(`${API_BASE_URL}/clientes/todos`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Erro ao buscar todos os clientes');

            const allClientes = await response.json();

            totalClientes = allClientes.length;
            totalVisualizados = allClientes.filter(c => safeLower(c.status) === 'visualizado').length;
            totalPendentes = allClientes.filter(c => safeLower(c.status) === 'pendente').length;

            atualizarContadoresGerais();
        } catch (error) {
            console.error('Erro ao buscar todos os clientes:', error);
        }
    };

    /** Atualiza contadores gerais na tela */
    const atualizarContadoresGerais = () => {
        let contadorWrapper = document.getElementById('contadorWrapper');
        if (!contadorWrapper) {
            contadorWrapper = document.createElement('div');
            contadorWrapper.id = 'contadorWrapper';
            contadorWrapper.style.display = 'flex';
            contadorWrapper.style.flexDirection = 'column';
            contadorWrapper.style.marginTop = '5px';
            recordCount.parentNode.appendChild(contadorWrapper);
        }

        let visualizadosSpan = document.getElementById('visualizadosCount');
        if (!visualizadosSpan) {
            visualizadosSpan = document.createElement('span');
            visualizadosSpan.id = 'visualizadosCount';
            contadorWrapper.appendChild(visualizadosSpan);
        }
        visualizadosSpan.textContent = `Visualizados (geral): ${totalVisualizados}`;

        let pendentesSpan = document.getElementById('pendentesCount');
        if (!pendentesSpan) {
            pendentesSpan = document.createElement('span');
            pendentesSpan.id = 'pendentesCount';
            contadorWrapper.appendChild(pendentesSpan);
        }
        pendentesSpan.textContent = `Pendentes (geral): ${totalPendentes}`;
    };

    /** Renderiza clientes na tabela */
    const displayClientes = () => {
        tableBody.innerHTML = '';

        clientes.forEach(cliente => {
            const valorConta = cliente?.contaLuz ? `R$ ${cliente.contaLuz.replace('R$', '').trim()}` : '-';
            const dataCadastro = cliente?.createdAt ? new Date(cliente.createdAt).toLocaleString('pt-BR') : '-';

            const tr = document.createElement('tr');
            tr.dataset.clientId = cliente.id;
            tr.dataset.whatsappLink = cliente.whatsappLink;

            tr.innerHTML = `
            <td>${cliente.nome ?? '-'}</td>
            <td>${cliente.origem ?? '-'}</td>
            <td>${cliente.observacoes ?? '-'}</td>
            <td>${cliente.numero ?? '-'}</td>
            <td>${valorConta}</td>
            <td>${dataCadastro}</td>
            <td>${cliente.status ?? '-'}</td>
            <td>
                ${cliente.latitude && cliente.longitude
                    ? `<a href="https://www.google.com/maps?q=${cliente.latitude},${cliente.longitude}" target="_blank">
                        <i class="fas fa-map-marker-alt" style="color: #1e90ff;"></i>
                    </a>`
                    : '<span style="color: #888;">Nulo</span>'}
            </td>
            <td><button class="btn-zap"><i class="fab fa-whatsapp"></i> WhatsApp</button></td>
            <td><button class="btn-delete ${role === 'vendedor' ? 'hidden-for-vendedor' : ''}">
                    <i class="fas fa-trash-alt"></i>
                </button></td>
        `;

            if (safeLower(cliente.status) === 'visualizado') tr.classList.add('visualizado-row');
            tableBody.appendChild(tr);
        });

        recordCount.textContent = `Total de registros nesta página: ${clientes.length} | Total geral: ${totalClientes}`;
        pageNum.textContent = `Página ${currentPage} de ${filteredClientes ? Math.ceil(filteredClientes.length / RECORDS_PER_PAGE) : (pagination.total_pages || '-')}`;

        // Habilita/desabilita botões
        if (filteredClientes) {
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= Math.ceil(filteredClientes.length / RECORDS_PER_PAGE);
        } else {
            prevBtn.disabled = !pagination.has_prev;
            nextBtn.disabled = !pagination.has_next;
        }

        atualizarContadoresGerais();
    };

    /** Busca clientes da API usando paginação do backend */
    const fetchClientes = async (page = 1) => {
        currentPage = page;

        if (filteredClientes) {
            const start = (currentPage - 1) * RECORDS_PER_PAGE;
            const end = start + RECORDS_PER_PAGE;
            clientes = filteredClientes.slice(start, end);
            displayClientes();
            return;
        }

        try {
            const response = await safeFetch(`${API_BASE_URL}/clientes?page=${page}&per_page=${RECORDS_PER_PAGE}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Erro ao buscar clientes');

            const data = await response.json();

            clientes = data.data || [];
            pagination = data.pagination || {};
            currentPage = pagination.page || page;

            displayClientes();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar os dados dos clientes.');
        }
    };

    /** Aplica filtros de data e origem */
    const applyFilters = async () => {
        try {
            const response = await safeFetch(`${API_BASE_URL}/clientes/todos`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Erro ao buscar todos os clientes');

            let allClientes = await response.json();

            const originFilter = safeLower(filterOriginInput.value);
            if (originFilter) {
                allClientes = allClientes.filter(c => safeLower(c.origem).includes(originFilter));
            }

            const dateFilter = filterDateInput.value;
            if (dateFilter) {
                allClientes = allClientes.filter(c => {
                    if (!c.createdAt) return false;
                    const clientDate = new Date(c.createdAt).toISOString().split('T')[0];
                    return clientDate === dateFilter;
                });
            }

            filteredClientes = allClientes;
            currentPage = 1;

            totalClientes = filteredClientes.length;
            totalVisualizados = filteredClientes.filter(c => safeLower(c.status) === 'visualizado').length;
            totalPendentes = filteredClientes.filter(c => safeLower(c.status) === 'pendente').length;

            fetchClientes(currentPage);

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            alert('Erro ao aplicar filtros.');
        }
    };

    /** Limpa filtros */
    const clearFilters = () => {
        filterDateInput.value = '';
        filterOriginInput.value = '';
        filteredClientes = null;
        currentPage = 1;
        fetchClientes(currentPage);
        fetchAllClientesStatus();
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert("Você foi deslogado.");
        window.location.href = 'login.html';
    };

    const abrirWhatsApp = async (link, id) => {
        try {
            window.open(link, '_blank');
            const response = await safeFetch(`${API_BASE_URL}/clientes/${id}/visualizado`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                fetchClientes(currentPage);
                fetchAllClientesStatus();
            }
        } catch (error) {
            console.error('Erro ao abrir WhatsApp ou atualizar status:', error);
        }
    };

    const deleteCliente = async (id) => {
        if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

        try {
            const response = await safeFetch(`${API_BASE_URL}/clientes/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 204) {
                alert('Cliente deletado com sucesso!');
                fetchClientes(currentPage);
                fetchAllClientesStatus();
            } else {
                const data = await response.json();
                alert(data.detail || 'Erro ao deletar cliente.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro ao deletar cliente.');
        }
    };

    const downloadExcel = async () => {
        try {
            const response = await safeFetch(`${API_BASE_URL}/clientes/excel`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Erro ao buscar o arquivo');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dados_clientes.xlsx';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('Erro ao baixar o arquivo.');
        }
    };

    const setupUIForRole = () => {
        document.getElementById('excel')?.classList.remove('hidden');

        if (role !== 'admin') {
            document.getElementById('return-btn')?.remove();
            document.getElementById('acoes')?.remove();
            document.querySelector('.filters')?.remove();
        }
    };

    // Event Listeners
    tableBody.addEventListener('click', (event) => {
        const target = event.target.closest('button');
        const row = target?.closest('tr');
        if (!row || !target) return;

        const clientId = row.dataset.clientId;

        if (target.classList.contains('btn-zap')) abrirWhatsApp(row.dataset.whatsappLink, clientId);
        if (target.classList.contains('btn-delete')) deleteCliente(clientId);
    });

    prevBtn?.addEventListener('click', () => {
        if (currentPage > 1) fetchClientes(currentPage - 1);
    });
    nextBtn?.addEventListener('click', () => {
        if (filteredClientes) {
            if (currentPage < Math.ceil(filteredClientes.length / RECORDS_PER_PAGE)) fetchClientes(currentPage + 1);
        } else if (pagination.has_next) {
            fetchClientes(currentPage + 1);
        }
    });
    applyFiltersBtn?.addEventListener('click', applyFilters);
    clearFiltersBtn?.addEventListener('click', clearFilters);
    excel?.addEventListener('click', downloadExcel);
    returnBtn?.addEventListener('click', () => window.location.href = 'admin.html');
    registerClientBtn?.addEventListener('click', () => window.location.href = `vendedor.html?vendedor=${encodeURIComponent(nomeUsuario)}`);
    logoutBtn?.addEventListener('click', logout);

    // Inicialização
    setupUIForRole();
    fetchAllClientesStatus().then(() => {
        clearFilters(); // garante que filtros estão limpos e totais atualizados
    });
});