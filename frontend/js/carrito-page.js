/**
 * Lógica de la página del carrito
 * Renderiza items, maneja actualizaciones, etc.
 */

/**
 * Cargar y renderizar carrito al inicializar
 */
document.addEventListener('DOMContentLoaded', () => {
    // IMPORTANTE: La seguridad principal ya la maneja auth.js.
    // Aquí solo verificamos token para cargar datos específicos de usuario.
    const token = localStorage.getItem('access_token');
    
    // Si auth.js no redirigió (por lag), forzamos aquí por seguridad
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Cargar nombre del usuario en el navbar (si auth.js no lo hizo ya)
    const userData = localStorage.getItem('user'); // Ojo: en auth.js guardamos como 'user', verifica si usas 'user_data'
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = user.email || user.full_name || 'Usuario';
            }
        } catch (e) {
            console.error('Error al cargar datos del usuario:', e);
        }
    }

    renderCart();
    
    // Escuchar cambios en el carrito (evento disparado por carrito.js)
    window.addEventListener('cartUpdated', renderCart);
});

/**
 * Renderizar el carrito en la página
 */
function renderCart() {
    const cart = getCart(); // Función global de carrito.js
    const emptyState = document.getElementById('empty-state');
    const cartContent = document.getElementById('cart-content');
    const cartItems = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        if(emptyState) emptyState.classList.remove('hidden');
        if(cartContent) cartContent.classList.add('hidden');
        return;
    }
    
    if(emptyState) emptyState.classList.add('hidden');
    if(cartContent) cartContent.classList.remove('hidden');
    
    // Limpiar items anteriores
    if(cartItems) {
        cartItems.innerHTML = '';
        
        // Renderizar cada item
        cart.forEach(item => {
            const subtotal = Number(item.price || 0) * Number(item.quantity || 0);
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        ${item.image_url ? 
                            `<img src="${item.image_url}" alt="${escapeHtml(item.name)}" class="h-12 w-12 rounded-md mr-4 object-cover border border-gray-200">` :
                            `<div class="h-12 w-12 rounded-md mr-4 bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200"><i class="fas fa-image text-lg"></i></div>`
                        }
                        <div>
                            <p class="font-semibold text-gray-800">${escapeHtml(item.name)}</p>
                            <p class="text-xs text-gray-500 mt-1">Stock disponible: ${item.current_stock}</p>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-gray-700 font-medium">$${Number(item.price || 0).toFixed(2)}</td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2 bg-gray-50 w-max rounded-lg border border-gray-200">
                        <button onclick="decrementQuantity('${item.id}')" class="px-3 py-1 hover:bg-gray-200 rounded-l-lg text-gray-600 transition">
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <input type="number" 
                            value="${item.quantity}" 
                            min="1" 
                            max="${item.current_stock}"
                            onchange="changeQuantity('${item.id}', this.value)"
                            class="w-12 py-1 text-center bg-transparent text-sm focus:outline-none appearance-none m-0">
                        <button onclick="incrementQuantity('${item.id}')" class="px-3 py-1 hover:bg-gray-200 rounded-r-lg text-gray-600 transition">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                </td>
                <td class="px-6 py-4 font-bold text-blue-600">$${Number(subtotal).toFixed(2)}</td>
                <td class="px-6 py-4 text-right">
                    <button onclick="removeItem('${item.id}')" class="text-gray-400 hover:text-red-600 transition duration-200 p-2 rounded-full hover:bg-red-50" title="Eliminar producto">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            `;
            cartItems.appendChild(row);
        });
    }
    
    // Actualizar totales
    updateTotals();
}

/**
 * Actualizar totales en el resumen
 */
function updateTotals() {
    const subtotal = getCartTotal();
    
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('total');
    
    if(subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if(totalEl) totalEl.textContent = `$${subtotal.toFixed(2)}`;
}

/**
 * Remover item del carrito con confirmación suave
 */
function removeItem(productId) {
    // Usamos confirm nativo, pero podrías usar un modal personalizado más adelante
    if (confirm('¿Deseas eliminar este producto del carrito?')) {
        removeFromCart(productId); // Función de carrito.js
        renderCart();
    }
}

/**
 * Incrementar cantidad
 */
function incrementQuantity(productId) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    
    if (item) {
        // updateCartItemQuantity maneja la validación de stock y devuelve true/false
        if (updateCartItemQuantity(productId, Number(item.quantity) + 1)) {
            renderCart();
        }
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
        // Si es 1 y baja, preguntamos si quiere eliminar
        removeItem(productId);
    }
}

/**
 * Cambiar cantidad directamente desde el input
 */
function changeQuantity(productId, newQuantity) {
    const quantity = parseInt(newQuantity);
    
    if (isNaN(quantity) || quantity < 1) {
        renderCart(); // Restaurar valor anterior si es inválido
        return;
    }
    
    if (updateCartItemQuantity(productId, quantity)) {
        renderCart();
    } else {
        renderCart(); // Restaurar valor anterior si excedió stock
    }
}

/**
 * Confirmar limpieza del carrito
 */
function clearCartConfirm() {
    if (confirm('¿Estás seguro de que quieres vaciar todo el carrito? Esta acción no se puede deshacer.')) {
        clearCart(); // Función de carrito.js
        renderCart();
    }
}

/**
 * Proceder al checkout
 */
async function proceedToCheckout() {
    const token = localStorage.getItem('access_token');
    
    if (!token) {
        alert("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // AQUI IRA TU LÓGICA FUTURA DE PAGO
    // Por ahora mostramos feedback visual
    const btn = document.querySelector('button[onclick="proceedToCheckout()"]');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Procesando...';
    
    setTimeout(() => {
        alert('¡Sistema de Checkout en construcción!\n\nPronto podrás procesar tus pagos aquí.');
        btn.disabled = false;
        btn.innerHTML = originalText;
    }, 1000);
}

/**
 * Escapar caracteres HTML para evitar XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}