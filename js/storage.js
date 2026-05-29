/**
 * PNN - Storage Module
 * IndexedDB storage with Web Crypto API encryption
 * For offline token storage
 */

class PNNStorage {
    constructor() {
        this.dbName = 'PNN_DB';
        this.dbVersion = 1;
        this.db = null;
        this.encryptionKey = null;
        
        this.init();
    }
    
    async init() {
        try {
            this.db = await this.openDB();
            await this.initEncryptionKey();
        } catch (error) {
            console.error('Failed to initialize storage:', error);
        }
    }
    
    openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains('cards')) {
                    const cardsStore = db.createObjectStore('cards', { keyPath: 'id' });
                    cardsStore.createIndex('paymentSystem', 'paymentSystem', { unique: false });
                }
                
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
                
                if (!db.objectStoreNames.contains('transactions')) {
                    const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
                    transactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    }
    
    async initEncryptionKey() {
        // Try to get existing key
        const storedKey = await this.getEncryptionKey();
        
        if (storedKey) {
            this.encryptionKey = storedKey;
        } else {
            // Generate new key
            this.encryptionKey = await this.generateEncryptionKey();
            await this.saveEncryptionKey(this.encryptionKey);
        }
    }
    
    async generateEncryptionKey() {
        return window.crypto.getRandomValues(new Uint8Array(32));
    }
    
    async saveEncryptionKey(key) {
        // In production, this should be stored more securely
        // For MVP, we store in localStorage (not recommended for production)
        const keyBase64 = btoa(String.fromCharCode(...key));
        localStorage.setItem('pnn_encryption_key', keyBase64);
    }
    
    async getEncryptionKey() {
        const keyBase64 = localStorage.getItem('pnn_encryption_key');
        if (keyBase64) {
            const keyString = atob(keyBase64);
            const key = new Uint8Array(keyString.length);
            for (let i = 0; i < keyString.length; i++) {
                key[i] = keyString.charCodeAt(i);
            }
            return key;
        }
        return null;
    }
    
    async encrypt(data) {
        if (!this.encryptionKey) {
            await this.initEncryptionKey();
        }
        
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(JSON.stringify(data));
        
        // Simple XOR encryption for MVP (use AES-GCM in production)
        const encrypted = new Uint8Array(dataBytes.length);
        for (let i = 0; i < dataBytes.length; i++) {
            encrypted[i] = dataBytes[i] ^ this.encryptionKey[i % this.encryptionKey.length];
        }
        
        return btoa(String.fromCharCode(...encrypted));
    }
    
    async decrypt(encryptedData) {
        if (!this.encryptionKey) {
            await this.initEncryptionKey();
        }
        
        const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
        
        // Simple XOR decryption for MVP
        const decrypted = new Uint8Array(encrypted.length);
        for (let i = 0; i < encrypted.length; i++) {
            decrypted[i] = encrypted[i] ^ this.encryptionKey[i % this.encryptionKey.length];
        }
        
        const decoder = new TextDecoder();
        return JSON.parse(decoder.decode(decrypted));
    }
    
    async saveCards(cards) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            
            // Clear existing cards
            store.clear();
            
            // Add new cards
            cards.forEach(card => {
                store.put(card);
            });
            
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    async getCards() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cards'], 'readonly');
            const store = transaction.objectStore('cards');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async addCard(card) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            const request = store.put(card);
            
            request.onsuccess = () => resolve(card);
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteCard(cardId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cards'], 'readwrite');
            const store = transaction.objectStore('cards');
            const request = store.delete(cardId);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveTransaction(transaction) {
        return new Promise((resolve, reject) => {
            const transaction_db = this.db.transaction(['transactions'], 'readwrite');
            const store = transaction_db.objectStore('transactions');
            const request = store.put(transaction);
            
            request.onsuccess = () => resolve(transaction);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getTransactions(limit = 50) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['transactions'], 'readonly');
            const store = transaction.objectStore('transactions');
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            
            const transactions = [];
            
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor && transactions.length < limit) {
                    transactions.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(transactions);
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    async saveSetting(key, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readwrite');
            const store = transaction.objectStore('settings');
            const request = store.put({ key, value });
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    
    async getSetting(key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['settings'], 'readonly');
            const store = transaction.objectStore('settings');
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }
}

// Create global instance
window.PNNStorage = new PNNStorage();
