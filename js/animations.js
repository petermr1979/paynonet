/**
 * PNN Wallet - Анимации и эффекты
 */

/**
 * Класс для управления эффектом полета (Star Wars style)
 */
export class FlightEffect {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.isRunning = false;
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  /**
   * Изменяет размер canvas
   */
  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.width = rect.width;
    this.height = rect.height;
  }

  /**
   * Создает частицу
   * @returns {Object} Частица
   */
  createParticle() {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    
    return {
      x: this.width / 2,
      y: this.height / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.5,
      trail: []
    };
  }

  /**
   * Обновляет частицу
   * @param {Object} particle - Частица
   */
  updateParticle(particle) {
    // Сохраняем позицию для trail
    particle.trail.push({ x: particle.x, y: particle.y });
    if (particle.trail.length > 20) {
      particle.trail.shift();
    }

    // Двигаем частицу
    particle.x += particle.vx;
    particle.y += particle.vy;

    // Увеличиваем скорость для эффекта ускорения
    particle.vx *= 1.02;
    particle.vy *= 1.02;

    // Уменьшаем прозрачность
    particle.alpha *= 0.995;
  }

  /**
   * Рисует частицу
   * @param {Object} particle - Частица
   */
  drawParticle(particle) {
    // Рисуем trail
    if (particle.trail.length > 1) {
      this.ctx.beginPath();
      this.ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
      
      for (let i = 1; i < particle.trail.length; i++) {
        this.ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
      }
      
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${particle.alpha * 0.3})`;
      this.ctx.lineWidth = particle.size * 0.5;
      this.ctx.stroke();
    }

    // Рисуем саму частицу
    this.ctx.beginPath();
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
    this.ctx.fill();
  }

  /**
   * Анимационный цикл
   */
  animate() {
    // Очищаем canvas с полупрозрачным фоном для эффекта motion blur
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Создаем новые частицы
    if (this.particles.length < 300) {
      this.particles.push(this.createParticle());
    }

    // Обновляем и рисуем частицы
    this.particles.forEach((particle, index) => {
      this.updateParticle(particle);
      this.drawParticle(particle);

      // Удаляем частицы за пределами экрана
      if (
        particle.x < -50 || 
        particle.x > this.width + 50 || 
        particle.y < -50 || 
        particle.y > this.height + 50 ||
        particle.alpha < 0.01
      ) {
        this.particles.splice(index, 1);
      }
    });

    if (this.isRunning) {
      this.animationId = requestAnimationFrame(() => this.animate());
    }
  }

  /**
   * Запускает эффект
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.particles = [];
    this.ctx.fillStyle = 'rgba(0, 0, 0, 1)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.animate();
  }

  /**
   * Останавливает эффект
   * @param {boolean} clear - Очистить ли canvas
   */
  stop(clear = true) {
    this.isRunning = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (clear) {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  /**
   * Очищает частицы
   */
  clear() {
    this.particles = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

/**
 * Класс для управления анимациями модалки
 */
export class ModalAnimations {
  /**
   * Анимация появления модалки (flip-up)
   * @param {HTMLElement} element - Элемент модалки
   * @returns {Promise<void>}
   */
  static async show(element) {
    return new Promise((resolve) => {
      element.style.transform = 'translateY(100%) rotateX(90deg)';
      element.style.opacity = '0';
      
      requestAnimationFrame(() => {
        element.style.transition = 'transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s ease';
        element.style.transform = 'translateY(0) rotateX(0)';
        element.style.opacity = '1';
        
        setTimeout(resolve, 400);
      });
    });
  }

  /**
   * Анимация скрытия модалки (flip-down)
   * @param {HTMLElement} element - Элемент модалки
   * @returns {Promise<void>}
   */
  static async hide(element) {
    return new Promise((resolve) => {
      element.style.transition = 'transform 0.3s cubic-bezier(0.55, 0.055, 0.675, 0.19), opacity 0.3s ease';
      element.style.transform = 'translateY(100%) rotateX(90deg)';
      element.style.opacity = '0';
      
      setTimeout(resolve, 300);
    });
  }
}

/**
 * Класс для управления анимациями карт
 */
export class CardAnimations {
  /**
   * Анимация добавления карты
   * @param {HTMLElement} element - Элемент карты
   * @returns {Promise<void>}
   */
  static async add(element) {
    element.style.transform = 'scale(0.8) translateY(20px)';
    element.style.opacity = '0';
    
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease';
        element.style.transform = 'scale(1) translateY(0)';
        element.style.opacity = '1';
        
        setTimeout(resolve, 300);
      });
    });
  }

  /**
   * Анимация удаления карты
   * @param {HTMLElement} element - Элемент карты
   * @returns {Promise<void>}
   */
  static async remove(element) {
    element.style.transition = 'transform 0.2s cubic-bezier(0.55, 0.055, 0.675, 0.19), opacity 0.2s ease';
    element.style.transform = 'scale(0.8) translateX(100px)';
    element.style.opacity = '0';
    
    return new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }

  /**
   * Анимация нажатия на карту
   * @param {HTMLElement} element - Элемент карты
   */
  static press(element) {
    element.style.transform = 'scale(0.96)';
    
    setTimeout(() => {
      element.style.transform = 'scale(1)';
    }, 150);
  }
}

/**
 * Класс для управления анимациями кнопок
 */
export class ButtonAnimations {
  /**
   * Анимация активации кнопки
   * @param {HTMLElement} button - Элемент кнопки
   */
  static activate(button) {
    button.style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease';
    button.style.opacity = '1';
    button.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
      button.style.transform = 'scale(1)';
    }, 200);
  }

  /**
   * Анимация деактивации кнопки
   * @param {HTMLElement} button - Элемент кнопки
   */
  static deactivate(button) {
    button.style.transition = 'opacity 0.2s ease';
    button.style.opacity = '0.5';
  }
}

/**
 * Класс для управления анимациями переключения вкладок
 */
export class TabAnimations {
  /**
   * Анимация переключения вкладки
   * @param {HTMLElement} fromTab - Текущая вкладка
   * @param {HTMLElement} toTab - Новая вкладка
   */
  static switch(fromTab, toTab) {
    // Анимация иконки активной вкладки
    toTab.querySelector('svg').style.transition = 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    toTab.querySelector('svg').style.transform = 'scale(1.1)';
    
    setTimeout(() => {
      toTab.querySelector('svg').style.transform = 'scale(1)';
    }, 200);
  }
}

/**
 * Класс для управления анимациями загрузки
 */
export class LoadingAnimations {
  /**
   * Показывает индикатор загрузки
   * @param {HTMLElement} overlay - Элемент overlay
   * @returns {Promise<void>}
   */
  static async show(overlay) {
    overlay.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    
    return new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }

  /**
   * Скрывает индикатор загрузки
   * @param {HTMLElement} overlay - Элемент overlay
   * @returns {Promise<void>}
   */
  static async hide(overlay) {
    overlay.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    
    return new Promise((resolve) => {
      setTimeout(resolve, 300);
    });
  }
}
