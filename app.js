// Основной JavaScript файл приложения

// Состояние приложения
let cards = [];
let currentCardId = null;
let currentActionCardId = null;

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
  initServiceWorker();
  initNavigation();
  initAddCardButton();
  initCardForm();
  initActionMenu();
  loadCards();
  checkInternetConnection();
  
  // Проверка интернета при изменении состояния
  window.addEventListener('online', checkInternetConnection);
  window.addEventListener('offline', checkInternetConnection);
});

// Регистрация Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('Service Worker зарегистрирован'))
      .catch(err => console.error('Ошибка регистрации Service Worker:', err));
  }
}

// Навигация между вкладками
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.dataset.tab;
      
      // Обновляем активные элементы
      navItems.forEach(nav => nav.classList.remove('active'));
      tabContents.forEach(tab => tab.classList.remove('active'));
      
      item.classList.add('active');
      document.getElementById(targetTab).classList.add('active');
    });
  });
}

// Проверка интернет-соединения
function checkInternetConnection() {
  const addButton = document.getElementById('addCardBtn');
  const isOnline = navigator.onLine;
  
  addButton.disabled = !isOnline;
  
  if (!isOnline) {
    addButton.title = 'Требуется интернет-соединение';
  } else {
    addButton.title = 'Добавить карту';
  }
}

// Инициализация кнопки добавления карты
function initAddCardButton() {
  const addButton = document.getElementById('addCardBtn');
  const modal = document.getElementById('addCardModal');
  const closeModal = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  
  addButton.addEventListener('click', () => {
    if (!addButton.disabled) {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  });
  
  closeModal.addEventListener('click', closeAddCardModal);
  cancelBtn.addEventListener('click', closeAddCardModal);
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeAddCardModal();
    }
  });
}

function closeAddCardModal() {
  const modal = document.getElementById('addCardModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  document.getElementById('addCardForm').reset();
  document.getElementById('submitBtn').disabled = true;
}

// Инициализация формы добавления карты
function initCardForm() {
  const form = document.getElementById('addCardForm');
  const cardNumber = document.getElementById('cardNumber');
  const cardExpiry = document.getElementById('cardExpiry');
  const cardCVV = document.getElementById('cardCVV');
  const submitBtn = document.getElementById('submitBtn');
  
  // Маска для номера карты
  cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formatted;
    validateForm();
  });
  
  // Маска для срока действия
  cardExpiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    e.target.value = value;
    validateForm();
  });
  
  // Маска для CVV
  cardCVV.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').substring(0, 3);
    validateForm();
  });
  
  // Инициализация цветовой палитры
  initColorPicker();
  
  // Валидация формы
  function validateForm() {
    const number = cardNumber.value.replace(/\s/g, '');
    const expiry = cardExpiry.value;
    const cvv = cardCVV.value;
    
    const isValid = number.length === 16 && 
                    expiry.length === 5 && 
                    cvv.length === 3;
    
    submitBtn.disabled = !isValid;
  }
  
  // Отправка формы
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const number = cardNumber.value.replace(/\s/g, '');
    const expiry = cardExpiry.value;
    const cvv = cardCVV.value;
    const makePrimary = document.getElementById('makePrimary').checked;
    const selectedColor = document.querySelector('.color-option.selected')?.dataset.color || getBankColor(number);
    
    addCard(number, expiry, cvv, selectedColor, makePrimary);
    closeAddCardModal();
  });
}

// Инициализация цветовой палитры
function initColorPicker() {
  const colorPicker = document.getElementById('colorPicker');
  const colors = [
    { name: 'Синий', value: '#007AFF', dark: '#0051D5' },
    { name: 'Зелёный', value: '#34C759', dark: '#248A3D' },
    { name: 'Красный', value: '#FF3B30', dark: '#D70015' },
    { name: 'Оранжевый', value: '#FF9500', dark: '#CC7700' },
    { name: 'Фиолетовый', value: '#AF52DE', dark: '#8E44AD' },
    { name: 'Розовый', value: '#FF2D55', dark: '#CC1A3D' },
    { name: 'Жёлтый', value: '#FFCC00', dark: '#CC9900' },
  ];
  
  colors.forEach((color, index) => {
    const option = document.createElement('div');
    option.className = 'color-option';
    option.style.background = `linear-gradient(135deg, ${color.value}, ${color.dark})`;
    option.dataset.color = color.value;
    option.dataset.colorDark = color.dark;
    
    if (index === 0) {
      option.classList.add('selected');
    }
    
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
    
    colorPicker.appendChild(option);
  });
}

