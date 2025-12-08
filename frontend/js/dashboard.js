/**
 * Módulo del Dashboard
 * Maneja la visualización de estadísticas y datos del dashboard
 */

// Cargar configuración
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:8000/api';

/**
 * Cargar datos del dashboard
 */
async function loadDashboardData() {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Cargar productos
        const productsResponse = await fetch(`${API_BASE_URL}/productos/listar`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (productsResponse.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const products = await productsResponse.json();

        // Cargar productos con stock mínimo
        const lowStockResponse = await fetch(`${API_BASE_URL}/productos/stock-minimo`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const lowStockProducts = await lowStockResponse.json();

        // Actualizar estadísticas
        updateStatistics(products, lowStockProducts);
        
        // Actualizar tabla de productos recientes
        updateRecentProducts(products.slice(0, 5));
        
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        showError('Error al cargar los datos del dashboard');
    }
}

/**
 * Actualizar estadísticas
 */
function updateStatistics(products, lowStockProducts) {
    // Total de productos
    const totalProductsEl = document.getElementById('total-products');
    if (totalProductsEl) {
        totalProductsEl.textContent = products.length;
    }

    // Productos en falta
    const lowStockEl = document.getElementById('low-stock-products');
    if (lowStockEl) {
        lowStockEl.textContent = lowStockProducts.length;
    }

    // Usuario activo
    const activeUserEl = document.getElementById('active-user');
    if (activeUserEl) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        activeUserEl.textContent = user.email || user.profile?.full_name || 'Usuario';
    }
}

/**
 * Actualizar tabla de productos recientes
 */
function updateRecentProducts(products) {
    const tbody = document.getElementById('recent-products-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-gray-500">No hay productos</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const stockStatus = product.current_stock <= product.min_stock 
            ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Bajo Stock</span>'
            : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Disponible</span>';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${product.name || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">S/ ${product.price?.toFixed(2) || '0.00'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${product.current_stock || 0}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    ${stockStatus}
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Mostrar error
 */
function showError(message) {
    // Puedes implementar una notificación aquí
    console.error(message);
}

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Recargar cada 30 segundos
    setInterval(loadDashboardData, 30000);
});

