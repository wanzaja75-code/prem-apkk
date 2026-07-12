/**
 * WANZ SHOP - Main Application
 * Handles product listing, cart, and UI interactions
 */

import { CONFIG } from './config.js';
import { 
    db, 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    orderBy,
    onSnapshot
} from './firebase-init.js';

// ============================================
// State
// ============================================
const state = {
    products: [],
    cart: [],
    isLoading: true,
    currentPage: 1
};

// ============================================
// DOM References
// ============================================
const DOM = {
    productsGrid: document.getElementById('productsGrid'),
    navToggle: document.querySelector('.nav-toggle'),
    navLinks: document.querySelector('.nav-links')
};

// ============================================
// Product Service
// ============================================
const ProductService = {
    /**
     * Fetch all products from Firestore
     */
    async fetchProducts() {
        try {
            const productsRef = collection(db, CONFIG.COLLECTIONS.PRODUCTS);
            const q = query(productsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    },
    
    /**
     * Listen for real-time product updates
     */
    listenProducts(callback) {
        const productsRef = collection(db, CONFIG.COLLECTIONS.PRODUCTS);
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        
        return onSnapshot(q, (snapshot) => {
            const products = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(products);
        });
    }
};

// ============================================
// UI Renderer
// ============================================
const UIRenderer = {
    /**
     * Render product cards
     */
    renderProducts(products) {
        const grid = DOM.productsGrid;
        
        if (!products || products.length === 0) {
            grid.innerHTML = `
                <div class="text-center" style="grid-column: 1/-1; padding: var(--spacing-2xl);">
                    <p style="color: var(--text-secondary); font-size: var(--font-size-lg);">
                        No products available yet.
                    </p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = products.map(product => `
            <div class="product-card fade-in" data-product-id="${product.id}">
                <div class="product-thumbnail">
                    <img 
                        src="${product.thumbnail || '/assets/placeholder.jpg'}" 
                        alt="${product.name || 'Product'}"
                        loading="lazy"
                        onerror="this.src='/assets/placeholder.jpg'"
                    />
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.name || 'Untitled Product'}</h3>
                    <p class="product-category">${product.category || CONFIG.DEFAULT_CATEGORY}</p>
                    <p class="product-price">${UIRenderer.formatPrice(product.price)}</p>
                    <div class="product-actions">
                        <button class="btn-primary" onclick="window.location.href='/product-detail.html?id=${product.id}'">
                            Detail
                        </button>
                        <button class="btn-secondary" onclick="UIRenderer.addToCart('${product.id}')">
                            Beli
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Format price to IDR
     */
    formatPrice(price) {
        if (!price) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    },
    
    /**
     * Show loading skeletons
     */
    showSkeletons() {
        const grid = DOM.productsGrid;
        const skeletonCount = 6;
        
        grid.innerHTML = Array.from({ length: skeletonCount }, () => `
            <div class="skeleton-card">
                <div class="skeleton-thumbnail"></div>
                <div class="skeleton-info">
                    <div class="skeleton-text long"></div>
                    <div class="skeleton-text short"></div>
                    <div class="skeleton-text price"></div>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Add product to cart
     */
    addToCart(productId) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            state.cart.push({
                ...product,
                quantity: 1
            });
        }
        
        // Show feedback
        this.showToast('Product added to cart!');
    },
    
    /**
     * Show toast notification
     */
    showToast(message) {
        // Create toast if it doesn't exist
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            toast.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%) translateY(100px);
                background: var(--bg-card);
                color: var(--text-primary);
                padding: 12px 24px;
                border-radius: var(--radius-md);
                border: 1px solid var(--border-color);
                font-family: var(--font-primary);
                font-size: var(--font-size-sm);
                z-index: 9999;
                opacity: 0;
                transition: all var(--transition-base);
                box-shadow: var(--shadow-lg);
            `;
            document.body.appendChild(toast);
        }
        
        toast.textContent = message;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(100px)';
        }, 3000);
    }
};

// Make UIRenderer globally accessible for inline onclick handlers
window.UIRenderer = UIRenderer;

// ============================================
// Navigation
// ============================================
const Navigation = {
    init() {
        // Mobile nav toggle
        DOM.navToggle?.addEventListener('click', () => {
            DOM.navToggle.classList.toggle('active');
            DOM.navLinks.classList.toggle('active');
        });
        
        // Close nav on link click (mobile)
        DOM.navLinks?.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                DOM.navToggle?.classList.remove('active');
                DOM.navLinks?.classList.remove('active');
            });
        });
        
        // Navbar scroll effect
        let lastScroll = 0;
        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;
            const navbar = document.querySelector('.navbar');
            
            if (currentScroll > 50) {
                navbar.style.borderBottomColor = 'var(--border-color)';
            } else {
                navbar.style.borderBottomColor = 'transparent';
            }
            
            lastScroll = currentScroll;
        });
        
        // Active link highlight
        const sections = document.querySelectorAll('section[id]');
        const navLinks = DOM.navLinks?.querySelectorAll('a');
        
        window.addEventListener('scroll', () => {
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 100;
                if (window.pageYOffset >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks?.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        });
    }
};

// ============================================
// Intersection Observer for animations
// ============================================
const AnimationObserver = {
    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        document.querySelectorAll('.product-card, .contact-item, .stat-item').forEach(el => {
            observer.observe(el);
        });
    }
};

// ============================================
// Initialize App
// ============================================
async function init() {
    // Show skeletons
    UIRenderer.showSkeletons();
    
    // Initialize navigation
    Navigation.init();
    
    // Initialize animation observer
    AnimationObserver.init();
    
    // Fetch products
    const products = await ProductService.fetchProducts();
    state.products = products;
    state.isLoading = false;
    
    // Render products
    UIRenderer.renderProducts(products);
    
    // Set up real-time listener
    ProductService.listenProducts((updatedProducts) => {
        state.products = updatedProducts;
        UIRenderer.renderProducts(updatedProducts);
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}