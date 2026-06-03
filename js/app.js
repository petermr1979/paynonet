/**
 * PNN Wallet - Основное приложение
 */

import { CardManager, CardForm, CardRenderer } from './cards.js';
import { FlightEffect, LoadingAnimations } from './animations.js';
import { sleep } from './utils.js';

/**
 * Главный класс приложения
 */
class App {
  constructor() {
    // Менеджеры
    this.cardManager = new CardManager();
    this.cardRenderer = new CardRenderer('cardsGrid');
    
    // Эффекты
    this.flightEffect = new FlightEffect('flightCanvas');
    
    // Состояние
    this.isPaymentMode = false;
    this.currentCard = null;
    
    // Элементы UI
    this.elements = {
      addCardBtn: document.getElementById('addCardBtn'),
      profileBtn: document.getElementById('profileBtn'),
      bigCard: document.getElementById('bigCard'),
      bigCardOverlay: document.getElementById('bigCardOverlay'),
      cancelPaymentBtn: document.getElementById('cancelPaymentBtn'),
      modalOverlay: document.getElementById('modalOverlay'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      tabBtns: document.querySelectorAll('.tab-btn')
    };

    // Инициализация
    this.init();
  }

  /**
   * Инициализация приложения
   */
  async init() {
    // Регистрация Service Worker
    await this.registerServiceWorker();
    
    // Инициализация формы добавления карты
    this.initCardForm();
    
    // Настройка обработчиков событий
    this.initEventListeners();
    
    // Показываем пустое состояние (карт нет)
    this.renderEmptyState();
    
    // Скрываем большую карту
    this.hideBigCard();
    
    console.log('PNN Wallet initialized');
  }

  /**
   * Регистрация Service Worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('Service Worker registered:', registration.scope);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Инициализация формы добавления карты
   */
  initCardForm() {
    this.cardForm = new CardForm(
      (formData, isMain) => this.handleCardSubmit(formData, isMain),
      () => console.log('Form cancelled')
    );
  }

  /**
   * Настройка обработчиков событий
   */
  initEventListeners() {
    // Кнопка добавления карты
    this.elements.addCardBtn.addEventListener('click', (e) => {
      console.log('Add card button clicked!', e);
      this.cardForm.show();
    });
    
    // Отладка: проверка что кнопка существует
    console.log('Add button element:', this.elements.addCardBtn);

    // Кнопка профиля (заглушка)
    this.elements.profileBtn.addEventListener('click', () => {
      console.log('Profile button clicked');
      // TODO: Реализовать переход в профиль
    });

    // Большая карта - swipe жесты
    this.initSwipeGestures();

    // Кнопка отмены оплаты
    this.elements.cancelPaymentBtn.addEventListener('click', () => {
      this.exitPaymentMode();
    });

    // Вкладки навигации
    this.elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.handleTabSwitch(e.currentTarget);
      });
    });

    // Обработка жестов клавиатуры на iOS
    this.handleIOSKeyboard();
  }

  /**
   * Инициализация swipe жестов и клика для большой карты
   */
  initSwipeGestures() {
    let startX = 0;
    let currentX = 0;
    let isSwiping = false;
    let startTime = 0;
    const threshold = 50; // Минимальное расстояние для swipe
    const timeThreshold = 300; // Максимальное время для клика

    const bigCard = this.elements.bigCard;

    // Touch start
    bigCard.addEventListener('touchstart', (e) => {
      if (this.isPaymentMode) return;
      
      startX = e.touches[0].clientX;
      startTime = Date.now();
      isSwiping = true;
    }, { passive: true });

    // Touch move
    bigCard.addEventListener('touchmove', (e) => {
      if (!isSwiping || this.isPaymentMode) return;
      
      currentX = e.touches[0].clientX;
      const diff = currentX - startX;
      
      // Только свайп влево
      if (diff < 0) {
        const opacity = Math.min(Math.abs(diff) / threshold, 1);
        this.elements.bigCardOverlay.style.opacity = opacity;
      }
    }, { passive: true });

    // Touch end
    bigCard.addEventListener('touchend', (e) => {
      if (!isSwiping || this.isPaymentMode) return;
      
      const diff = currentX - startX;
      const elapsedTime = Date.now() - startTime;
      
      // Если это был быстрый клик (не свайп)
      if (Math.abs(diff) < 10 && elapsedTime < timeThreshold) {
        // Клик по карте - запуск анимации полета
        this.enterPaymentMode();
      } else if (diff < -threshold) {
        // Свайп влево - активация оплаты
        this.enterPaymentMode();
      } else {
        // Возврат в исходное положение
        this.elements.bigCardOverlay.style.opacity = '0';
      }
      
      isSwiping = false;
      currentX = 0;
    }, { passive: true });

    // Mouse events для десктопного тестирования
    bigCard.addEventListener('mousedown', (e) => {
      if (this.isPaymentMode) return;
      startX = e.clientX;
      startTime = Date.now();
      isSwiping = true;
    });

    bigCard.addEventListener('mousemove', (e) => {
      if (!isSwiping || this.isPaymentMode) return;
      
      currentX = e.clientX;
      const diff = currentX - startX;
      
      if (diff < 0) {
        const opacity = Math.min(Math.abs(diff) / threshold, 1);
        this.elements.bigCardOverlay.style.opacity = opacity;
      }
    });

    bigCard.addEventListener('mouseup', (e) => {
      if (!isSwiping || this.isPaymentMode) return;
      
      const diff = currentX - startX;
      const elapsedTime = Date.now() - startTime;
      
      // Если это был быстрый клик (не свайп)
      if (Math.abs(diff) < 10 && elapsedTime < timeThreshold) {
        this.enterPaymentMode();
      } else if (diff < -threshold) {
        this.enterPaymentMode();
      } else {
        this.elements.bigCardOverlay.style.opacity = '0';
      }
      
      isSwiping = false;
      currentX = 0;
    });

    bigCard.addEventListener('mouseleave', () => {
      if (!isSwiping || this.isPaymentMode) return;
      this.elements.bigCardOverlay.style.opacity = '0';
      isSwiping = false;
    });
  }

  /**
   * Вход в режим оплаты
   */
  enterPaymentMode() {
    if (this.isPaymentMode) return;
    
    this.isPaymentMode = true;
    this.elements.bigCardOverlay.classList.add('active');
    
    // Запуск эффекта полета
    this.flightEffect.start();
  }

  /**
   * Выход из режима оплаты
   */
  async exitPaymentMode() {
    if (!this.isPaymentMode) return;
    
    // Анимация "схлопывания" (обратный эффект)
    this.flightEffect.stop(true);
    this.elements.bigCardOverlay.classList.remove('active');
    
    await sleep(300);
    this.isPaymentMode = false;
  }

  /**
   * Обработка отправки формы карты
   * @param {Object} formData - Данные формы
   * @param {boolean} isMain - Флаг основной карты
   */
  async handleCardSubmit(formData, isMain) {
    // Добавляем карту
    const card = this.cardManager.addCard({
      ...formData,
      isMain
    });

    // Если это первая карта, убираем пустое состояние и показываем большую карту
    if (this.cardManager.cards.length === 1) {
      document.getElementById('cardsGrid').innerHTML = '';
      this.showBigCard();
    }

    // Рендерим карту в верхней сетке (всегда добавляем)
    this.cardRenderer.addCard(card);

    // Обновляем большую карту внизу (основная или последняя добавленная)
    this.updateBigCard();

    // Показываем индикатор загрузки
    await LoadingAnimations.show(this.elements.loadingOverlay);

    // Имитация токенизации (2 секунды)
    await sleep(2000);

    // Скрываем индикатор загрузки
    await LoadingAnimations.hide(this.elements.loadingOverlay);

    console.log('Card added:', card);
  }

  /**
   * Обновляет большую карту внизу (основная или последняя добавленная)
   */
  updateBigCard() {
    const bigCard = this.elements.bigCard;
    const content = bigCard.querySelector('.big-card-content');
    
    // Получаем основную карту или последнюю добавленную
    const card = this.cardManager.getMainCard() || this.cardManager.cards[this.cardManager.cards.length - 1];
    
    if (!card) return;
    
    // Определяем цвет карты для градиента
    const gradients = {
      yellow: 'linear-gradient(135deg, #FFD60A 0%, #FFB800 100%)',
      red: 'linear-gradient(135deg, #FF3B30 0%, #FF2D55 100%)',
      blue: 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
      green: 'linear-gradient(135deg, #34C759 0%, #30B0C7 100%)'
    };
    
    const gradient = gradients[card.color] || gradients.blue;
    
    // Обновляем стиль большой карты
    bigCard.style.background = gradient;
    
    // Обновляем номер карты
    const maskedNumber = this.maskCardNumberBig(card.number);
    content.querySelector('.big-card-number').textContent = maskedNumber;
    
    // Удаляем старую звезду если есть
    const oldStar = content.querySelector('.star');
    if (oldStar) oldStar.remove();
    
    // Добавляем звезду если карта основная
    if (card.isMain) {
      const starHTML = `
        <svg class="star" style="position: absolute; top: 20px; right: 20px; width: 28px; height: 28px; color: rgba(255, 255, 255, 0.9);" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      `;
      content.insertAdjacentHTML('afterbegin', starHTML);
    }
  }

  /**
   * Маскирует номер карты для большой карты
   * @param {string} number - Номер карты
   * @returns {string} Замаскированный номер
   */
  maskCardNumberBig(number) {
    const cleanNumber = number.replace(/\D/g, '');
    const last4 = cleanNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  }

  /**
   * Переключение вкладок
   * @param {HTMLElement} tab - Элемент вкладки
   */
  handleTabSwitch(tab) {
    const tabName = tab.getAttribute('data-tab');

    // Обновляем активный класс
    this.elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn === tab);
    });

    console.log('Tab switched:', tabName);

    // TODO: Реализовать переключение контента
    if (tabName === 'history') {
      // Переход на страницу истории
      // window.location.href = 'pages/history.html';
    }
  }

  /**
   * Добавление демо-карт для демонстрации
   */
  addDemoCards() {
    const demoCards = [
      {
        id: '1',
        number: '4000 1234 5678 9010',
        expiryDate: '12/25',
        color: 'yellow',
        isMain: true
      },
      {
        id: '2',
        number: '5500 1234 5678 9012',
        expiryDate: '06/26',
        color: 'red',
        isMain: false
      },
      {
        id: '3',
        number: '3400 1234 5678 901',
        expiryDate: '03/27',
        color: 'blue',
        isMain: false
      },
      {
        id: '4',
        number: '6011 1234 5678 9012',
        expiryDate: '09/25',
        color: 'green',
        isMain: false
      }
    ];

    demoCards.forEach(card => {
      this.cardManager.cards.push(card);
      this.cardRenderer.addCard(card);
    });

    // Устанавливаем основную карту
    this.cardManager.setMainCard('1');
  }

  /**
   * Показывает пустое состояние (нет карт)
   */
  renderEmptyState() {
    const grid = document.getElementById('cardsGrid');
    grid.innerHTML = `
      <div class="cards-empty" style="grid-column: 1 / -1;">
        <div class="cards-empty-text">Нет добавленных карт</div>
        <div class="cards-empty-hint">Нажмите + чтобы добавить карту</div>
      </div>
    `;
  }

  /**
   * Показывает большую карту
   */
  showBigCard() {
    const bigCardSection = document.getElementById('bigCardSection');
    if (bigCardSection) {
      bigCardSection.classList.remove('hidden');
      bigCardSection.classList.add('visible');
    }
  }

  /**
   * Скрывает большую карту
   */
  hideBigCard() {
    const bigCardSection = document.getElementById('bigCardSection');
    if (bigCardSection) {
      bigCardSection.classList.remove('visible');
      bigCardSection.classList.add('hidden');
    }
  }

  /**
   * Обработка клавиатуры на iOS
   */
  handleIOSKeyboard() {
    // Предотвращаем зум при фокусе на input
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT') {
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      }
    });
  }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