// Определение цвета банка по BIN
function getBankColor(cardNumber) {
  const bin = cardNumber.substring(0, 6);
  // Простая логика определения банка (можно расширить)
  if (bin.startsWith('4')) return '#007AFF'; // Visa - синий
  if (bin.startsWith('5')) return '#000000'; // Mastercard - чёрный
  return '#007AFF'; // По умолчанию синий
}

// Добавление карты
function addCard(number, expiry, cvv, color, makePrimary) {
  const cardId = generateToken();
  const token = tokenizeCard(number, expiry, cvv);
  
  const card = {
    id: cardId,
    token: token,
    last4: number.slice(-4),
    expiry: expiry,
    color: color,
    colorDark: darkenColor(color),
    isPrimary: makePrimary || cards.length === 0,
    bankName: getBankName(number),
    createdAt: new Date().toISOString()
  };
  
  // Если делаем основной, убираем статус у других
  if (makePrimary) {
    cards.forEach(c => c.isPrimary = false);
    currentCardId = cardId;
  }
  
  cards.push(card);
  saveCards();
  
  if (makePrimary || cards.length === 1) {
    currentCardId = cardId;
  }
  
  renderCards();
  renderMainCard();
}

// Токенизация карты
function tokenizeCard(number, expiry, cvv) {
  // В реальном приложении здесь должен быть запрос к серверу
  // Для MVP генерируем простой токен
  const data = `${number}${expiry}${cvv}${Date.now()}`;
  return btoa(data).substring(0, 32);
}

// Генерация токена
function generateToken() {
  return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Затемнение цвета
function darkenColor(color) {
  // Простое затемнение цвета
  const colors = {
    '#007AFF': '#0051D5',
    '#34C759': '#248A3D',
    '#FF3B30': '#D70015',
    '#FF9500': '#CC7700',
    '#AF52DE': '#8E44AD',
    '#FF2D55': '#CC1A3D',
    '#FFCC00': '#CC9900'
  };
  return colors[color] || '#0051D5';
}

// Определение названия банка
function getBankName(cardNumber) {
  const bin = cardNumber.substring(0, 6);
  // Простая логика (можно расширить)
  if (bin.startsWith('4')) return 'VISA';
  if (bin.startsWith('5')) return 'MASTERCARD';
  return 'BANK';
}

// Сохранение карт в localStorage
function saveCards() {
  localStorage.setItem('cards', JSON.stringify(cards));
}

// Загрузка карт из localStorage
function loadCards() {
  const saved = localStorage.getItem('cards');
  if (saved) {
    cards = JSON.parse(saved);
    const primaryCard = cards.find(c => c.isPrimary);
    currentCardId = primaryCard ? primaryCard.id : (cards[0]?.id || null);
    renderCards();
    renderMainCard();
  }
}

// Отрисовка миниатюр карт
function renderCards() {
  const container = document.getElementById('cardsScroll');
  container.innerHTML = '';
  
  if (cards.length === 0) {
    return;
  }
  
  cards.forEach(card => {
    const miniCard = document.createElement('div');
    miniCard.className = `card-mini ${card.id === currentCardId ? 'active' : ''}`;
    miniCard.style.setProperty('--card-color', card.color);
    miniCard.style.setProperty('--card-color-dark', card.colorDark);
    miniCard.dataset.cardId = card.id;
    
    miniCard.innerHTML = `
      <div style="padding: 8px; height: 100%; display: flex; flex-direction: column; justify-content: space-between;">
        <div style="font-size: 10px; opacity: 0.8;">${card.bankName}</div>
        <div style="font-size: 12px; font-weight: 600;">•••• ${card.last4}</div>
      </div>
    `;
    
    // Обработка кликов и касаний
    let tapStartTime = 0;
    let isLongPress = false;
    
    miniCard.addEventListener('touchstart', (e) => {
      tapStartTime = Date.now();
      isLongPress = false;
    });
    
    miniCard.addEventListener('touchmove', () => {
      isLongPress = true;
    });
    
    miniCard.addEventListener('touchend', (e) => {
      const tapDuration = Date.now() - tapStartTime;
      
      if (!isLongPress && tapDuration < 500) {
        // Короткое нажатие
        if (card.id !== currentCardId) {
          currentCardId = card.id;
          renderCards();
          renderMainCard();
        }
      } else if (tapDuration >= 500) {
        // Долгое удержание - меню действий
        e.preventDefault();
        showActionMenu(card.id);
      }
    });
    
    miniCard.addEventListener('click', (e) => {
      e.preventDefault();
      if (card.id !== currentCardId) {
        currentCardId = card.id;
        renderCards();
        renderMainCard();
      }
    });
    
    // Обработка долгого нажатия через контекстное меню (для десктопа)
    miniCard.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      showActionMenu(card.id);
    });
    
    container.appendChild(miniCard);
  });
}

