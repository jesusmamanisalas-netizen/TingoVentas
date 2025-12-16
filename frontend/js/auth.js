/**
 * Módulo de Autenticación
 */
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        // CORRECCIÓN: Si estás en local, usa localhost. Cambia esto si subes a producción.
        API_BASE_URL: 'https://tingoventas.onrender.com/api' 
    };
}

// --- FUNCIÓN HELPER IMPORTANTE ---
// Esta función busca el rol donde sea que esté escondido (user.role_id, user.profile.role_id, etc.)
function getUserRole(user) {
    if (!user) return 4; // Default: Cliente

    // Buscamos el ID del rol en varias posibles ubicaciones
    const role = user.role_id || (user.profile && user.profile.role_id) || user.role;
    
    // Aseguramos que sea un número
    return role ? parseInt(role) : 4;
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    const currentPage = window.location.pathname;
    
    // 1. Definición de páginas
    const publicPages = ['login.html', 'tienda.html', 'index.html', '/', 'carrito.html'];
    
    // Normalizar ruta
    const isPublicPage = publicPages.some(page => currentPage.endsWith(page) || currentPage === '/');

    // 2. Lógica de Redirección Básica (Login/Logout)
    if (token && currentPage.includes('login.html')) {
        // Si ya está logueado, redirigimos según su rol real
        if (userStr) {
            const user = JSON.parse(userStr);
            const roleId = getUserRole(user); // <--- USAMOS LA FUNCIÓN ROBUSTA

            if (roleId === 4) {
                window.location.href = 'tienda.html';
            } else {
                window.location.href = 'dashboard.html';
            }
        }
        return;
    }
    
    // Si no hay token y quiere entrar a página privada -> login
    if (!token && !isPublicPage) {
        window.location.href = 'tienda.html'; 
        return;
    }
    
    // 3. Lógica de Permisos por ROL (Seguridad de Rutas)
    if (token && userStr) {
        const user = JSON.parse(userStr);
        verifyRoleAccess(user, currentPage); 
        configureMenuByRole(user);           
        loadUserInfo();
    }
});

async function login(email, password) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al iniciar sesión');
        }

        // --- CORRECCIÓN CRÍTICA ---
        // Construimos un objeto usuario completo asegurando que tenga el role_id
        const userToSave = { ...data.user };
        
        // Si el backend devuelve role_id suelto (ej: { access_token:..., user:..., role_id: 1 })
        // lo metemos dentro del objeto usuario para que el resto de la app lo encuentre.
        if (data.role_id) {
            userToSave.role_id = data.role_id;
        }

        // Guardar en localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(userToSave)); // Guardamos el corregido
        localStorage.setItem('user_data', JSON.stringify(userToSave));

        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Registro
 */
async function register(email, password, fullName) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al registrar usuario');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Logout
 */
