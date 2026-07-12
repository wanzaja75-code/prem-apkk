/**
 * WANZ SHOP - Configuration
 * Centralized configuration for the entire application
 */

export const CONFIG = {
    // Background image path - Change this to update the hero background
    BACKGROUND_IMAGE: '/background/bg.jpg',
    
    // WhatsApp number for admin
    WHATSAPP_NUMBER: '6285136076430',
    
    // Store name
    STORE_NAME: 'WANZ SHOP',
    
    // Currency
    CURRENCY: 'IDR',
    
    // Default category
    DEFAULT_CATEGORY: 'Digital Product',
    
    // Animation durations (ms)
    ANIMATION: {
        FAST: 200,
        BASE: 300,
        SLOW: 400
    },
    
    // Pagination
    PRODUCTS_PER_PAGE: 12,
    
    // Firebase Collections
    COLLECTIONS: {
        PRODUCTS: 'products',
        QRIS: 'qris',
        BANNER: 'banner',
        SETTINGS: 'settings'
    }
};