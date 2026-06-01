/**
 * PNN Wallet - Application Logic
 * iOS 16+ PWA with Glass Morphism Design
 */

(function() {
    'use strict';

    // ========================================
    // State Management
    // ========================================
    const STORAGE_KEY = 'pnn_wallet_cards';
    const PRIMARY_CARD_KEY = 'pnn_wallet_primary';

    let state = {
        cards: [],
        primaryCardId: null,
        isModalOpen: false
    };

    // ========================================
    // DOM Elements
    // ========================================
    const elements = {
        addCardBtn: null,
        cardsContainer: null,
        emptyState: null,
        modalOverlay: null,
        modalContainer: null,
        modalClose: null,
        btnCancel: null,
        cardForm: null,
        cardNumber: null,
        expiryDate: null,
        cvv: null,
        cardholderName: null,
        cardIcons: null,
        cvvInfo: null,
        cvvTooltip: null
    };

    // ========================================
    // Payment System Logos (SVG)
    // ========================================
    const paymentLogos = {
        visa: `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#1A1F71"/>
            <path d="M19.5 21.5L22 8.5H25L22.5 21.5H19.5ZM32.5 9C31.5 8.5 30 8.5 28.5 9C28 9.5 28 10 28.5 10.5C29.5 11 31.5 11.5 31.5 13.5C31.5 15 30 15.5 28.5 15.5C26.5 15.5 25.5 15 24.5 14.5L24 17.5C25 18 26.5 18.5 28.5 18.5C31.5 18.5 34 17 34 14.5C34 12 31.5 11 29.5 10.5C29 10 29.5 9.5 30 9.5C30.5 9 31.5 9 32.5 9V9ZM37.5 9H40L38.5 21.5H36L37.5 9ZM14.5 9L12 18.5L11.5 16.5L10.5 12C10.5 12 10 10.5 9 10.5L9.5 10C11.5 9.5 13.5 9 14.5 9ZM16.5 21.5H13.5L15.5 9H18.5L16.5 21.5Z" fill="white"/>
        </svg>`,
        mastercard: `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#000"/>
            <circle cx="18" cy="16" r="10" fill="#EB001B"/>
            <circle cx="30" cy="16" r="10" fill="#F79E1B" fill-opacity="0.9"/>
            <path d="M24 9.5C25.5 11 26.5 13.5 26.5 16C26.5 18.5 25.5 21 24 22.5C22.5 21 21.5 18.5 21.5 16C21.5 13.5 22.5 11 24 9.5Z" fill="#FF5F00"/>
        </svg>`,
        mir: `<svg viewBox="0 0 48 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="48" height="32" rx="4" fill="#0077C8"/>
            <path d="M8 12V20H10V12H8ZM12 12V20H14V15.5L16.5 20H18.5L16 16L18.5 12H16.5L14 16.5V12H12ZM20 12V20H22V16.5L24.5 20H26.5L24 16L26.5 12H24.5L22 16.5V12H20ZM28 12V20H30V12H28ZM32 12V18.5H35V20H37V12H35V17H34V12H32ZM38 12V20H42V18.5H40V16.5H41.5V15H40V13.5H42V12H38Z" fill="white"/>
        </svg>`
    };

    // ========================================
    // Initialization
    // ========================================
    function init() {
        cacheElements();
        loadState();
        bindEvents();
        renderCards();
        registerServiceWorker();
    }

    function cacheElements() {
        elements.addCardBtn = document.getElementById('addCardBtn');
        elements.cardsContainer = document.getElementById('cardsContainer');
        elements.emptyState = document.getElementById('emptyState');
        elements.modalOverlay = document.getElementById('modalOverlay');
        elements.modalContainer = document.getElementById('modalContainer');
        elements.modalClose = document.getElementById('modalClose');
        elements.btnCancel = document.getElementById('btnCancel');
        elements.cardForm = document.getElementById('cardForm');
        elements.cardNumber = document.getElementById('cardNumber');
        elements.expiryDate = document.getElementById('expiryDate');
        elements.cvv = document.getElementById('cvv');
        elements.cardholderName = document.getElementById('cardholderName');
        elements.cardIcons = document.getElementById('cardIcons');
        elements.cvvInfo = document.getElementById('cvvInfo');
        elements.cvvTooltip = document.getElementById('cvvTooltip');
    }

    function loadState() {
        try {
            const storedCards = localStorage.getItem(STORAGE_KEY);
            const storedPrimary = localStorage.getItem(PRIMARY_CARD_KEY);
            
            if (storedCards) {
                state.cards = JSON.parse(storedCards);
            }
            
            if (storedPrimary) {
                state.primaryCardId = storedPrimary;
            }
        } catch (e) {
            console.error('Error loading state:', e);
            state.cards = [];
            state.primaryCardId = null;
        }
    }

    function saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards));
            if (state.primaryCardId) {
                localStorage.setItem(PRIMARY_CARD_KEY, state.primaryCardId);
            }
        } catch (e) {
            console.error('Error saving state:', e);
        }
    }

    // ========================================
    // Event Bindings
    // ========================================
    function bindEvents() {
        // Modal controls
        elements.addCardBtn.addEventListener('click', openModal);
        elements.modalClose.addEventListener('click', closeModal);
        elements.btnCancel.addEventListener('click', closeModal);
        elements.modalOverlay.addEventListener('click', handleOverlayClick);
        
        // Form submission
        elements.cardForm.addEventListener('submit', handleFormSubmit);
        
        // Input formatting
        elements.cardNumber.addEventListener('input', handleCardNumberInput);
        elements.expiryDate.addEventListener('input', handleExpiryInput);
        elements.cvv.addEventListener('input', handleCvvInput);
        elements.cardholderName.addEventListener('input', handleNameInput);
        
        // CVV tooltip
        elements.cvvInfo.addEventListener('click', toggleCvvTooltip);
        
        // Keyboard handling
        document.addEventListener('keydown', handleKeyDown);
        
        // Touch handling for modal drag
        initModalDrag();
    }

    // ========================================
    // Modal Management
    // ========================================
    function openModal() {
        state.isModalOpen = true;
        elements.modalOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on card number after animation
        setTimeout(() => {
            elements.cardNumber.focus();
        }, 300);
    }

    function closeModal() {
        state.isModalOpen = false;
        elements.modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        elements.cvvTooltip.classList.remove('visible');
        
        // Reset form after animation
        setTimeout(() => {
            resetForm();
        }, 300);
    }

    function handleOverlayClick(e) {
        if (e.target === elements.modalOverlay) {
            closeModal();
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'Escape' && state.isModalOpen) {
            closeModal();
        }
    }

    // ========================================
    // Modal Drag Handling (iOS Style)
    // ========================================
    function initModalDrag() {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        const threshold = 100;

        elements.modalContainer.addEventListener('touchstart', (e) => {
            if (e.target.closest('.card-form')) return;
            isDragging = true;
            startY = e.touches[0].clientY;
            elements.modalContainer.style.transition = 'none';
        }, { passive: true });

        elements.modalContainer.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            if (deltaY > 0) {
                elements.modalContainer.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        elements.modalContainer.addEventListener('touchend', () => {
            if (!isDragging) return;
            isDragging = false;
            elements.modalContainer.style.transition = '';
            
            const deltaY = currentY - startY;
            if (deltaY > threshold) {
                closeModal();
            } else {
                elements.modalContainer.style.transform = '';
            }
            currentY = 0;
        });
    }

    // ========================================
    // Input Formatting
    // ========================================
    function handleCardNumberInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 16);
        
        // Format with spaces
        const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        e.target.value = formatted;
        
        // Detect payment system
        detectPaymentSystem(value);
        
        // Auto-focus expiry when card number is complete
        if (value.length === 16) {
            setTimeout(() => elements.expiryDate.focus(), 100);
        }
    }

    function detectPaymentSystem(number) {
        let system = null;
        
        if (/^4/.test(number)) {
            system = 'visa';
        } else if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) {
            system = 'mastercard';
        } else if (/^220/.test(number)) {
            system = 'mir';
        }
        
        elements.cardIcons.innerHTML = system ? 
            `<div class="card-icon visible">${paymentLogos[system]}</div>` : '';
    }

    function handleExpiryInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 4);
        
        if (value.length >= 2) {
            const month = parseInt(value.substring(0, 2));
            if (month > 12) {
                value = '12' + value.substring(2);
            }
            value = value.substring(0, 2) + (value.length > 2 ? '/' : '') + value.substring(2);
        }
        
        e.target.value = value;
        
        // Auto-focus CVV when expiry is complete
        if (value.length === 5) {
            setTimeout(() => elements.cvv.focus(), 100);
        }
    }

    function handleCvvInput(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 4);
        e.target.value = value;
        
        // Auto-focus name when CVV is complete
        if (value.length === 3 || value.length === 4) {
            setTimeout(() => elements.cardholderName.focus(), 100);
        }
    }

    function handleNameInput(e) {
        // Convert to uppercase and allow only letters and spaces
        let value = e.target.value.toUpperCase().replace(/[^A-ZА-ЯЁ\s]/g, '');
        e.target.value = value;
    }

    function toggleCvvTooltip() {
        elements.cvvTooltip.classList.toggle('visible');
        setTimeout(() => {
            elements.cvvTooltip.classList.remove('visible');
        }, 3000);
    }

    // ========================================
    // Form Submission
    // ========================================
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        // Create card object
        const cardNumber = elements.cardNumber.value.replace(/\s/g, '');
        const card = {
            id: Date.now().toString(),
            number: cardNumber,
            last4: cardNumber.substring(cardNumber.length - 4),
            expiry: elements.expiryDate.value,
            holder: elements.cardholderName.value.trim() || 'CARDHOLDER',
            paymentSystem: detectPaymentSystemType(cardNumber),
            createdAt: new Date().toISOString()
        };
        
        // Add card to state
        state.cards.unshift(card);
        
        // Set as primary if first card
        if (state.cards.length === 1) {
            state.primaryCardId = card.id;
        }
        
        // Save and render
        saveState();
        renderCards();
        closeModal();
    }

    function validateForm() {
        let isValid = true;
        
        // Validate card number (16 digits)
        const cardNumber = elements.cardNumber.value.replace(/\s/g, '');
        if (cardNumber.length !== 16) {
            elements.cardNumber.classList.add('error');
            isValid = false;
        } else {
            elements.cardNumber.classList.remove('error');
        }
        
        // Validate expiry (MM/YY)
        const expiry = elements.expiryDate.value;
        if (expiry.length !== 5) {
            elements.expiryDate.classList.add('error');
            isValid = false;
        } else {
            elements.expiryDate.classList.remove('error');
        }
        
        // Validate CVV (3-4 digits)
        const cvv = elements.cvv.value;
        if (cvv.length < 3) {
            elements.cvv.classList.add('error');
            isValid = false;
        } else {
            elements.cvv.classList.remove('error');
        }
        
        return isValid;
    }

    function detectPaymentSystemType(number) {
        if (/^4/.test(number)) return 'visa';
        if (/^5[1-5]/.test(number) || /^2[2-7]/.test(number)) return 'mastercard';
        if (/^220/.test(number)) return 'mir';
        return 'unknown';
    }

    function resetForm() {
        elements.cardForm.reset();
        elements.cardNumber.classList.remove('error');
        elements.expiryDate.classList.remove('error');
        elements.cvv.classList.remove('error');
        elements.cardIcons.innerHTML = '';
    }

    // ========================================
    // Card Rendering
    // ========================================
    function renderCards() {
        if (state.cards.length === 0) {
            elements.cardsContainer.innerHTML = '';
            elements.emptyState.classList.add('visible');
            return;
        }
        
        elements.emptyState.classList.remove('visible');
        
        elements.cardsContainer.innerHTML = state.cards.map(card => {
            const isPrimary = card.id === state.primaryCardId;
            const logo = getPaymentLogo(card.paymentSystem);
            
            return `
                <div class="card-token ${isPrimary ? 'primary' : ''}" data-id="${card.id}">
                    <div class="card-logo">
                        ${logo}
                    </div>
                    <div class="card-info">
                        <div class="card-number">•••• ${card.last4}</div>
                        <div class="card-holder">${escapeHtml(card.holder)}</div>
                    </div>
                    <button class="card-star ${isPrimary ? 'active' : ''}" 
                            onclick="togglePrimaryCard('${card.id}')" 
                            aria-label="${isPrimary ? 'Основная карта' : 'Сделать основной'}">
                        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path class="star-filled" d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="#ffd700" stroke-width="1.5" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');
    }

    function getPaymentLogo(system) {
        switch (system) {
            case 'visa':
                return paymentLogos.visa;
            case 'mastercard':
                return paymentLogos.mastercard;
            case 'mir':
                return paymentLogos.mir;
            default:
                return `<div style="width:36px;height:24px;background:#e0e0e0;border-radius:4px;"></div>`;
        }
    }

    // ========================================
    // Primary Card Toggle
    // ========================================
    window.togglePrimaryCard = function(cardId) {
        if (state.primaryCardId === cardId) {
            // Can't unset primary card if it's the only one
            if (state.cards.length > 1) {
                state.primaryCardId = null;
            }
        } else {
            state.primaryCardId = cardId;
        }
        
        saveState();
        renderCards();
    };

    // ========================================
    // Utility Functions
    // ========================================
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // Service Worker Registration
    // ========================================
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registered:', registration.scope);
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed:', error);
                });
        }
    }

    // ========================================
    // Start Application
    // ========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
