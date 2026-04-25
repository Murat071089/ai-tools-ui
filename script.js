document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initMobileFullscreen();
    initSlider();
    initScreens();
});

/* === Splash → Fullscreen on tap === */
function initSplash() {
    const splash = document.getElementById('splash');
    if (!splash) return;

    splash.addEventListener('click', () => {
        const el = document.documentElement;
        const requestFS = el.requestFullscreen
            || el.webkitRequestFullscreen
            || el.mozRequestFullScreen
            || el.msRequestFullscreen;
        if (requestFS) requestFS.call(el).catch(() => {});

        // Start video from beginning
        const video = document.getElementById('heroVideo');
        if (video) {
            video.currentTime = 0;
            video.play().then(() => {
                video.classList.add('is-playing');
            }).catch(() => {
                video.classList.add('is-playing');
            });
        }

        splash.classList.add('is-hidden');
        setTimeout(() => {
            const hero = document.getElementById('hero');
            if (hero) hero.style.height = window.innerHeight + 'px';
        }, 400);
        setTimeout(() => splash.remove(), 700);
    });
}

/* === Mobile fullscreen — hide browser toolbar === */
function initMobileFullscreen() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    function setRealHeight() {
        hero.style.height = window.innerHeight + 'px';
    }
    setRealHeight();

    setTimeout(() => {
        window.scrollTo(0, 1);
        setTimeout(() => {
            window.scrollTo(0, 0);
            setRealHeight();
        }, 100);
    }, 300);

    window.addEventListener('resize', setRealHeight);
    window.addEventListener('orientationchange', () => setTimeout(setRealHeight, 200));
}


/* === Slide to unlock === */
function initSlider() {
    const slider = document.getElementById('slider-btn');
    const thumb = document.getElementById('slider-thumb');
    if (!slider || !thumb) return;

    let dragging = false;
    let startX = 0;
    let currentX = 0;
    const minLeft = 6;

    function getMaxLeft() {
        return slider.offsetWidth - thumb.offsetWidth - 8;
    }

    function startDrag(clientX) {
        dragging = true;
        startX = clientX - currentX;
        thumb.style.transition = 'none';
        slider.classList.add('is-dragging');
    }

    function moveDrag(clientX) {
        if (!dragging) return;
        let x = clientX - startX;
        const maxLeft = getMaxLeft();
        x = Math.max(0, Math.min(x, maxLeft));
        currentX = x;
        thumb.style.left = (minLeft + x) + 'px';

        // Fade text as thumb moves
        const progress = x / maxLeft;
        const text = slider.querySelector('.slider-btn__text');
        if (text) text.style.opacity = Math.max(0, 0.5 - progress * 0.8);
    }

    function endDrag() {
        if (!dragging) return;
        dragging = false;
        slider.classList.remove('is-dragging');

        const maxLeft = getMaxLeft();
        const progress = currentX / maxLeft;

        if (progress > 0.7) {
            // Complete! Slide to end
            thumb.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            thumb.style.left = (minLeft + maxLeft) + 'px';
            currentX = maxLeft;
            slider.classList.add('is-complete');

            // Navigate to section 2
            setTimeout(() => {
                const section2 = document.getElementById('section-2');
                if (section2) {
                    section2.scrollIntoView({ behavior: 'smooth' });
                }
            }, 400);
        } else {
            // Snap back
            thumb.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            thumb.style.left = minLeft + 'px';
            currentX = 0;
            const text = slider.querySelector('.slider-btn__text');
            if (text) {
                text.style.transition = 'opacity 0.4s';
                text.style.opacity = '0.5';
            }
        }
    }

    // Touch events
    thumb.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrag(e.touches[0].clientX);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (dragging) {
            e.preventDefault();
            moveDrag(e.touches[0].clientX);
        }
    }, { passive: false });

    document.addEventListener('touchend', endDrag);

    // Mouse events (for desktop testing)
    thumb.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startDrag(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
        if (dragging) moveDrag(e.clientX);
    });

    document.addEventListener('mouseup', endDrag);
}

/* ═══════════════════════════════════════
   SCREENS — Navigation & Interactions
   ═══════════════════════════════════════ */
function initScreens() {
    const screenProduct  = document.getElementById('screen-product');
    const screenCheckout = document.getElementById('screen-checkout');
    const card1          = document.getElementById('card-video');
    if (!screenProduct || !screenCheckout) return;

    // --- Open Screen 2 from Card 1 ---
    if (card1) {
        card1.addEventListener('click', () => openScreen(screenProduct));
    }

    // --- Open Screen 3 from Product CTA ---
    const productCta = document.getElementById('product-cta');
    const productCard = document.getElementById('product-card');
    if (productCta) productCta.addEventListener('click', () => openScreen(screenCheckout));
    if (productCard) productCard.addEventListener('click', () => openScreen(screenCheckout));

    // --- Back buttons ---
    const productBack  = document.getElementById('product-back');
    const checkoutBack = document.getElementById('checkout-back');
    if (productBack)  productBack.addEventListener('click', () => closeScreen(screenProduct));
    if (checkoutBack) checkoutBack.addEventListener('click', () => closeScreen(screenCheckout));

    // --- Quantity +/- ---
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus  = document.getElementById('qty-plus');
    const qtyValue = document.getElementById('qty-value');
    const sumSub   = document.getElementById('sum-sub');
    const sumTotal = document.getElementById('sum-total');
    const ctaPrice = document.getElementById('cta-price');
    const PRICE = 990;
    let qty = 1;

    function updatePrices() {
        const total = qty * PRICE;
        if (qtyValue) qtyValue.textContent = qty;
        if (sumSub)   sumSub.textContent   = total + ' ₽';
        if (sumTotal) sumTotal.textContent  = total + ' ₽';
        if (ctaPrice) ctaPrice.textContent  = total + ' ₽';
    }

    if (qtyPlus) qtyPlus.addEventListener('click', () => {
        qty = Math.min(qty + 1, 10);
        updatePrices();
    });

    if (qtyMinus) qtyMinus.addEventListener('click', () => {
        qty = Math.max(qty - 1, 1);
        updatePrices();
    });

    // --- Checkout tabs ---
    const tabs = document.querySelectorAll('.checkout-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('checkout-tab--active'));
            tab.classList.add('checkout-tab--active');
        });
    });
}

function openScreen(screen) {
    screen.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeScreen(screen) {
    screen.classList.remove('is-open');
    document.body.style.overflow = '';
}
