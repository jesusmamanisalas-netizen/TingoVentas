/**
 * Módulo de Tienda Pública
 * Maneja la visualización pública de productos (sin autenticación)
 */

const API_URL = window.APP_CONFIG.API_BASE_URL;

let categories = [];
let allProducts = [];

/**
 * Cargar categorías
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/productos/categorias`);
        if (response.ok) {
            categories = await response.json();
            renderCategories();
        }
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

/**
 * Renderizar categorías en el select
 */
function renderCategories() {
    const select = document.getElementById('category-filter');
    if (!select) return;

    // Limpiar opciones existentes (excepto "Todas")
    select.innerHTML = '<option value="">Todas las categorías</option>';

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

/**
 * Cargar productos públicos
 */
async function loadProducts(search = '', categoryId = '') {
    const loading = document.getElementById('loading');
    const grid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');

    loading.classList.remove('hidden');
    grid.classList.add('hidden');
    noProducts.classList.add('hidden');

    try {
        let url = `${API_URL}/productos/publicos?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (categoryId) url += `category_id=${encodeURIComponent(categoryId)}&`;

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Error al cargar productos');
        }

        const products = await response.json();
        allProducts = products;

        loading.classList.add('hidden');
        
        if (products.length === 0) {
            noProducts.classList.remove('hidden');
        } else {
            grid.classList.remove('hidden');
            renderProducts(products);
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
        loading.classList.add('hidden');
        noProducts.classList.remove('hidden');
        noProducts.innerHTML = `
            <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
            <p class="text-xl text-gray-600">Error al cargar productos</p>
            <p class="text-sm text-gray-500 mt-2">${error.message}</p>
        `;
    }
}

/**
 * Renderizar productos en el grid
 */
function renderProducts(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = products.map(product => {
        const imageUrl = product.image_url || 'https://via.placeholder.com/300x300?text=Sin+Imagen';
        const stockClass = product.current_stock <= product.min_stock ? 'text-red-600' : 'text-green-600';
        const stockText = product.current_stock <= product.min_stock ? 'Stock bajo' : 'Disponible';

        return `
            <div class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition transform hover:scale-[1.02]">
                <div class="relative h-48 bg-gray-200">
                    <img src="${imageUrl}" alt="${product.name}" class="w-full h-full object-cover" onerror="this.src='https://via.placeholder.com/300x300?text=Sin+Imagen'">
                    ${product.current_stock <= product.min_stock ? '<span class="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">Stock Bajo</span>' : ''}
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg text-gray-800 mb-2 line-clamp-2">${product.name || '-'}</h3>
                    ${product.brand ? `<p class="text-sm text-gray-500 mb-1">Marca: ${product.brand}</p>` : ''}
                    ${product.Sku ? `<p class="text-xs text-gray-400 mb-2">SKU: ${product.Sku}</p>` : ''}
                    ${product.description ? `<p class="text-sm text-gray-600 mb-3 line-clamp-2">${product.description}</p>` : ''}
                    <div class="flex justify-between items-center">
                        <div>
                            <p class="text-2xl font-bold text-blue-600">S/ ${product.price?.toFixed(2) || '0.00'}</p>
                            <p class="text-sm ${stockClass}">${stockText}</p>
                        </div>
                        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <i class="fas fa-shopping-cart mr-2"></i>Ver
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar categorías y productos
    loadCategories();
    loadProducts();

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const categoryId = document.getElementById('category-filter')?.value || '';
                loadProducts(e.target.value, categoryId);
            }, 500);
        });
    }

    // Filtro de categoría
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            const search = searchInput?.value || '';
            loadProducts(search, e.target.value);
        });
    }
});

