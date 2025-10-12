document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const { role } = user;

    const editPopup = document.getElementById('editPopup');
    const closePopup = document.getElementById('closePopup');
    const editUserForm = document.getElementById('editUserForm');
    const createUserButton = document.getElementById('createUserButton');
    const approveButton = document.getElementById('approveButton');
    const logoutButton = document.getElementById('logoutButton');
    const tableBody = document.getElementById('userTableBody');
    const searchInput = document.querySelector('.search-box input');

    let editingUserId = null;
    let allUsers = []; // Armazena todos os usuários
    let filteredUsers = []; // Para busca

    if (!token || role !== 'admin') {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'login.html';
        return;
    }

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert("Você foi deslogado.");
        window.location.href = "login.html";
    });

    createUserButton.addEventListener('click', () => window.location.href = "register.html");
    approveButton.addEventListener('click', () => window.location.href = "approve.html");

    const openEditPopup = (user) => {
        editingUserId = user.id;
        document.getElementById('editName').value = user.nome;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editRole').value = user.role;
        document.getElementById('editPassword').value = '';
        editPopup.classList.remove('hidden');
    };

    closePopup.addEventListener('click', () => editPopup.classList.add('hidden'));

    editUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const updatedUser = {
            nome: document.getElementById('editName').value.trim(),
            email: document.getElementById('editEmail').value.trim(),
            role: document.getElementById('editRole').value,
        };

        const password = document.getElementById('editPassword').value.trim();
        if (password) updatedUser.senha = password;

        try {
            const response = await fetch(`https://backend.sansolenergiasolar.com.br/api/v1/auth/usuarios/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });

            const responseData = await response.json();

            if (response.ok) {
                alert('✅ Usuário atualizado com sucesso!');
                editPopup.classList.add('hidden');
                // Atualiza usuário no array local
                const index = allUsers.findIndex(u => u.id === editingUserId);
                if (index !== -1) allUsers[index] = { ...allUsers[index], ...updatedUser };
                applySearch(); // Atualiza a tabela filtrada
            } else {
                const errorMessage = (responseData.mensagens && responseData.mensagens.length > 0)
                    ? responseData.mensagens.join(', ')
                    : 'Erro desconhecido.';
                alert(`❌ Erro ao atualizar usuário: ${errorMessage}`);
            }
        } catch (error) {
            console.error('🔥 Erro inesperado na requisição:', error);
            alert(`Erro ao atualizar usuário: ${error.message}`);
        }
    });

    const loadUsers = async () => {
        try {
            const response = await fetch(`https://backend.sansolenergiasolar.com.br/api/v1/auth/usuarios?limit=1000`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error(`Falha ao carregar usuários: ${response.status}`);

            const data = await response.json();
            allUsers = data.items || [];
            filteredUsers = [...allUsers];
            renderUsers();
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar a lista de usuários.');
        }
    };

    const renderUsers = () => {
        tableBody.innerHTML = '';

        if (filteredUsers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>`;
            return;
        }

        // Contagem por perfil
        const stats = {
            admin: 0,
            vendedor: 0,
            prospect: 0,
            sdr_bdr: 0
        };

        filteredUsers.forEach(user => {
            switch(user.role) {
                case 'admin': stats.admin++; break;
                case 'vendedor': stats.vendedor++; break;
                case 'prospect': stats.prospect++; break;
                case 'sdr':
                case 'bdr': stats.sdr_bdr++; break;
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.nome}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>
                    <button class="editButton" data-id="${user.id}">Editar</button>
                    <button class="deleteButton" data-id="${user.id}">Excluir</button>
                </td>
            `;
            tableBody.appendChild(row);

            row.querySelector('.editButton').addEventListener('click', () => openEditPopup(user));
            row.querySelector('.deleteButton').addEventListener('click', async () => {
                if (confirm('Tem certeza que deseja excluir este usuário?')) {
                    try {
                        const deleteResponse = await fetch(`https://backend.sansolenergiasolar.com.br/api/v1/auth/usuarios/${user.id}`, {
                            method: 'DELETE',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (deleteResponse.ok) {
                            alert('Usuário excluído com sucesso!');
                            allUsers = allUsers.filter(u => u.id !== user.id);
                            applySearch(); // Atualiza a tabela filtrada
                        } else {
                            const data = await deleteResponse.json();
                            alert(`Erro ao excluir usuário: ${data.message}`);
                        }
                    } catch (error) {
                        console.error('Erro ao excluir usuário:', error);
                        alert('Erro ao excluir usuário.');
                    }
                }
            });
        });

        // Atualiza os cards de estatísticas
        document.querySelectorAll('.stats-cards .stat-card h3')[0].textContent = stats.admin;
        document.querySelectorAll('.stats-cards .stat-card h3')[1].textContent = stats.vendedor;
        document.querySelectorAll('.stats-cards .stat-card h3')[2].textContent = stats.prospect;
        document.querySelectorAll('.stats-cards .stat-card h3')[3].textContent = stats.sdr_bdr;
    };

    // --- 🔍 Função de busca ---
    const applySearch = () => {
        const query = searchInput.value.toLowerCase();
        filteredUsers = allUsers.filter(u =>
            u.nome.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.role.toLowerCase().includes(query)
        );
        renderUsers();
    };

    searchInput.addEventListener('input', applySearch);

    loadUsers();
});