async function logout() {
    try {
        const token = localStorage.getItem('access_token');
        
        if (token) {
            await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        // Limpiar localStorage siempre, falle o no el fetch
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_data');
        window.location.href = 'tienda.html';
    }
}

/**
 * Recuperación de contraseña
 */
async function passwordRecovery(email) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/password-recovery`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al solicitar recuperación');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

/**
 * Obtener token de autenticación
 */
function getAuthToken() {
    return localStorage.getItem('access_token');
}

/**
 * Cargar información del usuario
 */
function loadUserInfo() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const userNameElements = document.querySelectorAll('#user-name');
            userNameElements.forEach(el => {
                if (el) el.textContent = user.email || (user.profile && user.profile.full_name) || 'Usuario';
            });
        } catch (e) {
            console.error('Error al cargar información del usuario:', e);
        }
    }
}

// Event Listeners para login.html
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');
        const errorText = document.getElementById('error-text');
        const loginBtn = document.getElementById('login-btn');
        
        if(errorDiv) errorDiv.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando...';
        
        try {
            // Hacemos login
            const data = await login(email, password);
            
            // Verificamos el rol ANTES de redirigir para saber a dónde ir
            const roleId = data.role_id || (data.user && data.user.role_id) || 4;
            
            if (roleId === 4) {
                window.location.href = 'tienda.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            
        } catch (error) {
            if(errorDiv) {
                errorDiv.classList.remove('hidden');
                if(errorText) errorText.textContent = error.message;
            } else {
                alert(error.message);
            }
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt mr-2"></i>Iniciar Sesión';
        }
    });
}

// Event Listeners para registro
if (document.getElementById('register-link')) {
    document.getElementById('register-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-modal').classList.remove('hidden');
    });
}

if (document.getElementById('close-register')) {
    document.getElementById('close-register').addEventListener('click', () => {
        document.getElementById('register-modal').classList.add('hidden');
    });
}

if (document.getElementById('register-form')) {
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const password = document.getElementById('reg-password').value;
        const regBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = regBtn.innerHTML;
        
        // Validación básica
        if (!name || name.length < 2) {
            alert('Por favor ingresa un nombre válido');
            return;
        }
        
        if (!email) {
            alert('Por favor ingresa un correo válido');
            return;
        }
        
        if (!password || password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        regBtn.disabled = true;
        regBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Registrando...';
        
        try {
            await register(email, password, name);
            alert('Usuario registrado exitosamente. Por favor, inicia sesión.');
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('register-form').reset();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            regBtn.disabled = false;
            regBtn.innerHTML = originalBtnText;
        }
    });
}

// Event Listeners para logout
const logoutButtons = document.querySelectorAll('#logout-btn');
logoutButtons.forEach(btn => {
    if (btn) {
        btn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                logout();
            }
        });
    }
});

// Recuperación de contraseña
if (document.getElementById('forgot-password')) {
    document.getElementById('forgot-password').addEventListener('click', async (e) => {
        e.preventDefault();
        const email = prompt('Ingresa tu correo electrónico:');
        if (email) {
            try {
                await passwordRecovery(email);
                alert('Se ha enviado un email con instrucciones para recuperar tu contraseña.');
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
    });
}

// Exportar funciones para uso en otros módulos
window.authModule = {
    login,
    register,
    logout,
    getAuthToken,
    loadUserInfo,
    passwordRecovery
};

/**
 * Verifica si el usuario tiene permiso para estar en la página actual
 */
function verifyRoleAccess(user, currentPage) {
    const roleId = getUserRole(user); // <--- USAMOS LA FUNCIÓN ROBUSTA

    // Regla 1: CLIENTES (Rol 4) NO pueden entrar a zonas administrativas
    const restrictedForClients = ['dashboard.html', 'productos.html', 'usuarios.html'];
    if (roleId === 4 && restrictedForClients.some(page => currentPage.includes(page))) {
        // IMPORTANTE: Evitamos el alert infinito si ya estamos intentando salir
        window.location.href = 'tienda.html';
        return;
    }

    // Regla 2: VENDEDORES (2) y ALMACENEROS (3) NO pueden ver Usuarios
    if ((roleId === 2 || roleId === 3) && currentPage.includes('usuarios.html')) {
        alert("Acceso denegado: Solo administradores pueden gestionar usuarios.");
        window.location.href = 'dashboard.html';
        return;
    }
}

/**
 * Oculta o muestra elementos del menú según el rol
 */
function configureMenuByRole(user) {
    const roleId = getUserRole(user); // <--- USAMOS LA FUNCIÓN ROBUSTA

    // Elementos del DOM
    const navDashboard = document.getElementById('nav-dashboard');
    const navProductos = document.getElementById('nav-productos');
    const navUsuarios = document.getElementById('nav-usuarios');

    // Reseteamos display por seguridad
    if(navDashboard) navDashboard.style.display = 'none';
    if(navProductos) navProductos.style.display = 'none';
    if(navUsuarios) navUsuarios.style.display = 'none';

    // Lógica visual
    if (roleId === 4) { 
        // Cliente: todo oculto
    } 
    else if (roleId === 2 || roleId === 3) {
        // Vendedor/Almacenero
        if(navDashboard) navDashboard.style.display = 'block'; 
        if(navProductos) navProductos.style.display = 'block';
    } 
    else if (roleId === 1) {
        // Admin
        if(navDashboard) navDashboard.style.display = 'block';
        if(navProductos) navProductos.style.display = 'block';
        if(navUsuarios) navUsuarios.style.display = 'block';
    }
}