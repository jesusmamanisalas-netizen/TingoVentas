/**
 * Módulo de Autenticación
 */
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        API_BASE_URL: 'https://tingoventas-1.onrender.com/api' // Asegúrate que apunte a tu backend
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');
    const currentPage = window.location.pathname;
    
    // 1. Definición de páginas
    const publicPages = ['login.html', 'tienda.html', 'index.html', '/', 'carrito.html'];
    
    // Normalizar ruta
    const isPublicPage = publicPages.some(page => currentPage.endsWith(page) || currentPage === '/');

    // 2. Redirección si NO hay token y la página es privada
    if (!token && !isPublicPage) {
        window.location.href = 'tienda.html';
        return;
    }
    
    // 3. Lógica si HAY usuario logueado
    if (token && userStr) {
        const user = JSON.parse(userStr);
        
        // Si intenta entrar a login estando logueado, redirigir al dashboard/tienda
        if (currentPage.includes('login.html')) {
            const roleId = getUserRole(user);
            if (roleId === 4) {
                window.location.href = 'tienda.html';
            } else {
                window.location.href = 'dashboard.html';
            }
            return;
        }

        verifyRoleAccess(user, currentPage); 
        configureMenuByRole(user);           
        loadUserInfo();
    }
});

/**
 * Función auxiliar para obtener el ROL de forma segura
 * Busca el role_id en varias ubicaciones posibles y asegura que sea número
 */
function getUserRole(user) {
    if (!user) return 4; // Por defecto Cliente
    
    // Buscar en diferentes niveles por si el backend cambia la estructura
    let role = user.role_id || user.role || (user.profile && user.profile.role_id);
    
    // Si viene como string "1", lo convertimos a número 1
    return role ? parseInt(role) : 4;
}

async function login(email, password) {
    try {
        const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Error al iniciar sesión');
        }

        // --- CORRECCIÓN CLAVE AQUÍ ---
        // Aseguramos que el objeto guardado tenga el role_id explícito
        const userToSave = { ...data.user };
        
        // Si el backend devuelve role_id fuera del objeto user (ej. data.role_id), lo metemos dentro
        if (data.role_id) {
            userToSave.role_id = data.role_id;
        }
        
        // Guardar en localStorage
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(userToSave));
        
        return data;
    } catch (error) {
        throw error;
    }
}

// ... (Las funciones register, logout, passwordRecovery se mantienen igual) ...

async function logout() {
    try {
        const token = localStorage.getItem('access_token');
        if (token) {
            await fetch(`${window.APP_CONFIG.API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
        }
    } catch (error) {
        console.error(error);
    } finally {
        localStorage.clear(); // Limpia todo para evitar residuos
        window.location.href = 'tienda.html';
    }
}

// ... (getAuthToken, loadUserInfo, EventListeners se mantienen igual) ...

/**
 * Verifica permisos de acceso
 */
function verifyRoleAccess(user, currentPage) {
    const roleId = getUserRole(user); // Usamos la función robusta
    
    console.log(`Verificando acceso. Rol detectado: ${roleId}, Página: ${currentPage}`);

    // Regla 1: CLIENTES (Rol 4) NO pueden entrar a zonas de gestión
    const restrictedForClients = ['dashboard.html', 'productos.html', 'usuarios.html'];
    if (roleId === 4 && restrictedForClients.some(page => currentPage.includes(page))) {
        alert("Acceso denegado: Los clientes no tienen acceso a esta zona.");
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
 * Configura el menú
 */
function configureMenuByRole(user) {
    const roleId = getUserRole(user); // Usamos la función robusta

    const navDashboard = document.getElementById('nav-dashboard');
    const navProductos = document.getElementById('nav-productos');
    const navUsuarios = document.getElementById('nav-usuarios');

    // Resetear display por si acaso
    if (navDashboard) navDashboard.style.display = 'none';
    if (navProductos) navProductos.style.display = 'none';
    if (navUsuarios) navUsuarios.style.display = 'none';

    if (roleId === 1) { // ADMIN
        if (navDashboard) navDashboard.style.display = 'block';
        if (navProductos) navProductos.style.display = 'block';
        if (navUsuarios) navUsuarios.style.display = 'block';
    } 
    else if (roleId === 2 || roleId === 3) { // VENDEDOR / ALMACENERO
        if (navDashboard) navDashboard.style.display = 'block';
        if (navProductos) navProductos.style.display = 'block';
        // Usuarios sigue oculto
    }
    // Cliente (4) se queda con todo oculto
}

// Exportar funciones
window.authModule = {
    login,
    logout,
    // ... resto de exportaciones
};