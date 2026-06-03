/**
 * PNN Wallet - Управление картами
 */

import { 
  formatCardNumber, 
  formatExpiryDate, 
  isValidCardNumber, 
  isValidExpiryDate, 
  isValidCVV,
  getRandomCardColor,
  maskCardNumber 
} from './utils.js';

/**
 * Класс для управления коллекцией карт
 */
export class CardManager {
  constructor() {
    this.cards = [];
    this.mainCardId = null;
  }

  /**
   * Добавляет новую карту
   * @param {Object} cardData - Данные карты
   * @returns {Object} Добавленная карта
   */
  addCard(cardData) {
    const card = {
      id: Date.now().toString(),
      number: cardData.number,
      expiryDate: cardData.expiryDate,
      color: cardData.color || getRandomCardColor(),
      isMain: cardData.isMain || false,
      createdAt: new Date().toISOString()
    };

    // Если карта помечена как основная
    if (card.isMain) {
      this.setMainCard(card.id);
    }

    this.cards.push(card);
    return card;
  }

  /**
   * Устанавливает карту как основную
   * @param {string} cardId - ID карты
   */
  setMainCard(cardId) {
    // Снимаем статус основной со всех карт
    this.cards.forEach(card => {
      card.isMain = false;
    });

    // Устанавливаем основную карту
    const card = this.cards.find(c => c.id === cardId);
    if (card) {
      card.isMain = true;
      this.mainCardId = cardId;
    }
  }

  /**
   * Получает основную карту
   * @returns {Object|null} Основная карта или null
   */
  getMainCard() {
    return this.cards.find(card => card.isMain) || null;
  }

  /**
   * Получает все карты
   * @returns {Array} Массив карт
   */
  getAllCards() {
    return this.cards;
  }

  /**
   * Удаляет карту
   * @param {string} cardId - ID карты
   */
  removeCard(cardId) {
    const index = this.cards.findIndex(card => card.id === cardId);
    if (index !== -1) {
      const card = this.cards[index];
      
      // Если удаляемая карта была основной, сбрасываем
      if (card.isMain) {
        this.mainCardId = null;
      }
      
      this.cards.splice(index, 1);
    }
  }

  /**
   * Получает карту по ID
   * @param {string} cardId - ID карты
   * @returns {Object|null} Карта или null
   */
  getCard(cardId) {
    return this.cards.find(card => card.id === cardId) || null;
  }

