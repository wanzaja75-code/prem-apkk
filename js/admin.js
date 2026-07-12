/**
 * WANZ SHOP - Admin Panel (Cloudinary Version)
 * Handles admin authentication, product management, and settings
 */

import { CONFIG } from './config.js';
import { 
    auth,
    db,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy,
    setDoc
} from './firebase-init.js';

// ============================================
// Cloudinary Configuration
// ============================================
const CLOUDINARY = {
    CLOUD_NAME: 'neqxbkst',
    UPLOAD_PRESET: 'prem-apk'  // Nama preset yang sudah dibuat
};

/**
 * Upload file to Cloudinary
 */
async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY.UPLOAD_PRESET);
    
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY.CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message || 'Upload failed');
        }
        
        return {
            success: true,
            url: data.secure_url,
            public_id: data.public_id
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// ============================================
// DOM References
// ============================================
const DOM = {
    // Auth
    loginForm: document.getElementById('loginForm'),
    loginEmail: document.getElementById('loginEmail'),
    loginPassword: document.getElementById('loginPassword'),
    loginError: document.getElementById('loginError'),
    adminPanel: document.getElementById('adminPanel'),
    loginContainer: document.getElementById('loginContainer'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Dashboard
    productCount: document.getElementById('productCount'),
    
    // Products
    productsList: document.getElementById('productsList'),
    productForm: document.getElementById('productForm'),
    productFormTitle: document.getElementById('productFormTitle'),
    productId: document.getElementById('productId'),
    productName: document.getElementById('productName'),
    productPrice: document.getElementById('productPrice'),
    productDescription: document.getElementById('productDescription'),
    productCategory: document.getElementById('productCategory'),
    productThumbnail: document.getElementById('productThumbnail'),
    productThumbnailPreview: document.getElementById('productThumbnailPreview'),
    submitBtn: document.getElementById('submitBtn'),
    cancelBtn: document.getElementById('cancelBtn'),
    
    // Settings
    qrisUpload: document.getElementById('qrisUpload'),
    qrisPreview: document.getElementById('qrisPreview'),
    qrisStatus: document.getElementById('qrisStatus'),
    bgUpload: document.getElementById('bgUpload'),
    bgStatus: document.getElementById('bgStatus'),
    whatsappNumber: document.getElementById('whatsappNumber'),
    saveWhatsappBtn: document.getElementById('saveWhatsappBtn'),
    whatsappStatus: document.getElementById('whatsappStatus'),
    
    // Navigation
    navLinks: document.querySelectorAll('.admin-nav a'),
    sections: document.querySelectorAll('.admin-section')
};

// ============================================
// State
// ============================================
const state = {
    user: null,
    products: [],
    editingId: null,
    qrisUrl: null,
    backgroundUrl: null
};

// ============================================
// Authentication
// ============================================
const Auth = {
    /**
     * Login user
     */
    async login(email, password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    },
    
    /**
     * Logout user
     */
    async logout() {
        try {
            await signOut(auth);
            return true;
        } catch (error) {
            console.error('Logout error:', error);
            return false;
        }
    },
    
    /**
     * Check auth state
     */
    onAuthStateChange(callback) {
        return onAuthStateChanged(auth, callback);
    }
};

// ============================================
// Product Management (Cloudinary Version)
// ============================================
const ProductManager = {
    /**
     * Fetch all products
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
     * Add new product
     */
    async addProduct(data) {
        try {
            const productsRef = collection(db, CONFIG.COLLECTIONS.PRODUCTS);
            const docRef = await addDoc(productsRef, {
                ...data,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding product:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Update existing product
     */
    async updateProduct(id, data) {
        try {
            const productRef = doc(db, CONFIG.COLLECTIONS.PRODUCTS, id);
            await updateDoc(productRef, {
                ...data,
                updatedAt: serverTimestamp()
            });
            return { success: true };
        } catch (error) {
            console.error('Error updating product:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Delete product
     */
    async deleteProduct(id) {
        try {
            const productRef = doc(db, CONFIG.COLLECTIONS.PRODUCTS, id);
            await deleteDoc(productRef);
            return { success: true };
        } catch (error) {
            console.error('Error deleting product:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Upload thumbnail - PAKAI CLOUDINARY
     */
    async uploadThumbnail(file, productId) {
        try {
            const result = await uploadToCloudinary(file);
            return result;
        } catch (error) {
            console.error('Error uploading thumbnail:', error);
            return { success: false, error: error.message };
        }
    }
};

// ============================================
// Settings Management (Cloudinary Version)
// ============================================
const SettingsManager = {
    /**
     * Upload QRIS image - PAKAI CLOUDINARY
     */
    async uploadQRIS(file) {
        try {
            const result = await uploadToCloudinary(file);
            if (!result.success) return result;
            
            // Save URL to Firestore
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'qris');
            await setDoc(settingsRef, { 
                url: result.url, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
            
            return { success: true, url: result.url };
        } catch (error) {
            console.error('Error uploading QRIS:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get QRIS URL
     */
    async getQRIS() {
        try {
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'qris');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                return docSnap.data().url;
            }
            return null;
        } catch (error) {
            console.error('Error getting QRIS:', error);
            return null;
        }
    },
    
    /**
     * Upload background image - PAKAI CLOUDINARY
     */
    async uploadBackground(file) {
        try {
            const result = await uploadToCloudinary(file);
            if (!result.success) return result;
            
            // Save URL to Firestore
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'background');
            await setDoc(settingsRef, { 
                url: result.url, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
            
            return { success: true, url: result.url };
        } catch (error) {
            console.error('Error uploading background:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get background URL
     */
    async getBackground() {
        try {
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'background');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                return docSnap.data().url;
            }
            return null;
        } catch (error) {
            console.error('Error getting background:', error);
            return null;
        }
    },
    
    /**
     * Update WhatsApp number
     */
    async updateWhatsApp(number) {
        try {
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'whatsapp');
            await setDoc(settingsRef, { 
                number, 
                updatedAt: serverTimestamp() 
            }, { merge: true });
            return { success: true };
        } catch (error) {
            console.error('Error updating WhatsApp:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Get WhatsApp number
     */
    async getWhatsApp() {
        try {
            const settingsRef = doc(db, CONFIG.COLLECTIONS.SETTINGS, 'whatsapp');
            const docSnap = await getDoc(settingsRef);
            if (docSnap.exists()) {
                return docSnap.data().number;
            }
            return CONFIG.WHATSAPP_NUMBER;
        } catch (error) {
            console.error('Error getting WhatsApp:', error);
            return CONFIG.WHATSAPP_NUMBER;
        }
    }
};

// ============================================
// UI Renderer - Admin
// ============================================
const AdminUI = {
    /**
     * Render products list
     */
    renderProducts(products) {
        const list = DOM.productsList;
        
        if (!products || products.length === 0) {
            list.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center; padding: 40px; color: var(--text-secondary);">
                        No products available. Add your first product!
                    </td>
                </tr>
            `;
            return;
        }
        
        list.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.thumbnail || '/assets/placeholder.jpg'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: var(--radius-sm);"
                         onerror="this.src='/assets/placeholder.jpg'"
                    />
                </td>
                <td><strong>${product.name || 'Untitled'}</strong></td>
                <td>${product.category || CONFIG.DEFAULT_CATEGORY}</td>
                <td>${AdminUI.formatPrice(product.price)}</td>
                <td>
                    <button class="btn-edit" data-id="${product.id}">Edit</button>
                    <button class="btn-delete" data-id="${product.id}">Delete</button>
                </td>
            </tr>
        `).join('');
        
        // Add event listeners
        list.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => AdminUI.editProduct(btn.dataset.id));
        });
        
        list.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => AdminUI.deleteProduct(btn.dataset.id));
        });
    },
    
    /**
     * Format price
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
     * Edit product
     */
    editProduct(id) {
        const product = state.products.find(p => p.id === id);
        if (!product) return;
        
        state.editingId = id;
        DOM.productFormTitle.textContent = 'Edit Product';
        DOM.submitBtn.textContent = 'Update Product';
        DOM.cancelBtn.style.display = 'inline-flex';
        
        DOM.productId.value = id;
        DOM.productName.value = product.name || '';
        DOM.productPrice.value = product.price || '';
        DOM.productDescription.value = product.description || '';
        DOM.productCategory.value = product.category || '';
        
        if (product.thumbnail) {
            DOM.productThumbnailPreview.innerHTML = `
                <img src="${product.thumbnail}" alt="Current thumbnail" style="max-width:150px; max-height:150px; object-fit:cover; border-radius:var(--radius-sm); border:1px solid var(--border-color);" />
                <p style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                    Current thumbnail
                </p>
            `;
        }
        
        // Scroll to form
        DOM.productForm.scrollIntoView({ behavior: 'smooth' });
    },
    
    /**
     * Delete product with confirmation
     */
    async deleteProduct(id) {
        const confirmed = confirm('Are you sure you want to delete this product? This action cannot be undone.');
        if (!confirmed) return;
        
        const result = await ProductManager.deleteProduct(id);
        if (result.success) {
            AdminUI.showStatus('Product deleted successfully!', 'success');
            await AdminUI.loadProducts();
        } else {
            AdminUI.showStatus(`Error: ${result.error}`, 'error');
        }
    },
    
    /**
     * Reset product form
     */
    resetForm() {
        DOM.productForm.reset();
        DOM.productId.value = '';
        DOM.productFormTitle.textContent = 'Add New Product';
        DOM.submitBtn.textContent = 'Add Product';
        DOM.cancelBtn.style.display = 'none';
        DOM.productThumbnailPreview.innerHTML = '';
        state.editingId = null;
    },
    
    /**
     * Show status message
     */
    showStatus(message, type = 'success') {
        const statusEl = document.getElementById('productStatus');
        if (!statusEl) return;
        
        statusEl.textContent = message;
        statusEl.style.display = 'block';
        statusEl.style.color = type === 'success' ? 'var(--accent-gold)' : 'var(--accent-rose)';
        
        setTimeout(() => {
            statusEl.style.display = 'none';
        }, 5000);
    },
    
    /**
     * Load products
     */
    async loadProducts() {
        const products = await ProductManager.fetchProducts();
        state.products = products;
        DOM.productCount.textContent = products.length;
        AdminUI.renderProducts(products);
    },
    
    /**
     * Update QRIS preview
     */
    updateQRISPreview(url) {
        if (url) {
            DOM.qrisPreview.innerHTML = `
                <img src="${url}" alt="QRIS" style="max-width: 200px; border-radius: var(--radius-sm);" />
            `;
            DOM.qrisStatus.textContent = 'QRIS uploaded successfully!';
            DOM.qrisStatus.style.color = 'var(--accent-gold)';
        } else {
            DOM.qrisPreview.innerHTML = '<p style="color: var(--text-secondary);">No QRIS uploaded yet</p>';
            DOM.qrisStatus.textContent = '';
        }
    },
    
    /**
     * Update background preview
     */
    updateBackgroundPreview(url) {
        if (url) {
            DOM.bgStatus.textContent = 'Background updated successfully!';
            DOM.bgStatus.style.color = 'var(--accent-gold)';
        } else {
            DOM.bgStatus.textContent = '';
        }
    }
};

// ============================================
// Event Handlers
// ============================================
const EventHandlers = {
    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = DOM.loginEmail.value;
        const password = DOM.loginPassword.value;
        
        if (!email || !password) {
            DOM.loginError.textContent = 'Please enter email and password';
            DOM.loginError.style.display = 'block';
            return;
        }
        
        DOM.loginError.style.display = 'none';
        DOM.loginError.textContent = '';
        
        const success = await Auth.login(email, password);
        if (!success) {
            DOM.loginError.textContent = 'Invalid email or password';
            DOM.loginError.style.display = 'block';
        }
    },
    
    /**
     * Handle logout
     */
    async handleLogout() {
        const confirmed = confirm('Are you sure you want to logout?');
        if (!confirmed) return;
        
        await Auth.logout();
    },
    
    /**
     * Handle product form submission
     */
    async handleProductSubmit(e) {
        e.preventDefault();
        
        const name = DOM.productName.value.trim();
        const price = parseFloat(DOM.productPrice.value);
        const description = DOM.productDescription.value.trim();
        const category = DOM.productCategory.value.trim();
        const thumbnailFile = DOM.productThumbnail.files[0];
        
        if (!name || !price) {
            AdminUI.showStatus('Name and price are required.', 'error');
            return;
        }
        
        const productData = {
            name,
            price,
            description: description || '',
            category: category || CONFIG.DEFAULT_CATEGORY
        };
        
        // If editing
        if (state.editingId) {
            // Update product
            const result = await ProductManager.updateProduct(state.editingId, productData);
            if (result.success) {
                // Upload new thumbnail if provided
                if (thumbnailFile) {
                    const uploadResult = await ProductManager.uploadThumbnail(thumbnailFile, state.editingId);
                    if (uploadResult.success) {
                        await ProductManager.updateProduct(state.editingId, { thumbnail: uploadResult.url });
                    }
                }
                
                AdminUI.showStatus('Product updated successfully!', 'success');
                AdminUI.resetForm();
                await AdminUI.loadProducts();
            } else {
                AdminUI.showStatus(`Error: ${result.error}`, 'error');
            }
            return;
        }
        
        // Add new product
        const result = await ProductManager.addProduct(productData);
        if (result.success) {
            // Upload thumbnail
            if (thumbnailFile) {
                const uploadResult = await ProductManager.uploadThumbnail(thumbnailFile, result.id);
                if (uploadResult.success) {
                    await ProductManager.updateProduct(result.id, { thumbnail: uploadResult.url });
                }
            }
            
            AdminUI.showStatus('Product added successfully!', 'success');
            AdminUI.resetForm();
            await AdminUI.loadProducts();
        } else {
            AdminUI.showStatus(`Error: ${result.error}`, 'error');
        }
    },
    
    /**
     * Handle QRIS upload
     */
    async handleQRISUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const result = await SettingsManager.uploadQRIS(file);
        if (result.success) {
            AdminUI.updateQRISPreview(result.url);
            state.qrisUrl = result.url;
            DOM.qrisStatus.textContent = 'QRIS uploaded successfully!';
            DOM.qrisStatus.style.color = 'var(--accent-gold)';
        } else {
            DOM.qrisStatus.textContent = `Error: ${result.error}`;
            DOM.qrisStatus.style.color = 'var(--accent-rose)';
        }
    },
    
    /**
     * Handle background upload
     */
    async handleBackgroundUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const result = await SettingsManager.uploadBackground(file);
        if (result.success) {
            state.backgroundUrl = result.url;
            AdminUI.updateBackgroundPreview(result.url);
            DOM.bgStatus.textContent = 'Background uploaded successfully!';
            DOM.bgStatus.style.color = 'var(--accent-gold)';
        } else {
            DOM.bgStatus.textContent = `Error: ${result.error}`;
            DOM.bgStatus.style.color = 'var(--accent-rose)';
        }
    },
    
    /**
     * Handle WhatsApp number save
     */
    async handleWhatsAppSave() {
        const number = DOM.whatsappNumber.value.trim();
        if (!number) {
            DOM.whatsappStatus.textContent = 'Please enter a WhatsApp number';
            DOM.whatsappStatus.style.color = 'var(--accent-rose)';
            return;
        }
        
        const result = await SettingsManager.updateWhatsApp(number);
        if (result.success) {
            DOM.whatsappStatus.textContent = 'WhatsApp number saved successfully!';
            DOM.whatsappStatus.style.color = 'var(--accent-gold)';
            setTimeout(() => {
                DOM.whatsappStatus.textContent = '';
            }, 5000);
        } else {
            DOM.whatsappStatus.textContent = `Error: ${result.error}`;
            DOM.whatsappStatus.style.color = 'var(--accent-rose)';
        }
    },
    
    /**
     * Handle navigation
     */
    handleNavigation(e) {
        const target = e.currentTarget;
        const sectionId = target.dataset.section;
        
        // Update active link
        DOM.navLinks.forEach(link => link.classList.remove('active'));
        target.classList.add('active');
        
        // Show section
        DOM.sections.forEach(section => {
            section.style.display = section.id === sectionId ? 'block' : 'none';
        });
    }
};

// ============================================
// Initialize Admin Panel
// ============================================
async function initAdmin() {
    // Check auth state
    Auth.onAuthStateChange(async (user) => {
        state.user = user;
        
        if (user) {
            // Show admin panel
            DOM.loginContainer.style.display = 'none';
            DOM.adminPanel.style.display = 'block';
            
            // Load data
            await AdminUI.loadProducts();
            
            // Load settings
            const qrisUrl = await SettingsManager.getQRIS();
            if (qrisUrl) {
                state.qrisUrl = qrisUrl;
                AdminUI.updateQRISPreview(qrisUrl);
            }
            
            const bgUrl = await SettingsManager.getBackground();
            if (bgUrl) {
                state.backgroundUrl = bgUrl;
                AdminUI.updateBackgroundPreview(bgUrl);
            }
            
            const whatsapp = await SettingsManager.getWhatsApp();
            if (whatsapp) {
                DOM.whatsappNumber.value = whatsapp;
            }
        } else {
            // Show login
            DOM.loginContainer.style.display = 'flex';
            DOM.adminPanel.style.display = 'none';
        }
    });
    
    // Login form
    DOM.loginForm.addEventListener('submit', EventHandlers.handleLogin);
    
    // Logout button
    DOM.logoutBtn.addEventListener('click', EventHandlers.handleLogout);
    
    // Product form
    DOM.productForm.addEventListener('submit', EventHandlers.handleProductSubmit);
    DOM.cancelBtn.addEventListener('click', AdminUI.resetForm);
    
    // QRIS upload
    DOM.qrisUpload.addEventListener('change', EventHandlers.handleQRISUpload);
    
    // Background upload
    DOM.bgUpload.addEventListener('change', EventHandlers.handleBackgroundUpload);
    
    // WhatsApp save
    DOM.saveWhatsappBtn.addEventListener('click', EventHandlers.handleWhatsAppSave);
    
    // Navigation
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', EventHandlers.handleNavigation);
    });
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}