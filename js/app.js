/**
 * PNN - Progressive Web App
 * Main Application Logic
 * MVP v1 - Demo Version
 */

class PNNApp {
    constructor() {
        // State
        this.cards = [];
        this.currentCardIndex = 0;
        this.isSwiping = false;
        this.swipeStartX = 0;
        this.swipeCurrentX = 0;
        this.isPrimaryCard = false;
        
        // DOM Elements
        this.elements = {
            mainScreen: document.getElementById('main-screen'),
            historyScreen: document.getElementById('history-screen'),
            cardsCarousel: document.getElementById('cards-carousel'),
            cardsContainer: document.getElementById('cards-container'),
            addCardBtn: document.getElementById('add-card-btn'),
            avatarBtn: document.getElementById('avatar-btn'),
            tabItems: document.querySelectorAll('.tab-item'),
            addCardModal: document.getElementById('add-card-modal'),
            profileModal: document.getElementById('profile-modal'),
            closeModalBtn: document.getElementById('close-modal-btn'),
            closeProfileBtn: document.getElementById('close-profile-btn'),
            cancelBtn: document.getElementById('cancel-btn'),
            starBtn: document.getElementById('star-btn'),
            addCardForm: document.getElementById('add-card-form'),
            warpScreen: document.getElementById('warp-screen'),
            transferProgress: document.getElementById('transfer-progress'),
            // Preview elements
            previewNumber: document.getElementById('preview-number'),
            previewCardholder: document.getElementById('preview-cardholder'),
            previewExpiry: document.getElementById('preview-expiry'),
            previewMir: document.getElementById('preview-mir')
        };
        
        this.init();
    }
    
    async init() {
        // Load cards from storage
        await this.loadCards();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Render initial cards
        this.renderCards();
        
        // Show swipe hint on first visit
        this.showSwipeHint();
    }
    
