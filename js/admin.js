document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    const editPopup = document.getElementById('editPopup');
    const closePopup = document.getElementById('closePopup');
    const editUserForm = document.getElementById('editUserForm');
    const createUserButton = document.getElementById('createUserButton');
    const approveButton = document.getElementById('approveButton');
    const logoutButton = document.getElementById('logoutButton');
    let editingUserId = null;

    if (!token || role !== 'admin') {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'login.html';
        return;
    }

    logoutButton.addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
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
            nome: document.getElementById('editName').value,
            email: document.getElementById('editEmail').value,
            role: document.getElementById('editRole').value === 'Administrador' ? 'admin' : 'vendedor'
        };
    
        const password = document.getElementById('editPassword').value;
        if (password) updatedUser.senha = password;
    
        console.log("📝 Dados a serem enviados para atualização:", updatedUser);
    
        try {
            const response = await fetch(`https://www.sansolenergiasolar.com.br/api/usuarios/${editingUserId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedUser)
            });
    
            const responseData = await response.json();
            console.log("📩 Resposta da API:", responseData);
    
            if (response.ok) {
                alert('Usuário atualizado com sucesso!');
                editPopup.classList.add('hidden');
                loadUsers();
            } else {
                alert(`Erro ao atualizar usuário: ${responseData.message || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('🔥 Erro inesperado na requisição:', error);
            alert(`Erro ao atualizar usuário: ${error.message}`);
        }
    });
    
    const loadUsers = async () => {
        try {
            const response = await fetch('https://www.sansolenergiasolar.com.br/api/usuarios', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            const users = await response.json();
            const tableBody = document.getElementById('userTableBody');
            tableBody.innerHTML = '';

            users.forEach(user => {
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
                            const deleteResponse = await fetch(`https://www.sansolenergiasolar.com.br/api/usuarios/${user.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                }
                            });

                            if (deleteResponse.ok) {
                                alert('Usuário excluído com sucesso!');
                                loadUsers();
                            } else {
                                const data = await deleteResponse.json();
                                alert(`Erro ao excluir usuário: ${data.message}`);
                            }
                        } catch (error) {
                            console.error('Erro ao excluir usuário:', error);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            alert('Erro ao carregar a lista de usuários.');
        }
    };

    loadUsers();
});
