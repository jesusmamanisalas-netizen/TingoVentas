/**
 * Carrito de Compras - LocalStorage
 */
const CART_STORAGE_KEY = 'shopping_cart';

function getCart() {
    const cart = localStorage.getItem(CART_STORAGE_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    // Disparar evento para que otros componentes se enteren
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
        console.error('Producto inválido');
        return false;
    }

    // Validación básica de stock inicial
    if (quantity > Number(product.current_stock || 0)) {
        alert(`Stock insuficiente. Disponible: ${product.current_stock}`);
        return false;
    }

    const cart = getCart();
    // Convertimos IDs a string para asegurar comparación correcta
    const existingItem = cart.find(item => String(item.id) === String(product.id));
    
    if (existingItem) {
        const newQuantity = Number(existingItem.quantity) + Number(quantity);

        if (newQuantity > Number(product.current_stock || 0)) {
            alert(`Stock insuficiente. Disponible: ${product.current_stock}`);
            return false;
        }

        existingItem.quantity = newQuantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: Number(quantity),
            current_stock: Number(product.current_stock || 0),
            image_url: product.image_url || null
        });
    }
    
    saveCart(cart);
    alert(`${product.name} agregado al carrito`);
    return true;
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart(cart);
}

function updateCartItemQuantity(productId, newQuantity) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(productId));
    
    if (!item) return false;
    
    if (newQuantity > Number(item.current_stock || 0)) {
        alert(`Stock insuficiente. Disponible: ${item.current_stock}`);
        // Devolvemos false para indicar que no se pudo actualizar
        return false;
    }
    
    if (newQuantity <= 0) {
        removeFromCart(productId);
    } else {
        item.quantity = newQuantity;
        saveCart(cart);
    }
    
    return true;
}

function clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    // Enviamos array vacío en el evento
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
}

function getCartItemCount() {
    const cart = getCart();
    return cart.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (Number(item.price || 0) * Number(item.quantity || 0)), 0);
}

function getCartTotalItems() {
    const cart = getCart();
    return cart.length;
}

/**
 * Actualizar badge del carrito en la navbar
 */
function updateCartBadge() {
    const badge = document.getElementById('cart-count-badge');
    if (badge) {
        const count = getCartItemCount();
        badge.textContent = count;
        // Solo mostrar si hay items (mayor a 0)
        if (count > 0) {
            badge.classList.remove('hidden');
            badge.style.display = 'flex'; // Usamos flex para centrar el número
        } else {
            badge.classList.add('hidden');
            badge.style.display = 'none';
        }
    }
}

// --- EVENT LISTENERS (CORREGIDO) ---

// 1. Cuando carga la página, actualizamos el badge
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
});

// 2. Cuando el carrito cambia (evento personalizado), actualizamos el badge
window.addEventListener('cartUpdated', () => {
    updateCartBadge();
});

/**
 * Abrir la página del carrito o redirigir al login si no hay sesión.
 * NOTA: Esta función define si un usuario NO registrado puede ver el carrito.
 * Tal como está ahora, obliga a loguearse para VER el carrito.
 */
function openCartOrLogin() {
    // Si quieres que cualquiera pueda ver el carrito, quita esta validación y ponla solo en el Checkout.
    /*
    const token = localStorage.getItem('access_token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    */
    window.location.href = 'carrito.html';
}