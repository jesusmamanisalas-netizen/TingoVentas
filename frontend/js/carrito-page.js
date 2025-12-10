/**
 * Lógica de la página del carrito
 * Renderiza items, maneja actualizaciones, etc.
 */

/**
 * Cargar y renderizar carrito al inicializar
 */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Cargar nombre del usuario
    const userData = localStorage.getItem('user_data');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            document.getElementById('user-name').textContent = user.email || 'Usuario';
        } catch (e) {
            console.error('Error al cargar datos del usuario:', e);
        }
    }

    renderCart();
    
    // Escuchar cambios en el carrito
    window.addEventListener('cartUpdated', renderCart);
});

/**
 * Renderizar el carrito en la página
 */
function renderCart() {
    const cart = getCart();
    const emptyState = document.getElementById('empty-state');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        emptyState.classList.remove('hidden');
        cartContent.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    cartContent.classList.remove('hidden');
    
    // Limpiar items anteriores
    cartItems.innerHTML = '';
    
    // Renderizar cada item
    cart.forEach(item => {
        const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        row.innerHTML = `
            <td class="px-6 py-4">
                <div class="flex items-center">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" alt="${item.name}" class="h-10 w-10 rounded mr-4 object-cover">` :
                        `<div class="h-10 w-10 rounded mr-4 bg-gray-200 flex items-center justify-center"><i class="fas fa-image text-gray-400"></i></div>`
                    }
                    <div>
                        <p class="font-medium text-gray-900">${escapeHtml(item.name)}</p>
                        <p class="text-sm text-gray-500">Stock: ${item.current_stock}</p>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-gray-900">$${Number(item.price || 0).toFixed(2)}</td>
            <td class="px-6 py-4">
                <div class="flex items-center space-x-2">
                    <button onclick="decrementQuantity('${item.id}')" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        <i class="fas fa-minus text-sm"></i>
                    </button>
                    <input type="number" 
                        value="${item.quantity}" 
                        min="1" 
                        max="${item.current_stock}"
                        onchange="changeQuantity('${item.id}', this.value)"
                        class="w-12 px-2 py-1 border rounded text-center">
                    <button onclick="incrementQuantity('${item.id}')" class="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300">
                        <i class="fas fa-plus text-sm"></i>
                    </button>
                </div>
            </td>
            <td class="px-6 py-4 font-semibold text-gray-900">$${Number(subtotal).toFixed(2)}</td>
            <td class="px-6 py-4">
                <button onclick="removeItem('${item.id}')" class="text-red-600 hover:text-red-800 font-medium">
                    <i class="fas fa-trash mr-2"></i>Eliminar
                </button>
            </td>
        `;
        cartItems.appendChild(row);
    });
    
    // Actualizar totales
    updateTotals();
}

/**
 * Actualizar totales en el resumen
 */
function updateTotals() {
    const cart = getCart();
    const subtotal = getCartTotal();
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${subtotal.toFixed(2)}`;
}

/**
 * Remover item del carrito
 */
function removeItem(productId) {
    if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
        removeFromCart(productId);
        renderCart();
    }
}

/**
 * Incrementar cantidad
 */
function incrementQuantity(productId) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    
    if (item && Number(item.quantity) < Number(item.current_stock || 0)) {
        if (updateCartItemQuantity(productId, Number(item.quantity) + 1)) {
            renderCart();
        }
    } else if (item) {
        alert(`No hay más stock disponible (Máximo: ${item.current_stock})`);
    }
}

/**
 * Decrementar cantidad
 */
function decrementQuantity(productId) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    
    if (item && Number(item.quantity) > 1) {
        if (updateCartItemQuantity(productId, Number(item.quantity) - 1)) {
            renderCart();
        }
    } else if (item && Number(item.quantity) === 1) {
        removeItem(productId);
    }
}

/**
 * Cambiar cantidad directamente
 */
function changeQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    
    if (isNaN(quantity) || quantity < 1) {
        renderCart();
        return;
    }
    
    if (updateCartItemQuantity(productId, quantity)) {
        renderCart();
    }
}

/**
 * Confirmar limpieza del carrito
 */
function clearCartConfirm() {
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito?')) {
        clearCart();
        renderCart();
    }
}

/**
 * Proceder al checkout (próximamente)
 */
function proceedToCheckout() {
    alert('El sistema de checkout estará disponible próximamente.\n\nPor ahora, tu carrito se guarda automáticamente en tu navegador.');
    // En la siguiente fase, aquí irá la lógica de checkout
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
