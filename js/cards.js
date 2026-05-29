/**
 * Cards Module - управление каруселью карт и логика добавления
 */

class CardsManager {
    constructor() {
        this.cardsContainer = document.getElementById('cardsContainer');
        this.cards = [];
        this.activeIndex = 0;
        this.touchStartX = 0;
        this.touchEndX = 0;
        this.isDragging = false;
        
        // BIN коды платёжной системы "Мир" (основные диапазоны)
        this.mirBins = [
            '2200', '2201', '2202', '2203', '2204', '2205', '2206', '2207',
            '2208', '2209', '221', '222', '223', '224', '225', '226', '227',
            '228', '229', '220000', '220001', '220002', '220003', '220004',
            '220005', '220006', '220007', '220008', '220009'
        ];
        
        this.init();
    }

    init() {
        this.setupTouchHandlers();
        this.loadCards();
    }

    /**
     * Проверка BIN карты на принадлежность к "Мир"
     */
    isMirCard(cardNumber) {
        const cleanNumber = cardNumber.replace(/\s/g, '');
        const bin4 = cleanNumber.substring(0, 4);
        const bin6 = cleanNumber.substring(0, 6);
        
        // Проверка по 4 цифрам
        if (this.mirBins.some(bin => bin4.startsWith(bin))) {
            return true;
        }
        
        // Проверка по 6 цифрам
        if (this.mirBins.some(bin => bin6.startsWith(bin))) {
            return true;
        }
        
        // Дополнительные диапазоны "Мир"
        const mirRanges = [
            { start: 220000, end: 220499 },
            { start: 220000, end: 229999 }
        ];
        
        const bin6Num = parseInt(bin6);
        if (!isNaN(bin6Num)) {
            for (const range of mirRanges) {
                if (bin6Num >= range.start && bin6Num <= range.end) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Форматирование номера карты (группы по 4 цифры)
     */
    formatCardNumber(number) {
        const clean = number.replace(/\D/g, '');
        const groups = clean.match(/.{1,4}/g);
        if (!groups) return '';
        return groups.join(' ');
    }

    /**
     * Форматирование срока действия (MM/YY)
     */
    formatExpiryDate(date) {
        const clean = date.replace(/\D/g, '');
        if (clean.length >= 2) {
            return clean.substring(0, 2) + '/' + clean.substring(2, 4);
        }
        return clean;
    }

    /**
     * Проверка срока действия (не в прошлом)
     */
    isValidExpiry(expiry) {
        if (!expiry || expiry.length !== 5) return false;
        
        const [month, year] = expiry.split('/').map(Number);
        if (!month || !year) return false;
        
        if (month < 1 || month > 12) return false;
        
        const now = new Date();
        const currentYear = parseInt(now.getFullYear().toString().substr(-2));
        const currentMonth = now.getMonth() + 1;
        
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        
        return true;
    }

    /**
     * Загрузка карт из хранилища
     */
    async loadCards() {
        try {
            this.cards = await storage.getAllCards();
            this.renderCards();
        } catch (error) {
            console.error('Ошибка загрузки карт:', error);
            // Демо-карты для MVP
            this.cards = [
                {
                    id: '1',
                    last4: '4276',
                    holder: 'IVAN IVANOV',
                    expiry: '12/25',
                    isPrimary: true,
                    token: 'demo_token_1'
                }
            ];
            this.renderCards();
        }
    }

    /**
     * Отрисовка карт в карусели
     */
    renderCards() {
        this.cardsContainer.innerHTML = '';
        
        if (this.cards.length === 0) {
            // Пустое состояние
            this.cardsContainer.innerHTML = `
                <div class="empty-state">
                    <p style="color: var(--text-tertiary); text-align: center;">
                        Нет карт<br>
                        <small>Нажмите + чтобы добавить</small>
                    </p>
                </div>
            `;
            return;
        }

        this.cards.forEach((card, index) => {
            const cardElement = this.createCardElement(card, index);
            this.cardsContainer.appendChild(cardElement);
        });

        this.updateCardPositions();
    }

    /**
     * Создание элемента карты
     */
    createCardElement(card, index) {
        const el = document.createElement('div');
        el.className = `card ${index === this.activeIndex ? 'active' : ''}`;
        el.dataset.index = index;
        el.dataset.cardId = card.id;

        el.innerHTML = `
            <div class="card-header">
                <svg class="mir-logo" viewBox="0 0 80 30">
                    <text x="40" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold" font-family="sans-serif">МИР</text>
                </svg>
                <div class="card-chip"></div>
            </div>
            <div class="card-number">•••• ${card.last4}</div>
            <div class="card-footer">
                <span class="card-holder">${card.holder}</span>
                <span class="card-expiry">${card.expiry}</span>
            </div>
        `;

        return el;
    }

    /**
     * Обновление позиций карт в карусели
     */
    updateCardPositions() {
        const cards = this.cardsContainer.querySelectorAll('.card');
        
        cards.forEach((card, index) => {
            card.className = 'card';
            
            if (index === this.activeIndex) {
                card.classList.add('active');
            } else if (index < this.activeIndex) {
                card.classList.add('prev');
            } else {
                card.classList.add('next');
            }
        });
    }

    /**
     * Переход к следующей карте
     */
    nextCard() {
        if (this.activeIndex < this.cards.length - 1) {
            this.activeIndex++;
            this.updateCardPositions();
        }
    }

    /**
     * Переход к предыдущей карте
     */
    prevCard() {
        if (this.activeIndex > 0) {
            this.activeIndex--;
            this.updateCardPositions();
        }
    }

    /**
     * Добавление новой карты
     */
    async addCard(cardData) {
        try {
            const newCard = {
                id: Date.now().toString(),
                last4: cardData.number.slice(-4),
                holder: cardData.holder || 'CARDHOLDER',
                expiry: cardData.expiry,
                isPrimary: cardData.isPrimary || false,
                token: 'pending_tokenization'
            };

            // Если карта установлена как основная, снимаем статус с других
            if (newCard.isPrimary) {
                this.cards.forEach(card => card.isPrimary = false);
            } else if (this.cards.length === 0) {
                newCard.isPrimary = true;
            }

            this.cards.push(newCard);
            this.activeIndex = this.cards.length - 1;
            
            // Сохраняем в хранилище
            await storage.addCard(newCard);
            
            this.renderCards();
            return newCard;
        } catch (error) {
            console.error('Ошибка добавления карты:', error);
            throw error;
        }
    }

    /**
     * Настройка обработчиков касаний для смахивания
     */
    setupTouchHandlers() {
        let touchStartTime = 0;

        this.cardsContainer.addEventListener('touchstart', (e) => {
            const card = e.target.closest('.card.active');
            if (!card) return;
            
            this.isDragging = true;
            this.touchStartX = e.touches[0].clientX;
            touchStartTime = Date.now();
        }, { passive: true });

        this.cardsContainer.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            
            const card = this.cardsContainer.querySelector('.card.active');
            if (!card) return;
            
            this.touchEndX = e.touches[0].clientX;
            const diff = this.touchEndX - this.touchStartX;
            
            // Визуальное смещение карты при свайпе
            card.style.transform = `translateX(${diff}px) rotate(${diff / 20}deg)`;
        }, { passive: true });

        this.cardsContainer.addEventListener('touchend', async (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            
            const card = this.cardsContainer.querySelector('.card.active');
            if (!card) return;
            
            const diff = this.touchEndX - this.touchStartX;
            const timeDiff = Date.now() - touchStartTime;
            
            // Свайп вправо для активации передачи токена
            if (diff > 100 || (diff > 50 && timeDiff < 300)) {
                // Запуск анимации гиперпространства
                await this.onSwipeRight(card);
            } else if (diff < -100) {
                // Свайп влево - переход к следующей карте
                this.nextCard();
            } else {
                // Возврат в исходное положение
                card.style.transition = 'transform 0.3s ease';
                card.style.transform = '';
            }
            
            this.touchEndX = 0;
        }, { passive: true });
    }

    /**
     * Обработчик смахивания вправо
     */
    async onSwipeRight(card) {
        // Событие для главного приложения
        document.dispatchEvent(new CustomEvent('cardSwipeRight', {
            detail: { cardId: card.dataset.cardId }
        }));
    }

    /**
     * Получение активной карты
     */
    getActiveCard() {
        return this.cards[this.activeIndex] || null;
    }
}

// Экспорт экземпляра
const cardsManager = new CardsManager();
