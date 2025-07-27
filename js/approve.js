document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));

    const returnBtn = document.getElementById('return-btn');
    const acoes = document.getElementById('acoes');
    const excel = document.getElementById('excel');

    const table = document.querySelector('table');
    const recordCount = document.getElementById('record-count');
    const pageNum = document.getElementById('page-num');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    const filterDateInput = document.getElementById('filter-date');
    const filterOriginInput = document.getElementById('filter-origin');
    const applyFiltersBtn = document.getElementById('apply-filters');

    let clientes = [];
    let clientesFiltrados = [];
    let currentPage = 1;
    const recordsPerPage = 5;

    const safeLower = (v) => (v ?? '').toString().trim().toLowerCase();

    if (!token) {
        alert('Acesso não autorizado. Faça login primeiro.');
        window.location.href = 'login.html';
        return;
    }

    async function getNomeVendedorPorEmail(emailUsuario) {
        try {
            const response = await fetch('https://www.sansolenergiasolar.com.br/api/vendedores', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Erro ao buscar vendedores');

            const vendedores = await response.json();

            console.log('Resposta da API vendedores:', vendedores);

            if (!Array.isArray(vendedores)) {
                console.warn('Resposta dos vendedores não é um array:', vendedores);
                return null;
            }

            const vendedorEncontrado = vendedores.find(v => {
                if (typeof v === 'string') {
                    return v.toLowerCase() === emailUsuario.toLowerCase();
                } else if (typeof v === 'object' && v !== null) {
                    return (v.email?.toLowerCase() === emailUsuario.toLowerCase());
                }
                return false;
            });

            console.log('Vendedor encontrado:', vendedorEncontrado);
            if (vendedorEncontrado) {
                if (typeof vendedorEncontrado === 'string') return vendedorEncontrado;
                if (typeof vendedorEncontrado === 'object') return vendedorEncontrado.nome || vendedorEncontrado.email || null;
            }
            return null;
        } catch (error) {
            console.error('Erro ao obter vendedores:', error);
            return null;
        }
    }

    // Função para criar ou atualizar os contadores de status
    const criarOuAtualizarContadores = (visualizadosCount, pendentesCount, total) => {
        recordCount.textContent = `Total de registros: ${total}`;

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
        visualizadosSpan.textContent = `Visualizados: ${visualizadosCount}`;

        let pendentesSpan = document.getElementById('pendentesCount');
        if (!pendentesSpan) {
            pendentesSpan = document.createElement('span');
            pendentesSpan.id = 'pendentesCount';
            contadorWrapper.appendChild(pendentesSpan);
        }
        pendentesSpan.textContent = `Pendentes: ${pendentesCount}`;
    };

    // Função para buscar clientes e aplicar filtro se for vendedor
    const fetchClientesComFiltro = async () => {
        try {
            let nomeVendedor = null;

            if (role === 'vendedor') {
                nomeVendedor = await getNomeVendedorPorEmail(usuarioLogado.nome);
                if (!nomeVendedor) {
                    console.warn('Nome do vendedor não encontrado, usando email para filtro');
                    nomeVendedor = usuarioLogado.nome; // fallback para email mesmo
                }
            }

            const response = await fetch(`https://www.sansolenergiasolar.com.br/api/clientes?page=1&limit=1000`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Erro ao buscar clientes');

            clientes = await response.json();

            if (!Array.isArray(clientes)) {
                console.error('A API não retornou um array. Valor retornado:', clientes);
                clientes = [];
            }

            if (role === 'vendedor') {
                const nomeVendedorLower = safeLower(nomeVendedor);
                clientesFiltrados = clientes.filter(cliente => safeLower(cliente?.origem) === nomeVendedorLower);
            } else {
                clientesFiltrados = clientes;
            }

            const visualizadosCount = clientesFiltrados.filter(c =>
                safeLower(c?.status) === 'visualizado'
            ).length;

            const pendentesCount = clientesFiltrados.filter(c =>
                safeLower(c?.status) === 'pendente'
            ).length;

            criarOuAtualizarContadores(visualizadosCount, pendentesCount, clientesFiltrados.length);

            currentPage = 1;
            displayClientes();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao carregar os dados dos clientes.');
        }
    };

    // Função para deletar cliente
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

    // Formata datas no padrão brasileiro
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const options = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        return new Intl.DateTimeFormat('pt-BR', options).format(d);
    };

    // Exibe os clientes na tabela com paginação
    const displayClientes = () => {
        const tbody = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
        tbody.innerHTML = '';

        const start = (currentPage - 1) * recordsPerPage;
        const end = start + recordsPerPage;
        const clientesPagina = clientesFiltrados.slice(start, end);

        clientesPagina.forEach(cliente => {
            let valorConta = (cliente?.contaLuz ?? '').toString();
            if (valorConta && !valorConta.startsWith('R$')) {
                valorConta = `R$ ${valorConta}`;
            }

            const dataCadastro = formatDate(cliente?.createdAt);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${cliente?.nome ?? '-'}</td>
                <td>${cliente?.origem ?? '-'}</td>
                <td>${cliente?.numero ?? '-'}</td>
                <td>${valorConta || '-'}</td>
                <td>${dataCadastro}</td>
                <td>${cliente?.status ?? '-'}</td>
                <td>
                    ${
                        cliente?.localizacao?.latitude && cliente?.localizacao?.longitude
                        ? `<a href="https://www.google.com/maps?q=${cliente.localizacao.latitude},${cliente.localizacao.longitude}" 
                            target="_blank" 
                            title="Ver no mapa">
                                <i class="fas fa-map-marker-alt" style="color: #1e90ff; font-size: 18px;"></i>
                        </a>`
                        : '<span style="color: #888;">Nulo</span>'
                    }
                </td>
                <td>
                    <button class="btn-zap" onclick="abrirWhatsApp('${cliente?.whatsappLink ?? '#'}', '${cliente?.id ?? ''}')">
                        <i class="fab fa-whatsapp"></i> WhatsApp
                    </button>
                </td>
                <td>
                    <button class="btn-delete" style="${role === 'vendedor' ? 'display: none;' : ''}" onclick="deleteCliente('${cliente?.id ?? ''}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;

            if (safeLower(cliente?.status) === 'visualizado') {
                tr.classList.add('visualizado-row');
            }

            tbody.appendChild(tr);
        });

        recordCount.textContent = `Total de registros: ${clientesFiltrados.length}`;
        pageNum.textContent = `Página ${currentPage}`;
        prevBtn.disabled = currentPage === 1;
        nextBtn.disabled = end >= clientesFiltrados.length;
    };

    // Eventos de paginação
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayClientes();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if ((currentPage * recordsPerPage) < clientesFiltrados.length) {
                currentPage++;
                displayClientes();
            }
        });
    }

    // Filtros manuais (apenas se não for vendedor)
    if (applyFiltersBtn && role !== 'vendedor') {
        applyFiltersBtn.addEventListener('click', () => {
            const filterDate = filterDateInput?.value;
            const filterOrigin = safeLower(filterOriginInput?.value);

            clientesFiltrados = clientes.filter(cliente => {
                const dataCliente = cliente?.createdAt ? cliente.createdAt.split('T')[0] : '';
                const origemCliente = safeLower(cliente?.origem);

                const filtraData = filterDate ? dataCliente === filterDate : true;
                const filtraOrigem = filterOrigin ? origemCliente.includes(filterOrigin) : true;

                return filtraData && filtraOrigem;
            });

            const visualizadosCount = clientesFiltrados.filter(c =>
                safeLower(c?.status) === 'visualizado'
            ).length;

            const pendentesCount = clientesFiltrados.filter(c =>
                safeLower(c?.status) === 'pendente'
            ).length;

            criarOuAtualizarContadores(visualizadosCount, pendentesCount, clientesFiltrados.length);

            currentPage = 1;
            displayClientes();
        });
    }

    // Função para abrir WhatsApp e atualizar status
    const abrirWhatsApp = async (link, id) => {
        try {
            window.open(link, '_blank');

            const response = await fetch(`https://www.sansolenergiasolar.com.br/api/clientes/${id}/visualizado`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('Status do cliente atualizado para "visualizado".');
                await fetchClientesComFiltro();
            } else {
                alert('Falha ao atualizar o status do cliente.');
            }
        } catch (error) {
            console.error('Erro ao abrir o WhatsApp ou atualizar status:', error);
        }
    };

    // Baixar Excel
    if (excel) {
        excel.addEventListener('click', async () => {
            try {
                const response = await fetch('https://www.sansolenergiasolar.com.br/api/clientes/excel', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error(`Erro ao buscar o arquivo: ${response.status}`);

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dados.xlsx';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } catch (error) {
                alert('Erro ao baixar o arquivo.');
                console.error(error);
            }
        });
    }

    // Esconde botões e filtros para vendedor
    if (role === 'vendedor') {
        if (returnBtn) returnBtn.style.display = 'none';
        if (acoes) acoes.style.display = 'none';
        if (filterDateInput) filterDateInput.style.display = 'none';
        if (filterOriginInput) filterOriginInput.style.display = 'none';
        if (applyFiltersBtn) applyFiltersBtn.style.display = 'none';
    }

    // Expondo funções globalmente
    window.deleteCliente = deleteCliente;
    window.abrirWhatsApp = abrirWhatsApp;
    window.fetchClientes = fetchClientesComFiltro;

    // Carrega dados inicialmente
    fetchClientesComFiltro();
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('phone');
    localStorage.removeItem('usuarioLogado');
    alert("Você foi deslogado.");
    window.location.href = 'login.html';
}
