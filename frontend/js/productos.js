/**
 * Módulo de Productos tmr
 * Maneja CRUD de productos, búsqueda, filtrado y carga de imágenes
 */

// Cargar configuración
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:8000/api';

let currentProducts = [];
let editingProductId = null;

/**
 * Cargar productos
 */
async function loadProducts(search = '', category = '') {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        let url = `${API_BASE_URL}/productos/listar?`;
        if (search) url += `search=${encodeURIComponent(search)}&`;
        if (category) url += `category_id=${encodeURIComponent(category)}&`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (response.status === 401) {
            window.location.href = 'login.html';
            return;
        }

        const products = await response.json();
        currentProducts = products;
        renderProducts(products);
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showError('Error al cargar los productos');
    }
}

/**
 * Renderizar productos en la tabla
 */
function renderProducts(products) {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No hay productos</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        const imageUrl = product.image_url || 'https://via.placeholder.com/50';
        const stockClass = product.stock <= product.stock_minimo ? 'text-red-600 font-semibold' : 'text-gray-900';
        
        return `
            <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                    <img src="${imageUrl}" alt="${product.name}" class="h-12 w-12 object-cover rounded">
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${product.name || '-'}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-500">${product.description || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">S/ ${product.price?.toFixed(2) || '0.00'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm ${stockClass}">${product.current_stock || 0}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-500">${product.category || '-'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex space-x-2">
                        <button onclick="editProduct('${product.id}')" class="text-blue-600 hover:text-blue-900">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="uploadProductImage('${product.id}')" class="text-green-600 hover:text-green-900">
                            <i class="fas fa-image"></i>
                        </button>
                        <button onclick="deleteProduct('${product.id}')" class="text-red-600 hover:text-red-900">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Crear nuevo producto
 */
async function createProduct(productData) {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/crear`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al crear producto');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Actualizar producto
 */
async function updateProduct(productId, productData) {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/editar/${productId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al actualizar producto');
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
}

/**
 * Eliminar producto
 */
async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
        return;
    }

    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/eliminar/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Error al eliminar producto');
        }

        alert('Producto eliminado exitosamente');
        loadProducts();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

/**
 * Editar producto
 */
async function editProduct(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;

    editingProductId = productId;
    
    // Llenar formulario
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name || '';
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-price').value = product.price || 0;
    document.getElementById('product-stock').value = product.current_stock || 0;
    document.getElementById('product-stock-minimo').value = product.min_stock || 0;
    document.getElementById('product-category').value = product.category_id || '';
    
    // Mostrar imagen si existe
    if (product.image_url) {
        document.getElementById('preview-img').src = product.image_url;
        document.getElementById('image-preview').classList.remove('hidden');
    }

    document.getElementById('modal-title').textContent = 'Editar Producto';
    document.getElementById('product-modal').classList.remove('hidden');
}

/**
 * Subir imagen de producto
 */
async function uploadProductImage(productId) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(`${API_BASE_URL}/productos/subir-imagen/${productId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Error al subir imagen');
            }

            alert('Imagen subida exitosamente');
            loadProducts();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    input.click();
}

/**
 * Mostrar productos con stock mínimo
 */
async function showLowStockProducts() {
    const token = window.authModule?.getAuthToken() || localStorage.getItem('access_token');
    
    try {
        const response = await fetch(`${API_BASE_URL}/productos/stock-minimo`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const products = await response.json();
        renderProducts(products);
        
        // Actualizar búsqueda
        document.getElementById('search-input').value = '';
        document.getElementById('category-filter').value = '';
    } catch (error) {
        console.error('Error al cargar productos con stock mínimo:', error);
        showError('Error al cargar productos con stock mínimo');
    }
}

/**
 * Mostrar error
 */
function showError(message) {
    alert(message);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos al iniciar
    loadProducts();

    // Búsqueda
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const category = document.getElementById('category-filter')?.value || '';
                loadProducts(e.target.value, category);
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

    // Botón nuevo producto
    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            editingProductId = null;
            document.getElementById('product-form').reset();
            document.getElementById('product-id').value = '';
            document.getElementById('image-preview').classList.add('hidden');
            document.getElementById('modal-title').textContent = 'Nuevo Producto';
            document.getElementById('product-modal').classList.remove('hidden');
        });
    }

    // Botón stock mínimo
    const btnStockMinimo = document.getElementById('btn-stock-minimo');
    if (btnStockMinimo) {
        btnStockMinimo.addEventListener('click', showLowStockProducts);
    }

    // Cerrar modal
    const closeModal = document.getElementById('close-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            document.getElementById('product-modal').classList.add('hidden');
        });
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            document.getElementById('product-modal').classList.add('hidden');
        });
    }

    // Formulario de producto
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productData = {
                name: document.getElementById('product-name').value,
                description: document.getElementById('product-description').value,
                price: parseFloat(document.getElementById('product-price').value),
                current_stock: parseInt(document.getElementById('product-stock').value) || 0,
                min_stock: parseInt(document.getElementById('product-stock-minimo').value) || 0,
                category_id: document.getElementById('product-category').value || null,
            };

            try {
                if (editingProductId) {
                    await updateProduct(editingProductId, productData);
                    alert('Producto actualizado exitosamente');
                } else {
                    await createProduct(productData);
                    alert('Producto creado exitosamente');
                }

                document.getElementById('product-modal').classList.add('hidden');
                loadProducts();
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });
    }

    // Preview de imagen
    const imageInput = document.getElementById('product-image');
    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    document.getElementById('preview-img').src = event.target.result;
                    document.getElementById('image-preview').classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }
});

// Exportar funciones globales
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.uploadProductImage = uploadProductImage;

