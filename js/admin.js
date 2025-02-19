document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (!token || role !== 'admin') {
        alert('Você não tem permissão para acessar esta página.');
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('logoutButton').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = 'login.html';
    });

    document.getElementById('approveButton').addEventListener('click', () => {
        window.location.href = 'approve.html'; 
    });

    const loadUsers = async () => {
        try {
            const response = await fetch('http://35.184.186.154:3000/usuarios', {
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
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
        }
    };

    document.getElementById('userTableBody').addEventListener('click', async (e) => {
        if (e.target.classList.contains('deleteButton')) {
            const userId = e.target.getAttribute('data-id');
            if (confirm('Tem certeza que deseja excluir este usuário?')) {
                try {
                    const response = await fetch(`http://35.184.186.154:3000/usuarios/${userId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        alert('Usuário excluído com sucesso!');
                        loadUsers(); 
                    } else {
                        const data = await response.json();
                        alert(`Erro ao excluir usuário: ${data.message}`);
                    }
                } catch (error) {
                    console.error('Erro ao excluir usuário:', error);
                }
            }
        }
    });

    loadUsers();
});

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButton');
    logoutButton.addEventListener('click', () => {
        alert("Você foi deslogado.");
        window.location.href = "login.html"; 
    });

    const createUserButton = document.getElementById('createUserButton');
    createUserButton.addEventListener('click', () => {
        window.location.href = "register.html";
    });

    const approveButton = document.getElementById('approveButton');
    approveButton.addEventListener('click', () => {
        window.location.href = "approve.html"; 
    });
});

