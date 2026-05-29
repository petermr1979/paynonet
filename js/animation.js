/**
 * Animation Module - анимации гиперпространства и UI эффектов
 */

class AnimationManager {
    constructor() {
        this.hyperspaceOverlay = document.getElementById('hyperspaceOverlay');
        this.starsContainer = document.getElementById('stars');
        this.stars = [];
        this.animationFrame = null;
    }

    /**
     * Создание звёзд для эффекта гиперпространства
     */
    createStars(count = 100) {
        this.starsContainer.innerHTML = '';
        this.stars = [];

        for (let i = 0; i < count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Случайная позиция
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const size = Math.random() * 2 + 1;
            const duration = Math.random() * 1 + 0.5;
            const delay = Math.random() * 2;

            star.style.left = `${left}%`;
            star.style.top = `${top}%`;
            star.style.width = `${size}px`;
            star.style.height = `${size}px`;
            star.style.animationDuration = `${duration}s`;
            star.style.animationDelay = `${delay}s`;

            this.starsContainer.appendChild(star);
            this.stars.push(star);
        }
    }

    /**
     * Запуск анимации гиперпространства
     */
    async startHyperspace() {
        return new Promise((resolve) => {
            // Создаём звёзды
            this.createStars(150);

            // Показываем оверлей
            this.hyperspaceOverlay.classList.add('active');

            // Ускоряем звёзды через 0.5с
            setTimeout(() => {
                this.stars.forEach(star => {
                    star.style.animationDuration = '0.3s';
                });
            }, 500);

            // Завершаем через 3 секунды
            setTimeout(() => {
                resolve();
            }, 3000);
        });
    }

    /**
     * Завершение анимации гиперпространства
     */
    async endHyperspace() {
        this.hyperspaceOverlay.classList.remove('active');
        
        // Очищаем звёзды
        setTimeout(() => {
            this.stars.forEach(star => {
                star.style.animationDuration = '2s';
            });
        }, 300);
    }

    /**
     * Анимация появления модального окна
     */
    showModal(modalOverlay) {
        return new Promise((resolve) => {
            modalOverlay.classList.add('active');
            
            // Фокус на первом поле ввода
            setTimeout(() => {
                const firstInput = modalOverlay.querySelector('input');
                if (firstInput) {
                    firstInput.focus();
                }
                resolve();
            }, 400);
        });
    }

    /**
     * Анимация скрытия модального окна
     */
    hideModal(modalOverlay) {
        return new Promise((resolve) => {
            modalOverlay.classList.remove('active');
            
            setTimeout(() => {
                resolve();
            }, 400);
        });
    }

    /**
     * Анимация смахивания карты
     */
    swipeCard(cardElement, direction = 'right') {
        return new Promise((resolve) => {
            cardElement.classList.add('swiping');
            
            const translateX = direction === 'right' ? '100vw' : '-100vw';
            
            cardElement.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease';
            cardElement.style.transform = `translateX(${translateX}) rotate(${direction === 'right' ? '15' : '-15'}deg)`;
            cardElement.style.opacity = '0';

            setTimeout(() => {
                cardElement.classList.add('hyperspace');
                resolve();
            }, 600);
        });
    }

    /**
     * Анимация добавления карты в карусель
     */
    animateCardAdd(cardElement) {
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.8) translateY(20px)';
        
        requestAnimationFrame(() => {
            cardElement.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            cardElement.style.opacity = '1';
            cardElement.style.transform = 'scale(1) translateY(0)';
        });
    }

    /**
     * Анимация пульсации для успешной операции
     */
    pulseAnimation(element) {
        element.style.animation = 'pulse-success 0.5s ease';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }

    /**
     * Анимация ошибки
     */
    shakeAnimation(element) {
        element.style.animation = 'shake 0.5s ease';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 500);
    }
}

// Добавляем CSS анимации динамически
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse-success {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
    
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-10px); }
        75% { transform: translateX(10px); }
    }
`;
document.head.appendChild(style);

// Экспорт экземпляра
const animationManager = new AnimationManager();