    setupEventListeners() {
        // Tab navigation
        this.elements.tabItems.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });
        
        // Add card button
        this.elements.addCardBtn.addEventListener('click', (e) => {
            console.log('Add card button clicked');
            this.openAddCardModal();
        });
        
        // Close modal buttons
        this.elements.closeModalBtn.addEventListener('click', () => this.closeAddCardModal());
        this.elements.closeProfileBtn.addEventListener('click', () => this.closeProfileModal());
        
        // Avatar click - open profile
        this.elements.avatarBtn.addEventListener('click', () => this.openProfileModal());
        
        // Modal overlay click to close
        this.elements.addCardModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeAddCardModal());
        this.elements.profileModal.querySelector('.modal-overlay').addEventListener('click', () => this.closeProfileModal());
        
        // Add card form submit
        this.elements.addCardForm.addEventListener('submit', (e) => this.handleAddCard(e));
        
        // Card swipe gestures
        this.setupCardSwipe();
    }
    
    setupCardSwipe() {
        const container = this.elements.cardsContainer;
        
        // Touch events
        container.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
        container.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: true });
        container.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Mouse events (for desktop testing)
        container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    }
    
    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.swipeStartX = e.touches[0].clientX;
            this.isSwiping = true;
        }
    }
    
    handleTouchMove(e) {
        if (!this.isSwiping || e.touches.length !== 1) return;
        
        this.swipeCurrentX = e.touches[0].clientX;
        const diff = this.swipeCurrentX - this.swipeStartX;
        
        // Update card position visually
        this.updateCardPosition(diff);
    }
    
    handleTouchEnd(e) {
        if (!this.isSwiping) return;
        
        const diff = this.swipeCurrentX - this.swipeStartX;
        const threshold = 100; // Swipe threshold in pixels
        
        if (diff > threshold) {
            // Swipe right - trigger token transfer
            this.triggerTokenTransfer();
        } else if (diff < -threshold) {
            // Swipe left - next card
            this.nextCard();
        } else {
            // Reset position
            this.resetCardPosition();
        }
        
        this.isSwiping = false;
        this.swipeStartX = 0;
        this.swipeCurrentX = 0;
    }
    
    handleMouseDown(e) {
        this.swipeStartX = e.clientX;
        this.isSwiping = true;
    }
    
    handleMouseMove(e) {
        if (!this.isSwiping) return;
        
        this.swipeCurrentX = e.clientX;
        const diff = this.swipeCurrentX - this.swipeStartX;
        this.updateCardPosition(diff);
    }
    
    handleMouseUp(e) {
        this.handleTouchEnd(e);
    }
    
    updateCardPosition(diff) {
        const card = this.elements.cardsCarousel.querySelector('.payment-card.active');
        if (card) {
            const rotation = diff * 0.05;
            card.style.transform = `translateX(${diff}px) rotate(${rotation}deg)`;
        }
    }
    
    resetCardPosition() {
        const card = this.elements.cardsCarousel.querySelector('.payment-card.active');
        if (card) {
            card.style.transform = '';
        }
    }
    
    async loadCards() {
        // Try to load from storage
        const storedCards = await window.PNNStorage.getCards();
        
        if (storedCards && storedCards.length > 0) {
            this.cards = storedCards;
        } else {
            // Add demo cards
            this.cards = [
                {
                    id: '1',
                    number: '4800123456789012',
                    expiry: '12/26',
                    cardholder: 'IVAN IVANOV',
                    paymentSystem: 'mir',
                    token: this.generateFakeToken()
                },
                {
                    id: '2',
                    number: '5200123456789013',
                    expiry: '06/27',
                    cardholder: 'PETR PETROV',
                    paymentSystem: 'mastercard',
                    token: this.generateFakeToken()
                },
                {
                    id: '3',
                    number: '4100123456789014',
                    expiry: '03/28',
                    cardholder: 'ANNA SMIRNOVA',
                    paymentSystem: 'visa',
                    token: this.generateFakeToken()
                }
            ];
            
            await window.PNNStorage.saveCards(this.cards);
        }
    }
    
    generateFakeToken() {
        // Generate fake token for demo
        return 'tok_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    renderCards() {
        this.elements.cardsCarousel.innerHTML = '';
        
        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.elements.cardsCarousel.appendChild(cardElement);
        });
        
        this.updateCardsPosition();
    }
    
    createCardElement(card, index) {
        const cardEl = document.createElement('div');
        cardEl.className = 'payment-card';
        cardEl.dataset.index = index;
        
        const lastFour = card.number.slice(-4);
        const maskedNumber = `•••• •••• •••• ${lastFour}`;
        
        // Payment system logo
        let paymentSystemLogo = '';
        switch(card.paymentSystem.toLowerCase()) {
            case 'mir':
                paymentSystemLogo = '<span class="mir-logo">МИР</span>';
                break;
            case 'visa':
                paymentSystemLogo = '<span class="visa-logo">VISA</span>';
                break;
            case 'mastercard':
                paymentSystemLogo = '<span class="mastercard-logo">Mastercard</span>';
                break;
            default:
                paymentSystemLogo = '<span class="mir-logo">МИР</span>';
        }
        
        // Primary card indicator
        const primaryIndicator = card.isPrimary ? `
            <div class="primary-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="#ffd700" stroke="#ffd700" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        ` : '';
        
        cardEl.innerHTML = `
            <div class="card-content">
                ${primaryIndicator}
                <div class="card-header">
                    <div class="card-logo">${paymentSystemLogo}</div>
                    <div class="card-chip"></div>
                </div>
                <div class="card-number">${maskedNumber}</div>
                <div class="card-footer">
                    <div>
                        <div class="card-label">Cardholder</div>
                        <div class="cardholder-name">${card.cardholder}</div>
                    </div>
                    <div>
                        <div class="card-label">Expires</div>
                        <div class="card-expiry">${card.expiry}</div>
                    </div>
                </div>
            </div>
        `;
        
        return cardEl;
    }
    
    updateCardsPosition() {
        const cards = this.elements.cardsCarousel.querySelectorAll('.payment-card');
        
        cards.forEach((card, index) => {
            card.className = 'payment-card';
            
            if (index === this.currentCardIndex) {
                card.classList.add('active');
            } else if (index < this.currentCardIndex) {
                card.classList.add('prev');
            } else if (index > this.currentCardIndex) {
                card.classList.add('next');
            }
        });
    }
    
    nextCard() {
        if (this.currentCardIndex < this.cards.length - 1) {
            this.currentCardIndex++;
            this.updateCardsPosition();
        }
    }
    
    prevCard() {
        if (this.currentCardIndex > 0) {
            this.currentCardIndex--;
            this.updateCardsPosition();
        }
    }
    
    switchTab(tabName) {
        // Update tab active state
        this.elements.tabItems.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            }
        });
        
        // Switch screens
        if (tabName === 'main') {
            this.elements.mainScreen.classList.add('active');
            this.elements.historyScreen.classList.remove('active');
        } else if (tabName === 'history') {
            this.elements.mainScreen.classList.remove('active');
            this.elements.historyScreen.classList.add('active');
        }
    }
    
    openAddCardModal() {
        this.elements.addCardModal.classList.add('active');
        setTimeout(() => {
            this.elements.addCardModal.classList.add('fade-in');
        }, 10);
    }
    
    closeAddCardModal() {
        this.elements.addCardModal.classList.remove('fade-in');
        setTimeout(() => {
            this.elements.addCardModal.classList.remove('active');
            this.elements.addCardForm.reset();
        }, 300);
    }
    
    openProfileModal() {
        this.elements.profileModal.classList.add('active');
        setTimeout(() => {
            this.elements.profileModal.classList.add('fade-in');
        }, 10);
    }
    
    closeProfileModal() {
        this.elements.profileModal.classList.remove('fade-in');
        setTimeout(() => {
            this.elements.profileModal.classList.remove('active');
        }, 300);
    }
    
    async triggerTokenTransfer() {
        const currentCard = this.cards[this.currentCardIndex];
        if (!currentCard) return;
        
        // Reset card position
        this.resetCardPosition();
        
        // Show warp screen
        this.elements.warpScreen.classList.add('active');
        setTimeout(() => {
            this.elements.warpScreen.classList.add('fade-in');
        }, 10);
        
        // Start warp animation
        if (window.WarpAnimation) {
            window.WarpAnimation.start();
        }
        
        // Simulate token transfer progress
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 2;
            this.elements.transferProgress.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(progressInterval);
                
                // Complete transfer
                setTimeout(() => {
                    this.completeTokenTransfer();
                }, 500);
            }
        }, 50); // 2.5 seconds total
        
        // Log token transfer (demo)
        console.log('Token transfer initiated:', {
            cardId: currentCard.id,
            token: currentCard.token,
            timestamp: new Date().toISOString()
        });
    }
    
    completeTokenTransfer() {
        // Hide warp screen
        this.elements.warpScreen.classList.remove('fade-in');
        setTimeout(() => {
            this.elements.warpScreen.classList.remove('active');
            this.elements.transferProgress.style.width = '0%';
        }, 300);
        
        // Stop warp animation
        if (window.WarpAnimation) {
            window.WarpAnimation.stop();
        }
        
        // Show success (in real app, would show confirmation)
        console.log('Token transfer completed successfully');
    }
    
    showSwipeHint() {
        // Check if first visit
        const hasVisited = localStorage.getItem('pnn_has_visited');
        
        if (!hasVisited) {
            const hint = document.createElement('div');
            hint.className = 'swipe-hint';
            hint.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 8L22 12L18 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M2 12H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Свайпните для оплаты</span>
            `;
            
            this.elements.cardsContainer.appendChild(hint);
            
            // Remove hint after first swipe or 10 seconds
            setTimeout(() => hint.remove(), 10000);
            
            localStorage.setItem('pnn_has_visited', 'true');
        }
    }
    
    updatePreviewLogo(cardType) {
        const logos = {
            mir: 'МИР',
            visa: 'VISA',
            mastercard: 'Mastercard'
        };
        
        const logoText = logos[cardType] || 'МИР';
        
        // Определяем класс логотипа
        let logoClass = '';
        switch(cardType) {
            case 'visa':
                logoClass = 'visa-logo';
                break;
            case 'mastercard':
                logoClass = 'mastercard-logo';
                break;
            default:
                logoClass = 'mir-logo';
        }
        
        this.elements.previewMir.textContent = logoText;
        this.elements.previewMir.className = logoClass;
    }
    
    async handleAddCard(e) {
        e.preventDefault();
        
        const formData = {
            number: document.getElementById('card-number').value.replace(/\s/g, ''),
            expiry: document.getElementById('expiry-date').value,
            cvv: document.getElementById('cvv').value,
            cardholder: document.getElementById('cardholder-name').value.toUpperCase(),
            makePrimary: this.isPrimaryCard
        };
        
        // Simple validation (MVP - no PCI compliance)
        if (!formData.number || !formData.expiry || !formData.cvv || !formData.cardholder) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        // Determine payment system by BIN (first 6 digits)
        let paymentSystem = 'mir';
        const bin = formData.number.slice(0, 6);
        
        // МИР: 2200-2204
        if (/^220[0-4]/.test(bin)) {
            paymentSystem = 'mir';
        }
        // Visa: начинается с 4
        else if (formData.number.startsWith('4')) {
            paymentSystem = 'visa';
        }
        // Mastercard: 51-55 или 2221-2720
        else if (/^(5[1-5]|2[2-7][2-9][0-9])/.test(formData.number.slice(0, 4))) {
            paymentSystem = 'mastercard';
        }
        
        // Create new card
        const newCard = {
            id: Date.now().toString(),
            number: formData.number,
            expiry: formData.expiry,
            cardholder: formData.cardholder,
            paymentSystem: paymentSystem,
            token: this.generateFakeToken(),
            isPrimary: this.isPrimaryCard
        };
        
        // If this card is set as primary, remove primary from other cards
        if (this.isPrimaryCard) {
            this.cards.forEach(card => {
                card.isPrimary = false;
            });
            // Add new card at the beginning
            this.cards.unshift(newCard);
        } else {
            // Add to cards array
            this.cards.push(newCard);
        }
        
        // Save to storage
        await window.PNNStorage.saveCards(this.cards);
        
        // Re-render cards
        this.renderCards();
        
        // Close modal
        this.closeAddCardModal();
        
        // Reset primary card state
        this.isPrimaryCard = false;
        if (this.elements.starBtn) {
            this.elements.starBtn.classList.remove('active');
        }
        
        // Show success message
        alert('Карта успешно добавлена!' + (this.isPrimaryCard ? ' Карта установлена по умолчанию.' : ''));
    }
}

// Определение типа карты по номеру
function detectCardType(number) {
    const cleanNumber = number.replace(/\s/g, '');
    
    // МИР: 2200-2204
    if (/^220[0-4]/.test(cleanNumber)) {
        return 'mir';
    }
    
    // Visa: начинается с 4
    if (/^4/.test(cleanNumber)) {
        return 'visa';
    }
    
    // Mastercard: 51-55 или 2221-2720
    if (/^(5[1-5]|2[2-7][2-9][0-9])/.test(cleanNumber)) {
        return 'mastercard';
    }
    
    return null;
}

// Обновление иконок карт
function updateCardIcons(cardType) {
    const cardIcons = document.querySelectorAll('.card-icon');
    cardIcons.forEach(icon => {
        if (icon.classList.contains(cardType)) {
            icon.classList.add('active');
        } else {
            icon.classList.remove('active');
        }
    });
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.pnnApp = new PNNApp();
    
    const app = window.pnnApp;
    
    // Обработчик ввода номера карты - обновление preview
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').slice(0, 16);
            let formattedValue = '';
            
            // Форматирование номера карты (группы по 4 цифры)
            for (let i = 0; i < value.length; i++) {
                if (i > 0 && i % 4 === 0) {
                    formattedValue += ' ';
                }
                formattedValue += value[i];
            }
            
            e.target.value = formattedValue;
            
            // Обновление preview
            if (formattedValue.length > 0) {
                const lastFour = formattedValue.slice(-4) || '0000';
                app.elements.previewNumber.textContent = '•••• •••• •••• ' + lastFour;
            } else {
                app.elements.previewNumber.textContent = '•••• •••• •••• 0000';
            }
            
            // Определение типа карты
            const cardType = detectCardType(value);
            if (cardType) {
                updateCardIcons(cardType);
                // Обновление логотипа в preview
                app.updatePreviewLogo(cardType);
            } else {
                const cardIcons = document.querySelectorAll('.card-icon');
                cardIcons.forEach(icon => icon.classList.remove('active'));
                app.updatePreviewLogo('mir');
            }
        });
    }
    
    // Форматирование срока действия
    const expiryInput = document.getElementById('expiry-date');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '').slice(0, 4);
            
            if (value.length >= 2) {
                const month = parseInt(value.slice(0, 2));
                if (month > 12) {
                    value = '12' + value.slice(2);
                }
                e.target.value = value.slice(0, 2) + '/' + value.slice(2);
                
                // Обновление preview
                app.elements.previewExpiry.textContent = e.target.value || 'ММ/ГГ';
            } else {
                e.target.value = value;
                app.elements.previewExpiry.textContent = value || 'ММ/ГГ';
            }
        });
    }
    
    // Имя держателя - обновление preview
    const cardholderInput = document.getElementById('cardholder-name');
    if (cardholderInput) {
        cardholderInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase();
            app.elements.previewCardholder.textContent = value || 'IVAN IVANOV';
        });
    }
    
    // Кнопка звезды - сделать картой по умолчанию
    if (app.elements.starBtn) {
        app.elements.starBtn.addEventListener('click', () => {
            app.isPrimaryCard = !app.isPrimaryCard;
            app.elements.starBtn.classList.toggle('active', app.isPrimaryCard);
        });
    }
    
    // Кнопка отмены
    if (app.elements.cancelBtn) {
        app.elements.cancelBtn.addEventListener('click', () => {
            app.closeAddCardModal();
        });
    }
});
