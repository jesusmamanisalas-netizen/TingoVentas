/**
 * Módulo de Gestión de Usuarios
 * Maneja la visualización, edición y gestión de usuarios y roles
 */

// Configuración
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:8000/api';

// Variables globales
let usuarios = [];
let roles = [];
let currentEditingUserId = null;

/**
 * Cargar datos al inicializar la página
 */
document.addEventListener('DOMContentLoaded', async () => {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Mostrar nombre del usuario
    const userData = localStorage.getItem('user_data');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            document.getElementById('user-name').textContent = user.email || 'Usuario';
        } catch (e) {
            console.error('Error al cargar datos del usuario:', e);
        }
    }

    // Cargar usuarios y roles
    await loadUsuarios();
    await loadRoles();
});

/**
 * Cargar lista de usuarios
 */
async function loadUsuarios() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        showError('No autorizado');
        return;
    }

    try {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('content').classList.add('hidden');
        document.getElementById('error-state').classList.add('hidden');

        const response = await fetch(`${API_BASE_URL}/roles/usuarios`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
        }

        usuarios = await response.json();

        // Mostrar contenido
        document.getElementById('loading').classList.add('hidden');
        
        if (usuarios.length === 0) {
            document.getElementById('empty-state').classList.remove('hidden');
        } else {
            document.getElementById('content').classList.remove('hidden');
            renderUsuarios();
        }

    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        document.getElementById('loading').classList.add('hidden');
        showError('Error al cargar los usuarios: ' + error.message);
    }
}

/**
 * Cargar lista de roles
 */
async function loadRoles() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/roles/listar`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            roles = await response.json();
            renderRoleSelect();
        }
    } catch (error) {
        console.error('Error al cargar roles:', error);
    }
}

/**
 * Renderizar tabla de usuarios
 */
function renderUsuarios() {
    const tbody = document.getElementById('usuarios-tbody');
    tbody.innerHTML = '';

    usuarios.forEach(usuario => {
        const roleActual = usuario.role || 'Sin rol';
        const fechaRegistro = formatDate(usuario.created_at);
        
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(usuario.email)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${escapeHtml(usuario.full_name)}</td>
            <td class="px-6 py-4 text-sm">
                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    ${escapeHtml(roleActual)}
                </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-600">${fechaRegistro}</td>
            <td class="px-6 py-4 text-sm space-x-2 flex">
                <button onclick="openDetailModal('${usuario.id}')" 
                    class="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium">
                    Ver
                </button>
                <button onclick="openRoleModal('${usuario.id}', '${escapeHtml(usuario.email)}')" 
                    class="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-medium">
                    Cambiar Rol
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Renderizar select de roles en el modal
 */
function renderRoleSelect() {
    const select = document.getElementById('role-select');
    select.innerHTML = '<option value="">Seleccionar un rol...</option>';
    
    roles.forEach(role => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        select.appendChild(option);
    });
}

/**
 * Abrir modal para cambiar rol
 */
function openRoleModal(userId, userEmail) {
    currentEditingUserId = userId;
    document.getElementById('modal-user-email').textContent = userEmail;
    document.getElementById('role-select').value = '';
    document.getElementById('role-modal').classList.remove('hidden');
}

/**
 * Cerrar modal de rol
 */
function closeRoleModal() {
    document.getElementById('role-modal').classList.add('hidden');
    currentEditingUserId = null;
}

/**
 * Guardar cambio de rol
 */
async function saveUserRole() {
    if (!currentEditingUserId) {
        alert('Error: Usuario no seleccionado');
        return;
    }

    const roleId = document.getElementById('role-select').value;
    if (!roleId) {
        alert('Por favor selecciona un rol');
        return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/roles/usuarios/${currentEditingUserId}/rol`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role_id: roleId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al actualizar rol');
        }

        // Recargar usuarios
        closeRoleModal();
        await loadUsuarios();
        alert('Rol actualizado exitosamente');

    } catch (error) {
        console.error('Error al guardar rol:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Abrir modal con detalles del usuario
 */
async function openDetailModal(userId) {
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/roles/usuarios/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Error al obtener detalles del usuario');
        }

        const usuario = await response.json();
        
        // Llenar modal con detalles
        document.getElementById('detail-email').textContent = usuario.email;
        document.getElementById('detail-name').textContent = usuario.full_name;
        document.getElementById('detail-role').textContent = usuario.role || 'Sin rol';
        document.getElementById('detail-created').textContent = formatDate(usuario.created_at);
        
        // Mostrar roles asignados
        const rolesDiv = document.getElementById('detail-roles');
        rolesDiv.innerHTML = '';
        
        if (usuario.roles && usuario.roles.length > 0) {
            usuario.roles.forEach(role => {
                const badge = document.createElement('span');
                badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800';
                badge.textContent = role.name;
                rolesDiv.appendChild(badge);
            });
        } else {
            rolesDiv.innerHTML = '<span class="text-gray-500 text-sm">Sin roles asignados</span>';
        }

        document.getElementById('detail-modal').classList.remove('hidden');

    } catch (error) {
        console.error('Error al cargar detalles:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Cerrar modal de detalles
 */
function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

/**
 * Mostrar error
 */
function showError(message) {
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateString;
    }
}

/**
 * Escapar caracteres HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Logout
 */
async function logout() {
    const token = localStorage.getItem('access_token');
    
    try {
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
    } catch (error) {
        console.error('Error en logout:', error);
    }
    
    // Limpiar storage y redirigir
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    window.location.href = 'login.html';
}
