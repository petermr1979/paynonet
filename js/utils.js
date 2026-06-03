/**
 * PNN Wallet - Вспомогательные утилиты
 */

/**
 * Форматирует номер карты: разбивает на группы по 4 цифры
 * @param {string} value - Вводимое значение
 * @returns {string} Отформатированный номер
 */
export function formatCardNumber(value) {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, '');
  
  // Разбиваем на группы по 4 цифры
  const groups = digits.match(/.{1,4}/g);
  
  if (!groups) return '';
  
  return groups.join(' ');
}

/**
 * Форматирует срок действия карты (MM/YY)
 * @param {string} value - Вводимое значение
 * @returns {string} Отформатированная дата
 */
export function formatExpiryDate(value) {
  // Удаляем все нецифровые символы
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  if (digits.length <= 2) return digits;
  
  const month = digits.slice(0, 2);
  const year = digits.slice(2, 4);
  
  return `${month}/${year}`;
}

/**
 * Проверяет, является ли дата валидной (не в прошлом)
 * @param {string} expiryDate - Дата в формате MM/YY
 * @returns {boolean} Валидна ли дата
 */
export function isValidExpiryDate(expiryDate) {
  if (!expiryDate || expiryDate.length !== 5) return false;
  
  const [monthStr, yearStr] = expiryDate.split('/');
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  
  // Проверка месяца
  if (month < 1 || month > 12) return false;
  
  // Получаем текущую дату
  const now = new Date();
  const currentYear = now.getFullYear() % 100; // Последние 2 цифры года
  const currentMonth = now.getMonth() + 1;
  
  // Проверка, что дата не в прошлом
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  
  return true;
}

/**
 * Проверяет, является ли номер карты валидным (16-19 цифр)
 * @param {string} cardNumber - Номер карты
 * @returns {boolean} Валиден ли номер
 */
export function isValidCardNumber(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  return digits.length >= 16 && digits.length <= 19;
}

/**
 * Проверяет, является ли CVV валидным (3 цифры)
 * @param {string} cvv - CVV код
 * @returns {boolean} Валиден ли CVV
 */
export function isValidCVV(cvv) {
  return /^\d{3}$/.test(cvv);
}

/**
 * Генерирует случайный цвет для карты
 * @returns {string} Название цвета
 */
export function getRandomCardColor() {
  const colors = ['yellow', 'red', 'blue', 'green'];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Маскирует номер карты для отображения
 * @param {string} cardNumber - Номер карты
 * @returns {string} Замаскированный номер
 */
export function maskCardNumber(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 4) return '•••• •••• •••• ••••';
  
  const lastFour = digits.slice(-4);
  return `•••• •••• •••• ${lastFour}`;
}

/**
 * Определяет тип карты по номеру
 * @param {string} cardNumber - Номер карты
 * @returns {string} Тип карты (Visa, MasterCard, etc.)
 */
export function getCardType(cardNumber) {
  const digits = cardNumber.replace(/\D/g, '');
  
  if (/^4/.test(digits)) return 'Visa';
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'MasterCard';
  if (/^3[47]/.test(digits)) return 'American Express';
  if (/^6(?:011|5)/.test(digits)) return 'Discover';
  
  return 'Unknown';
}

/**
 * Задержка выполнения (Promise-based sleep)
 * @param {number} ms - Время в миллисекундах
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Проверяет, поддерживает ли браузер определенные функции
 * @returns {Object} Объект с информацией о поддержке
 */
export function checkBrowserSupport() {
  return {
    backdropFilter: 'backdropFilter' in document.body.style || 
                    'webkitBackdropFilter' in document.body.style,
    touchEvents: 'ontouchstart' in window,
    serviceWorker: 'serviceWorker' in navigator
  };
}
