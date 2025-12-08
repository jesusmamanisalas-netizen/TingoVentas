/**
 * Módulo de Autenticación
 * Maneja login, registro, logout y recuperación de contraseña
 */

// Cargar configuración
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:8000/api';

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    if (token && (window.location.pathname.includes('login.html') || window.location.pathname === '/')) {
        window.location.href = 'dashboard.html';
    } else if (!token && !window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
        window.location.href = 'login.html';
    }
    
    // Cargar nombre de usuario si está logueado
    if (token) {
        loadUserInfo();
    }
});

/**
 * Login
 */
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
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
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
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
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
        }

        // Limpiar localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        // Redirigir a login
        window.location.href = 'login.html';
    } catch (error) {
        // Aún así limpiar y redirigir
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }
}

/**
 * Recuperación de contraseña
 */
async function passwordRecovery(email) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/password-recovery`, {
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
        
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;
        
        try {
            await register(email, password, name);
            alert('Usuario registrado exitosamente. Por favor, inicia sesión.');
            document.getElementById('register-modal').classList.add('hidden');
            document.getElementById('register-form').reset();
        } catch (error) {
            alert('Error: ' + error.message);
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