  /**
   * Валидирует данные формы карты
   * @param {Object} formData - Данные формы
   * @returns {Object} Результат валидации
   */
  validateCardForm(formData) {
    const errors = {};

    if (!isValidCardNumber(formData.number)) {
      errors.number = 'Введите корректный номер карты (16-19 цифр)';
    }

    if (!isValidExpiryDate(formData.expiryDate)) {
      errors.expiryDate = 'Введите корректный срок действия';
    }

    if (formData.cvv && !isValidCVV(formData.cvv)) {
      errors.cvv = 'Введите корректный CVV (3 цифры)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

/**
 * Класс для управления формой добавления карты
 */
export class CardForm {
  constructor(onSubmit, onCancel) {
    this.onSubmit = onSubmit;
    this.onCancel = onCancel;
    this.isMain = false;
    
    this.elements = {
      overlay: document.getElementById('modalOverlay'),
      card: document.getElementById('modalCard'),
      cardNumber: document.getElementById('cardNumber'),
      expiryDate: document.getElementById('expiryDate'),
      cvv: document.getElementById('cvv'),
      starBtn: document.getElementById('starBtn'),
      okBtn: document.getElementById('okBtn'),
      cancelBtn: document.getElementById('cancelBtn')
    };

    this.init();
  }

  /**
   * Инициализация обработчиков событий
   */
  init() {
    // Форматирование номера карты с автопереходом и скроллом
    this.elements.cardNumber.addEventListener('input', (e) => {
      const formatted = formatCardNumber(e.target.value);
      e.target.value = formatted;
      this.checkFormValidity();
      
      // Автопереход к следующему полю при заполнении
      if (formatted.replace(/\s/g, '').length >= 16) {
        this.scrollToField(this.elements.expiryDate);
      }
    });

    // Фокус на поле номера карты - скролл к полю
    this.elements.cardNumber.addEventListener('focus', (e) => {
      this.scrollToField(e.target);
    });

    // Форматирование срока действия с автопереходом и скроллом
    this.elements.expiryDate.addEventListener('input', (e) => {
      const formatted = formatExpiryDate(e.target.value);
      e.target.value = formatted;
      this.checkFormValidity();
      
      // Автопереход к CVV при заполнении
      if (formatted.length === 5) {
        this.scrollToField(this.elements.cvv);
      }
    });

    // Фокус на поле срока действия - скролл к полю
    this.elements.expiryDate.addEventListener('focus', (e) => {
      this.scrollToField(e.target);
    });

    // Ввод CVV
    this.elements.cvv.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '');
      this.checkFormValidity();
    });

    // Фокус на поле CVV - скролл к полю
    this.elements.cvv.addEventListener('focus', (e) => {
      this.scrollToField(e.target);
    });

    // Кнопка звезды (основная карта)
    this.elements.starBtn.addEventListener('click', () => {
      this.isMain = !this.isMain;
      this.elements.starBtn.classList.toggle('active', this.isMain);
    });

    // Кнопка отмены
    this.elements.cancelBtn.addEventListener('click', () => {
      this.hide();
    });

    // Кнопка OK
    this.elements.okBtn.addEventListener('click', () => {
      if (this.elements.okBtn.disabled) return;
      
      const formData = this.getFormData();
      this.onSubmit(formData, this.isMain);
      this.hide();
    });

    // Закрытие по клику на overlay
    this.elements.overlay.addEventListener('click', (e) => {
      if (e.target === this.elements.overlay) {
        this.hide();
      }
    });

    // Обработка клавиши Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.elements.overlay.classList.contains('active')) {
        this.hide();
      }
    });

    // Обработка изменения размера окна (клавиатура)
    this.handleKeyboardResize();
  }

  /**
   * Плавный скролл к полю ввода с учетом клавиатуры
   * @param {HTMLElement} field - Поле ввода
   */
  scrollToField(field) {
    // Небольшая задержка для открытия клавиатуры
    setTimeout(() => {
      // Используем visualViewport для iOS
      if (window.visualViewport) {
        const fieldRect = field.getBoundingClientRect();
        const viewportHeight = window.visualViewport.height;
        const keyboardHeight = window.innerHeight - viewportHeight;
        
        // Если поле скрыто за клавиатурой
        if (fieldRect.bottom > viewportHeight - 50) {
          const scrollOffset = fieldRect.bottom - viewportHeight + 100;
          window.scrollBy({
            top: scrollOffset,
            behavior: 'smooth'
          });
        }
      }
      
      // Fallback: scrollIntoView
      field.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }, 150);
  }

  /**
   * Обработка изменения размера окна при открытии/закрытии клавиатуры
   */
  handleKeyboardResize() {
    let lastHeight = window.innerHeight;
    
    window.visualViewport?.addEventListener('resize', () => {
      const currentHeight = window.visualViewport.height;
      
      // Клавиатура открылась
      if (currentHeight < lastHeight - 100) {
        document.body.style.height = `${currentHeight}px`;
        
        // Скролл к активному полю
        const activeElement = document.activeElement;
        if (activeElement && activeElement.tagName === 'INPUT') {
          this.scrollToField(activeElement);
        }
      }
      // Клавиатура закрылась
      else if (currentHeight > lastHeight + 100) {
        document.body.style.height = '';
      }
      
      lastHeight = currentHeight;
    });
  }

  /**
   * Проверяет валидность формы и активирует кнопку OK
   */
  checkFormValidity() {
    const number = this.elements.cardNumber.value.replace(/\s/g, '');
    const expiryDate = this.elements.expiryDate.value;
    const cvv = this.elements.cvv.value;

    const isValid = isValidCardNumber(this.elements.cardNumber.value) &&
                    isValidExpiryDate(expiryDate);

    this.elements.okBtn.disabled = !isValid;
  }

  /**
   * Получает данные формы
   * @returns {Object} Данные формы
   */
  getFormData() {
    return {
      number: this.elements.cardNumber.value,
      expiryDate: this.elements.expiryDate.value,
      cvv: this.elements.cvv.value
    };
  }

  /**
   * Показывает модальное окно
   */
  show() {
    this.elements.overlay.classList.add('active');
    
    // Автофокус на первом поле после анимации
    setTimeout(() => {
      this.elements.cardNumber.focus();
    }, 400);
  }

  /**
   * Скрывает модальное окно и сбрасывает форму
   */
  hide() {
    this.elements.overlay.classList.remove('active');
    this.reset();
  }

  /**
   * Сбрасывает форму
   */
  reset() {
    this.elements.cardNumber.value = '';
    this.elements.expiryDate.value = '';
    this.elements.cvv.value = '';
    this.isMain = false;
    this.elements.starBtn.classList.remove('active');
    this.elements.okBtn.disabled = true;
  }
}

/**
 * Класс для рендеринга карточек
 */
export class CardRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  /**
   * Создает SVG иконку звезды
   * @param {boolean} filled - Заполненная звезда или нет
   * @returns {string} SVG строка
   */
  createStarIcon(filled = false) {
    if (filled) {
      return `
        <svg class="star" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
      `;
    }
    return `
      <svg class="star" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
      </svg>
    `;
  }

  /**
   * Рендерит одну карточку
   * @param {Object} card - Данные карты
   * @returns {string} HTML строка
   */
  renderCard(card) {
    const starIcon = card.isMain ? this.createStarIcon(true) : '';
    const maskedNumber = maskCardNumber(card.number);
    
    return `
      <div class="token-card ${card.color}" data-card-id="${card.id}">
        ${starIcon}
        <span class="bank-name">Bank ${card.id.slice(-2)}</span>
        <span class="card-number">${maskedNumber}</span>
      </div>
    `;
  }

  /**
   * Рендерит все карты
   * @param {Array} cards - Массив карт
   */
  renderAll(cards) {
    this.container.innerHTML = cards.map(card => this.renderCard(card)).join('');
  }

  /**
   * Добавляет карту в список
   * @param {Object} card - Данные карты
   */
  addCard(card) {
    const cardHTML = this.renderCard(card);
    this.container.insertAdjacentHTML('beforeend', cardHTML);
  }

  /**
   * Удаляет карту из списка
   * @param {string} cardId - ID карты
   */
  removeCard(cardId) {
    const cardElement = this.container.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
      cardElement.remove();
    }
  }

  /**
   * Обновляет отображение основной карты
   * @param {string} mainCardId - ID основной карты
   */
  updateMainCard(mainCardId) {
    const allStars = this.container.querySelectorAll('.star');
    allStars.forEach(star => star.remove());

    const cards = this.container.querySelectorAll('.token-card');
    cards.forEach(card => {
      const cardId = card.getAttribute('data-card-id');
      if (cardId === mainCardId) {
        card.insertAdjacentHTML('afterbegin', this.createStarIcon(true));
      }
    });
  }
}
