/**
 * Módulo de Autenticación
 */
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        API_BASE_URL: 'https://tingoventas.onrender.com/api'
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    const currentPage = window.location.pathname;
    
    // 1. Definición de páginas
    const publicPages = ['login.html', 'tienda.html', 'index.html', '/', 'carrito.html'];
    const adminPages = ['usuarios.html']; // Solo Admin
    const staffPages = ['dashboard.html', 'productos.html']; // Admin, Vendedor, Almacenero
    
    // Normalizar ruta (para evitar errores con /dashboard.html vs dashboard.html)
    const isPublicPage = publicPages.some(page => currentPage.endsWith(page) || currentPage === '/');

    // 2. Lógica de Redirección Básica (Login/Logout)
    if (token && currentPage.includes('login.html')) {
        // Si ya está logueado, decidimos a dónde mandarlo según su rol
        const user = JSON.parse(userStr);
        if (user.role_id === 4) {
            window.location.href = 'tienda.html';
        } else {
            window.location.href = 'dashboard.html';
        }
        return;
    }
    
    if (!token && !isPublicPage) {
        window.location.href = 'tienda.html'; // O login.html
        return;
    }
    
    // 3. Lógica de Permisos por ROL (Seguridad de Rutas)
    if (token && userStr) {
        const user = JSON.parse(userStr);
        verifyRoleAccess(user, currentPage); // <--- NUEVA FUNCIÓN DE SEGURIDAD
        configureMenuByRole(user);           // <--- NUEVA FUNCIÓN DE UI
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

        // Guardar token
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('user_data', JSON.stringify(data.user));

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

        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_data');

        // Redirigir a tienda (página pública)
        window.location.href = 'tienda.html';
    } catch (error) {
        // Aún así limpiar y redirigir
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
                if (el) el.textContent = user.email || user.profile?.full_name || 'Usuario';
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
        
        errorDiv.classList.add('hidden');
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Iniciando sesión...';
        
        try {
            await login(email, password);
            window.location.href = 'dashboard.html';
        } catch (error) {
            errorDiv.classList.remove('hidden');
            errorText.textContent = error.message;
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
            alert('Por favor ingresa un nombre válido (mínimo 2 caracteres)');
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
            console.log('Enviando registro:', { email, full_name: name });
            const result = await register(email, password, name);
            console.log('Registro exitoso:', result);
            alert('Usuario registrado exitosamente. Por favor, inicia sesión.');
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('register-form').reset();
            // Opcional: Auto-login después del registro
            // Descomentar si quieres auto-loguear después del registro
            // try {
            //     const loginData = await login(email, password);
            //     localStorage.setItem('access_token', loginData.access_token);
            //     localStorage.setItem('user_data', JSON.stringify(loginData.user));
            //     window.location.href = 'dashboard.html';
            // } catch (e) {
            //     console.log('Auto-login no disponible, usuario debe iniciar sesión manualmente');
            // }
        } catch (error) {
            console.error('Error de registro:', error);
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
    const roleId = user.role_id || 4; // Por defecto Cliente si no tiene rol

    // ROLES: 1=Admin, 2=Vendedor, 3=Almacenero, 4=Cliente

    // Regla 1: CLIENTES (Rol 4) NO pueden entrar a dashboard, productos ni usuarios
    const restrictedForClients = ['dashboard.html', 'productos.html', 'usuarios.html'];
    if (roleId === 4 && restrictedForClients.some(page => currentPage.includes(page))) {
        alert("Acceso denegado: Los clientes no tienen acceso a esta zona.");
        window.location.href = 'tienda.html';
        return;
    }

    // Regla 2: VENDEDORES (Rol 2) y ALMACENEROS (Rol 3) NO pueden ver Usuarios
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
    const roleId = user.role_id || 4;

    // Elementos del DOM (Debes asegurarte de poner estos IDs en tu HTML)
    const navDashboard = document.getElementById('nav-dashboard');
    const navProductos = document.getElementById('nav-productos');
    const navUsuarios = document.getElementById('nav-usuarios');
    const navTienda = document.getElementById('nav-tienda'); // Generalmente visible para todos

    // Lógica visual
    if (roleId === 4) { 
        // --- VISTA CLIENTE ---
        if(navDashboard) navDashboard.style.display = 'none';
        if(navProductos) navProductos.style.display = 'none';
        if(navUsuarios) navUsuarios.style.display = 'none';
    } 
    else if (roleId === 2 || roleId === 3) {
        // --- VISTA VENDEDOR / ALMACENERO ---
        if(navDashboard) navDashboard.style.display = 'block'; // O 'flex'
        if(navProductos) navProductos.style.display = 'block';
        if(navUsuarios) navUsuarios.style.display = 'none'; // Ocultar usuarios
    } 
    else if (roleId === 1) {
        // --- VISTA ADMIN ---
        // Mostrar todo
        if(navDashboard) navDashboard.style.display = 'block';
        if(navProductos) navProductos.style.display = 'block';
        if(navUsuarios) navUsuarios.style.display = 'block';
    }
}