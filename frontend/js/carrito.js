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
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: cart }));
}

function addToCart(product, quantity = 1) {
    if (!product || !product.id) {
        console.error('Producto inválido');
        return false;
    }

    if (quantity > Number(product.current_stock || 0)) {
        alert(`Stock insuficiente. Disponible: ${product.current_stock}`);
        return false;
    }

    const cart = getCart();
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

/**
 * Obtener cantidad total de productos (por cantidad)
 */
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
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Actualizar badge cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
    updateCartBadge();
    
    // Escuchar cambios en el carrito
    window.addEventListener('cartUpdated', () => {
        updateCartBadge();
    });
});

// Actualizar badge cuando el carrito cambia
window.addEventListener('cartUpdated', () => {
    updateCartBadge();
});

/**
 * Abrir la página del carrito si el usuario está autenticado,
 * o redirigir a la página de login si no lo está.
 */
function openCartOrLogin() {
    const token = localStorage.getItem('access_token');
    if (!token) {
        // Redirigir al login para que el usuario inicie sesión
        window.location.href = 'login.html';
        return;
    }
    window.location.href = 'carrito.html';
}
