/**
 * Tienda Pública
 * Carga productos públicos y permite agregar al carrito
 */

// Asegurar que APP_CONFIG esté disponible
if (typeof window.APP_CONFIG === 'undefined') {
    window.APP_CONFIG = {
        API_BASE_URL: 'https://tingoventas.onrender.com/api'
    };
}

const API_BASE_URL = window.APP_CONFIG.API_BASE_URL || 'https://tingoventas.onrender.com/api';

// Declarar allProducts como global
window.allProducts = [];

/**
 * Cargar productos públicos al inicializar
 */
async function loadPublicProducts() {
    const loading = document.getElementById('loading');
    const productsGrid = document.getElementById('products-grid');
    const noProducts = document.getElementById('no-products');
    
    if (!loading || !productsGrid || !noProducts) {
        console.error('[TIENDA] Elementos HTML no encontrados');
        return;
    }
    
    try {
        loading.classList.remove('hidden');
        productsGrid.innerHTML = '';
        noProducts.classList.add('hidden');
        
        console.log('[TIENDA] Cargando productos desde:', `${API_BASE_URL}/productos/publicos`);
        const response = await fetch(`${API_BASE_URL}/productos/publicos`, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const products = await response.json();
        console.log('[TIENDA] Productos cargados:', products.length);
        window.allProducts = products;
        
        if (products.length === 0) {
            console.log('[TIENDA] No hay productos disponibles');
            noProducts.classList.remove('hidden');
            return;
        }
        
        renderProducts(products);
        loadCategories();
        
    } catch (error) {
        console.error('[TIENDA] Error al cargar productos:', error);
        noProducts.classList.remove('hidden');
        noProducts.innerHTML = `
            <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
            <p class="text-xl text-red-600">Error al cargar productos</p>
            <p class="text-sm text-gray-500 mt-2">${error.message}</p>
        `;
    } finally {
        loading.classList.add('hidden');
    }
}

/**
 * Renderizar productos en el grid
 */
function renderProducts(products) {
    const productsGrid = document.getElementById('products-grid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const currentStockNum = Number(product.current_stock || 0);
        const isOutOfStock = currentStockNum === 0 || currentStockNum < 1;
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition';
        card.innerHTML = `
            <div class="relative h-48 bg-gray-200 overflow-hidden">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" class="w-full h-full object-cover">` :
                    `<div class="w-full h-full flex items-center justify-center"><i class="fas fa-image text-gray-400 text-4xl"></i></div>`
                }
                ${isOutOfStock ? 
                    `<div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span class="text-white font-bold text-lg">Agotado</span>
                    </div>` :
                    ''
                }
            </div>
            <div class="p-4">
                <h3 class="font-semibold text-gray-900 truncate">${escapeHtml(product.name)}</h3>
                <p class="text-sm text-gray-600 mt-1 line-clamp-2">${escapeHtml(product.description || 'Sin descripción')}</p>
                
                <div class="mt-3 flex justify-between items-center">
                    <span class="text-lg font-bold text-blue-600">$${Number(product.price).toFixed(2)}</span>
                    <span class="text-xs text-gray-500">
                        ${isOutOfStock ? 'Sin stock' : `Stock: ${currentStockNum}`}
                    </span>
                </div>
                
                <div class="mt-4 flex gap-2">
                    ${isOutOfStock ? 
                        `<button disabled class="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-medium cursor-not-allowed">
                            <i class="fas fa-shopping-cart mr-2"></i>Agotado
                        </button>` :
                        `<button class="add-to-cart-btn flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition" data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart mr-2"></i>Carrito
                        </button>
                        <a href="login.html" 
                            class="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition text-center">
                            <i class="fas fa-eye"></i>
                        </a>`
                    }
                </div>
            </div>
        `;
        productsGrid.appendChild(card);
    });
}

/**
 * Cargar categorías en el select
 */
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/productos/categorias`);
        if (!response.ok) return;
        
        const categories = await response.json();
        const categoryFilter = document.getElementById('category-filter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    } catch (error) {
        console.error('Error al cargar categorías:', error);
    }
}

/**
 * Configurar búsqueda y filtros
 */
function setupSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterProducts);
    }
}

/**
 * Filtrar productos por búsqueda y categoría
 */
function filterProducts() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const categoryId = document.getElementById('category-filter')?.value || '';
    
    const filtered = allProducts.filter(product => {
        const matchesSearch = searchTerm === '' || 
            product.name.toLowerCase().includes(searchTerm) ||
            (product.description && product.description.toLowerCase().includes(searchTerm)) ||
            (product.Sku && product.Sku.toLowerCase().includes(searchTerm)) ||
            (product.brand && product.brand.toLowerCase().includes(searchTerm));
        const matchesCategory = categoryId === '' || String(product.category_id) === String(categoryId);
        
        return matchesSearch && matchesCategory;
    });
    
    renderProducts(filtered);
}

/**
 * Actualizar badge del carrito en la navbar
 */
function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (badge && typeof getCartItemCount === 'function') {
        const count = getCartItemCount();
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-flex' : 'none';
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
