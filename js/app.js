/**
 * Main Application Module - инициализация и координация компонентов
 */

class App {
    constructor() {
        this.modalOverlay = document.getElementById('modalOverlay');
        this.modalCard = document.getElementById('modalCard');
        this.hyperspaceOverlay = document.getElementById('hyperspaceOverlay');
        
        // Элементы формы
        this.addCardForm = document.getElementById('addCardForm');
        this.cardNumberInput = document.getElementById('cardNumber');
        this.expiryDateInput = document.getElementById('expiryDate');
        this.cvvInput = document.getElementById('cvv');
        this.cardholderNameInput = document.getElementById('cardholderName');
        this.starBtn = document.getElementById('starBtn');
        this.okBtn = document.getElementById('okBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        
        // Кнопки навигации
        this.addCardBtn = document.getElementById('addCardBtn');
        this.avatarBtn = document.getElementById('avatar');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        
        // Состояние
        this.isStarActive = false;
        this.formValid = false;
        
        this.init();
    }

    async init() {
        // Регистрация Service Worker
        await this.registerServiceWorker();
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Инициализация компонентов
        this.setupFormValidation();
        
        console.log('PNN App initialized');
    }

    /**
     * Регистрация Service Worker для PWA
     */
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                });
                console.log('Service Worker зарегистрирован:', registration.scope);
            } catch (error) {
                console.error('Ошибка регистрации Service Worker:', error);
            }
        }
    }

    /**
     * Настройка обработчиков событий
     */
    setupEventListeners() {
        // Открытие модального окна добавления карты
        this.addCardBtn.addEventListener('click', () => this.openModal());
        
        // Закрытие модального окна
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) {
                this.closeModal();
            }
        });
        
        // Кнопка звезды
        this.starBtn.addEventListener('click', () => this.toggleStar());
        
        // Отправка формы
        this.addCardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitForm();
        });
        
        // Навигация по табам
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // Аватарка (заглушка личного кабинета)
        this.avatarBtn.addEventListener('click', () => {
            alert('Личный кабинет - заглушка MVP');
        });
        
        // Обработчик смахивания карты
        document.addEventListener('cardSwipeRight', (e) => {
            this.handleCardSwipe(e.detail.cardId);
        });
    }

    /**
     * Настройка валидации формы
     */
    setupFormValidation() {
        // Форматирование номера карты
        this.cardNumberInput.addEventListener('input', (e) => {
            const formatted = cardsManager.formatCardNumber(e.target.value);
            e.target.value = formatted;
            this.validateForm();
        });
        
        // Форматирование срока действия
        this.expiryDateInput.addEventListener('input', (e) => {
            const formatted = cardsManager.formatExpiryDate(e.target.value);
            e.target.value = formatted;
            this.validateForm();
        });
        
        // Только цифры для CVV
        this.cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
            this.validateForm();
        });
        
        // Валидация имени
        this.cardholderNameInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z\s]/g, '');
            this.validateForm();
        });
    }

    /**
     * Валидация формы
     */
    validateForm() {
        const cardNumber = this.cardNumberInput.value.replace(/\s/g, '');
        const expiry = this.expiryDateInput.value;
        const cvv = this.cvvInput.value;
        
        // Проверка номера карты (16-19 цифр)
        const isCardNumberValid = /^\d{16,19}$/.test(cardNumber);
        
        // Проверка принадлежности к "Мир"
        const isMir = cardsManager.isMirCard(cardNumber);
        this.cardNumberInput.classList.toggle('error', !isMir && cardNumber.length >= 4);
        
        // Проверка срока действия
        const isExpiryValid = cardsManager.isValidExpiry(expiry);
        
        // CVV (необязательно в MVP, но рекомендуется)
        const isCvvValid = cvv.length === 3;
        
        // Имя держателя (необязательно)
        const hasHolder = this.cardholderNameInput.value.trim().length > 0;
        
        // Общая валидация
        this.formValid = isCardNumberValid && isMir && isExpiryValid && isCvvValid;
        this.okBtn.disabled = !this.formValid;
        
        return this.formValid;
    }

    /**
     * Переключение звезды (основная карта)
     */
    toggleStar() {
        this.isStarActive = !this.isStarActive;
        this.starBtn.classList.toggle('active', this.isStarActive);
    }

    /**
     * Открытие модального окна
     */
    async openModal() {
        await animationManager.showModal(this.modalOverlay);
        
        // Сброс формы
        this.addCardForm.reset();
        this.isStarActive = false;
        this.starBtn.classList.remove('active');
        this.formValid = false;
        this.okBtn.disabled = true;
        this.cardNumberInput.classList.remove('error');
    }

    /**
     * Закрытие модального окна
     */
    async closeModal() {
        await animationManager.hideModal(this.modalOverlay);
    }

    /**
     * Отправка формы (добавление карты)
     */
    async submitForm() {
        if (!this.formValid) return;
        
        const cardData = {
            number: this.cardNumberInput.value.replace(/\s/g, ''),
            expiry: this.expiryDateInput.value,
            cvv: this.cvvInput.value,
            holder: this.cardholderNameInput.value.trim() || 'CARDHOLDER',
            isPrimary: this.isStarActive
        };
        
        try {
            // Добавление карты
            const newCard = await cardsManager.addCard(cardData);
            console.log('Карта добавлена:', newCard);
            
            // Закрытие модального окна
            await this.closeModal();
            
            // Анимация успешного добавления
            animationManager.pulseAnimation(this.addCardBtn);
            
        } catch (error) {
            console.error('Ошибка добавления карты:', error);
            alert('Ошибка добавления карты. Попробуйте снова.');
        }
    }

    /**
     * Обработка смахивания карты (передача токена)
     */
    async handleCardSwipe(cardId) {
        const card = cardsManager.cards.find(c => c.id === cardId);
        if (!card) return;
        
        console.log('Смахивание карты:', cardId);
        
        try {
            // Запуск анимации гиперпространства
            await animationManager.startHyperspace();
            
            // Симуляция BLE передачи токена
            const transferSuccess = await bleService.simulateTokenTransfer(card.token);
            
            if (transferSuccess) {
                console.log('Токен успешно передан');
            }
            
            // Завершение анимации
            await animationManager.endHyperspace();
            
        } catch (error) {
            console.error('Ошибка передачи токена:', error);
            await animationManager.endHyperspace();
        }
    }

    /**
     * Переключение вкладок
     */
    switchTab(tabName) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        if (tabName === 'history') {
            // Заглушка для истории
            alert('История транзакций - заглушка MVP');
            // Возврат на главную
            setTimeout(() => {
                this.tabBtns.forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.tab === 'home');
                });
            }, 500);
        }
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
