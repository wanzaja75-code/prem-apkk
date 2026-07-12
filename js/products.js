/**
 * WANZ SHOP - Products Module
 * Shared product utilities
 */

export class ProductUtils {
    /**
     * Format price to IDR currency
     */
    static formatPrice(price) {
        if (!price && price !== 0) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    }
    
    /**
     * Get product by ID
     */
    static getProductById(products, id) {
        return products.find(p => p.id === id);
    }
    
    /**
     * Calculate subtotal
     */
    static calculateSubtotal(cartItems) {
        return cartItems.reduce((sum, item) => {
            return sum + (item.price * (item.quantity || 1));
        }, 0);
    }
    
    /**
     * Generate product slug
     */
    static generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
}