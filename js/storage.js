/**
 * Storage module - IndexedDB для хранения токенов карт
 * В MVP версии - заглушка с базовой структурой
 */

const DB_NAME = 'PNN_CardsDB';
const DB_VERSION = 1;
const STORE_NAME = 'cards';

class Storage {
    constructor() {
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Ошибка открытия базы данных:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('База данных успешно открыта');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('isPrimary', 'isPrimary', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    console.log('Хранилище создано');
                }
            };
        });
    }

    // Добавить карту
    async addCard(cardData) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const card = {
                id: Date.now().toString(),
                ...cardData,
                token: this.generateFakeToken(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const request = store.add(card);

            request.onsuccess = () => {
                console.log('Карта добавлена:', card.id);
                resolve(card);
            };

            request.onerror = () => {
                console.error('Ошибка добавления карты:', request.error);
                reject(request.error);
            };
        });
    }

    // Получить все карты
    async getAllCards() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const cards = request.result.sort((a, b) => {
                    if (a.isPrimary && !b.isPrimary) return -1;
                    if (!a.isPrimary && b.isPrimary) return 1;
                    return new Date(b.createdAt) - new Date(a.createdAt);
                });
                resolve(cards);
            };

            request.onerror = () => {
                console.error('Ошибка получения карт:', request.error);
                reject(request.error);
            };
        });
    }

    // Получить карту по ID
    async getCard(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error('Ошибка получения карты:', request.error);
                reject(request.error);
            };
        });
    }

    // Обновить карту
    async updateCard(id, updates) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);

            const getRequest = store.get(id);

            getRequest.onsuccess = () => {
                const card = getRequest.result;
                if (!card) {
                    reject(new Error('Карта не найдена'));
                    return;
                }

                const updatedCard = {
                    ...card,
                    ...updates,
                    id,
                    updatedAt: new Date().toISOString()
                };

                const putRequest = store.put(updatedCard);

                putRequest.onsuccess = () => {
                    console.log('Карта обновлена:', id);
                    resolve(updatedCard);
                };

                putRequest.onerror = () => {
                    console.error('Ошибка обновления карты:', putRequest.error);
                    reject(putRequest.error);
                };
            };

            getRequest.onerror = () => {
                console.error('Ошибка получения карты:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }

    // Удалить карту
    async deleteCard(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log('Карта удалена:', id);
                resolve();
            };

            request.onerror = () => {
                console.error('Ошибка удаления карты:', request.error);
                reject(request.error);
            };
        });
    }

    // Установить основную карту
    async setPrimaryCard(id) {
        if (!this.db) await this.init();

        return new Promise(async (resolve, reject) => {
            try {
                // Сначала снимаем статус primary со всех карт
                const allCards = await this.getAllCards();
                const updatePromises = allCards.map(card => {
                    if (card.id === id) {
                        return this.updateCard(card.id, { isPrimary: true });
                    } else {
                        return this.updateCard(card.id, { isPrimary: false });
                    }
                });

                await Promise.all(updatePromises);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Генерация фейкового токена (для MVP)
    generateFakeToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    // Шифрование данных (заглушка для MVP)
    async encryptData(data) {
        // В реальной реализации использовать Web Crypto API
        return btoa(JSON.stringify(data));
    }

    // Дешифрование данных (заглушка для MVP)
    async decryptData(encryptedData) {
        // В реальной реализации использовать Web Crypto API
        return JSON.parse(atob(encryptedData));
    }
}

// Экспорт экземпляра
const storage = new Storage();
