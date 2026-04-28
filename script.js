// Cart state
let cart = JSON.parse(localStorage.getItem('shopvibe_cart')) || [];

// DOM elements
const productsGrid = document.getElementById('productsGrid');
const cartBtn = document.getElementById('cartBtn');
const cartBadge = document.getElementById('cartBadge');
const cartModalOverlay = document.getElementById('cartModalOverlay');
const closeCartModal = document.getElementById('closeCartModal');
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartEmpty = document.getElementById('cartEmpty');
const cartFooter = document.getElementById('cartFooter');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const productModalOverlay = document.getElementById('productModalOverlay');
const productModalBody = document.getElementById('productModalBody');
const closeProductModal = document.getElementById('closeProductModal');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');
const btnOrderNow = document.getElementById('btnOrderNow');

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('shopvibe_cart', JSON.stringify(cart));
}

// Update cart badge
function updateCartBadge() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBadge.textContent = totalItems;
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Render product cards on main page
function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-card-image">
                <img src="${product.image}" alt="${product.title}" loading="lazy">
            </div>
            <div class="product-card-content">
                <span class="product-category">${product.category}</span>
                <h3 class="product-title">${product.title}</h3>
                <div class="product-footer">
                    <span class="product-price">₱${product.price.toLocaleString()}</span>
                    <button class="btn-view" data-id="${product.id}">View Product</button>
                </div>
            </div>
        </div>
    `).join('');

    // Attach event listeners to view buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.dataset.id);
            openProductModal(id);
        });
    });
}

// Open product detail modal
function openProductModal(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    productModalBody.innerHTML = `
        <div class="product-detail-image">
            <img src="${product.image}" alt="${product.title}">
        </div>
        <div class="product-detail-info">
            <span class="product-detail-category">${product.category}</span>
            <h2>${product.title}</h2>
            <p class="product-detail-desc">${product.description}</p>
            <div class="product-detail-price">₱${product.price.toLocaleString()}</div>
            <div class="quantity-selector">
                <label for="modalQty">Quantity:</label>
                <input type="number" id="modalQty" value="1" min="1" max="99">
            </div>
            <button class="btn-add-to-cart-modal" data-id="${product.id}">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
            </button>
        </div>
    `;

    productModalOverlay.classList.add('active');

    // Add to cart from modal
    const addBtn = productModalBody.querySelector('.btn-add-to-cart-modal');
    addBtn.addEventListener('click', () => {
        const qtyInput = document.getElementById('modalQty');
        const qty = parseInt(qtyInput.value) || 1;
        addToCart(product.id, qty);
    });
}

// Add item to cart
function addToCart(productId, quantity = 1) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.productId === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            productId: productId,
            quantity: quantity,
            title: product.title,
            price: product.price,
            image: product.image
        });
    }
    saveCart();
    updateCartBadge();
    showToast(`${product.title} added to cart!`);
}

// Remove item from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.productId !== productId);
    saveCart();
    updateCartBadge();
    renderCartItems();
}

// Render cart modal
function renderCartItems() {
    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        cartFooter.style.display = 'none';
    } else {
        cartEmpty.style.display = 'none';
        cartFooter.style.display = 'block';

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.image}" alt="${item.title}">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-qty">Qty: ${item.quantity}</div>
                </div>
                <div class="cart-item-price">₱${(item.price * item.quantity).toLocaleString()}</div>
                <button class="cart-item-remove" data-id="${item.productId}" aria-label="Remove item">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotalPrice.textContent = `₱${total.toLocaleString()}`;

        // Remove buttons
        document.querySelectorAll('.cart-item-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                removeFromCart(id);
            });
        });
    }
}

// Open cart modal
function openCartModal() {
    renderCartItems();
    cartModalOverlay.classList.add('active');
}

// Close modals
function closeModal(overlay) {
    overlay.classList.remove('active');
}

// Order Now handler
function handleOrderNow() {
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }

    const name = document.getElementById('customerName').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;

    if (!name || !email || !phone || !address) {
        showToast('Please fill in all required fields!');
        return;
    }

    // Simple email validation
    if (!/\S+@\S+\.\S+/.test(email)) {
        showToast('Please enter a valid email address.');
        return;
    }

    // Build order summary
    const orderItems = cart.map(item => 
        `${item.title} x${item.quantity} - ₱${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    alert(`Order Confirmed!\n\nCustomer: ${name}\nEmail: ${email}\nPhone: ${phone}\nAddress: ${address}\nPayment: ${paymentMethod}\n\nItems:\n${orderItems}\n\nTotal: ₱${total.toLocaleString()}\n\nThank you for your order!`);

    // Clear cart after order
    cart = [];
    saveCart();
    updateCartBadge();
    renderCartItems();
    closeModal(cartModalOverlay);
    showToast('Order placed successfully!');
}

// Navbar scroll active link
function setActiveNavLink() {
    const sections = document.querySelectorAll('.section');
    const navLinksAll = document.querySelectorAll('.nav-link');
    let current = 'home';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (window.scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinksAll.forEach(link => {
        link.classList.remove('active');
        if (link.dataset.section === current) {
            link.classList.add('active');
        }
    });
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartBadge();
    renderCartItems(); // initialize empty state

    // Cart button
    cartBtn.addEventListener('click', openCartModal);
    closeCartModal.addEventListener('click', () => closeModal(cartModalOverlay));
    cartModalOverlay.addEventListener('click', (e) => {
        if (e.target === cartModalOverlay) closeModal(cartModalOverlay);
    });

    // Product modal
    closeProductModal.addEventListener('click', () => closeModal(productModalOverlay));
    productModalOverlay.addEventListener('click', (e) => {
        if (e.target === productModalOverlay) closeModal(productModalOverlay);
    });

    // Hamburger menu toggle
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });

    // Order Now button
    btnOrderNow.addEventListener('click', handleOrderNow);

    // Scroll event for active nav link
    window.addEventListener('scroll', setActiveNavLink);
});