// Отрисовка основной карты
function renderMainCard() {
  const container = document.getElementById('mainCardContainer');
  const card = cards.find(c => c.id === currentCardId);
  
  if (!card) {
    container.innerHTML = '<div class="card-placeholder"><p>Добавьте карту для начала</p></div>';
    return;
  }
  
  container.innerHTML = `
    <div class="card" id="mainCard">
      <div class="card-face card-front">
        <div class="card-bank-logo">${card.bankName}</div>
        <div class="card-chip"></div>
        <div class="card-number">•••• •••• •••• ${card.last4}</div>
        <div class="card-info">
          <div class="card-holder">CARDHOLDER</div>
          <div class="card-expiry">${card.expiry}</div>
        </div>
      </div>
      <div class="card-face card-back">
        <div class="qr-container">
          <div class="qr-code" id="qrCode"></div>
          <div class="qr-info">
            <div>Токен: ${card.token.substring(0, 8)}...</div>
            <div id="qrTimestamp"></div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  const cardElement = document.getElementById('mainCard');
  cardElement.style.setProperty('--card-color', card.color);
  cardElement.style.setProperty('--card-color-dark', card.colorDark);
  
  // Генерация QR-кода
  generateQRCode(card);
  
  // Обработчики событий для переворота
  let tapStartTime = 0;
  let isLongPress = false;
  
  cardElement.addEventListener('touchstart', (e) => {
    tapStartTime = Date.now();
    isLongPress = false;
  });
  
  cardElement.addEventListener('touchmove', () => {
    isLongPress = true;
  });
  
  cardElement.addEventListener('touchend', (e) => {
    const tapDuration = Date.now() - tapStartTime;
    
    if (tapDuration >= 500) {
      // Долгое удержание - меню действий
      e.preventDefault();
      showActionMenu(card.id);
    } else if (!isLongPress && tapDuration < 500) {
      // Короткое нажатие - переворот
      toggleCardFlip();
    }
  });
  
  cardElement.addEventListener('click', (e) => {
    // Проверяем, не было ли это долгое нажатие
    const clickDuration = Date.now() - tapStartTime;
    if (clickDuration < 500) {
      toggleCardFlip();
    }
  });
  
  // Обработка долгого нажатия через контекстное меню (для десктопа)
  cardElement.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showActionMenu(card.id);
  });
  
  // Обработка долгого нажатия мышью (для десктопа)
  let mouseDownTime = 0;
  cardElement.addEventListener('mousedown', () => {
    mouseDownTime = Date.now();
  });
  
  cardElement.addEventListener('mouseup', (e) => {
    const duration = Date.now() - mouseDownTime;
    if (duration >= 500) {
      e.preventDefault();
      showActionMenu(card.id);
    }
  });
}

// Переворот карты с улучшенной анимацией
function toggleCardFlip() {
  const card = document.getElementById('mainCard');
  if (card) {
    // Добавляем класс для плавной анимации
    card.style.transition = 'transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    card.classList.toggle('flipped');
    
    // Если перевернули на обратную сторону, обновляем QR-код
    if (card.classList.contains('flipped')) {
      const currentCard = cards.find(c => c.id === currentCardId);
      if (currentCard) {
        // Небольшая задержка для плавности анимации
        setTimeout(() => {
          generateQRCode(currentCard);
        }, 350);
      }
    }
  }
}

// Генерация QR-кода
function generateQRCode(card) {
  const qrContainer = document.getElementById('qrCode');
  const timestampEl = document.getElementById('qrTimestamp');
  
  if (!qrContainer) return;
  
  // Данные для QR-кода
  const qrData = {
    token: card.token,
    timestamp: new Date().toISOString(),
    cardId: card.id
  };
  
  const qrString = JSON.stringify(qrData);
  
  qrContainer.innerHTML = '';
  
  // Используем библиотеку QRCode если доступна, иначе создаём простую визуализацию
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(qrContainer, qrString, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }, (error) => {
      if (error) {
        console.error('Ошибка генерации QR-кода:', error);
        createSimpleQR(qrContainer, qrString);
      }
    });
  } else {
    createSimpleQR(qrContainer, qrString);
  }
  
  // Обновляем время генерации
  if (timestampEl) {
    const now = new Date();
    timestampEl.textContent = `Сгенерировано: ${now.toLocaleString('ru-RU')}`;
  }
}

// Простая визуализация QR-кода (fallback)
function createSimpleQR(container, data) {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 200, 200);
  ctx.fillStyle = '#fff';
  
  const hash = data.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const size = 10;
  
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 20; j++) {
      const value = (hash + i * 20 + j) % 2;
      if (value === 0) {
        ctx.fillRect(i * size, j * size, size, size);
      }
    }
  }
  
  container.appendChild(canvas);
}

// Инициализация меню действий
function initActionMenu() {
  const actionMenu = document.getElementById('actionMenu');
  const setPrimaryBtn = document.getElementById('setPrimaryBtn');
  const removePrimaryBtn = document.getElementById('removePrimaryBtn');
  const deleteCardBtn = document.getElementById('deleteCardBtn');
  const cancelActionBtn = document.getElementById('cancelActionBtn');
  
  cancelActionBtn.addEventListener('click', () => {
    actionMenu.classList.remove('active');
    document.body.style.overflow = '';
  });
  
  actionMenu.addEventListener('click', (e) => {
    if (e.target === actionMenu) {
      actionMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  setPrimaryBtn.addEventListener('click', () => {
    if (currentActionCardId) {
      setPrimaryCard(currentActionCardId);
      actionMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  removePrimaryBtn.addEventListener('click', () => {
    if (currentActionCardId) {
      removePrimaryCard(currentActionCardId);
      actionMenu.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
  
  deleteCardBtn.addEventListener('click', () => {
    if (currentActionCardId) {
      // Используем нативное диалоговое окно
      const confirmed = window.confirm('Вы уверены, что хотите удалить эту карту?');
      if (confirmed) {
        deleteCard(currentActionCardId);
        actionMenu.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });
}

// Показать меню действий
function showActionMenu(cardId) {
  const actionMenu = document.getElementById('actionMenu');
  const setPrimaryBtn = document.getElementById('setPrimaryBtn');
  const removePrimaryBtn = document.getElementById('removePrimaryBtn');
  
  currentActionCardId = cardId;
  const card = cards.find(c => c.id === cardId);
  
  if (card && card.isPrimary) {
    setPrimaryBtn.style.display = 'none';
    removePrimaryBtn.style.display = 'block';
  } else {
    setPrimaryBtn.style.display = 'block';
    removePrimaryBtn.style.display = 'none';
  }
  
  actionMenu.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Установить основную карту
function setPrimaryCard(cardId) {
  cards.forEach(c => c.isPrimary = false);
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.isPrimary = true;
    currentCardId = cardId;
    saveCards();
    renderCards();
    renderMainCard();
  }
}

// Убрать из основных
function removePrimaryCard(cardId) {
  const card = cards.find(c => c.id === cardId);
  if (card) {
    card.isPrimary = false;
    saveCards();
    renderCards();
  }
}

// Удалить карту
function deleteCard(cardId) {
  cards = cards.filter(c => c.id !== cardId);
  
  if (currentCardId === cardId) {
    const primaryCard = cards.find(c => c.isPrimary);
    currentCardId = primaryCard ? primaryCard.id : (cards[0]?.id || null);
  }
  
  saveCards();
  renderCards();
  renderMainCard();
}
