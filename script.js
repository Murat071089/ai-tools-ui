document.addEventListener('DOMContentLoaded', () => {
    initHistoryRouting();
    initSplash();
    initMobileFullscreen();
    initSlider();
    initCards();
    initCheckoutFlow();
    initSectionObserver();
});

let currentStep = 0;

function initHistoryRouting() {
    window.history.replaceState({ step: 0 }, '', '');

    window.addEventListener('popstate', (e) => {
        const step = e.state ? (e.state.step || 0) : 0;
        currentStep = step;
        
        if (step === 0) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (step === 1) {
            const s2 = document.getElementById('section-2');
            if (s2) s2.scrollIntoView({ behavior: 'smooth' });
        } else if (step === 2) {
            const s3 = document.getElementById('section-3');
            if (s3) s3.scrollIntoView({ behavior: 'smooth' });
        }
    });
}

let hasLoadedCinematicOnce = false;

function triggerCinematicLoading() {
    const loader = document.getElementById('s2-loader');
    const s2Grid = document.getElementById('s2-grid');
    
    if (!loader || !s2Grid) return;
    if (loader.dataset.loading === "true") return; // Already loading

    loader.dataset.loading = "true";
    s2Grid.classList.remove('content-ready');

    if (!hasLoadedCinematicOnce) {
        // ── ПЕРВЫЙ ВИЗИТ: полный кинематографический лоадер 4.5s ──
        hasLoadedCinematicOnce = true;
        loader.classList.remove('is-hidden');
        setTimeout(() => {
            loader.classList.add('is-hidden');
            loader.dataset.loading = "false";
            s2Grid.classList.add('content-ready');
        }, 4500);
    } else {
        // ── ПОВТОРНЫЙ ВИЗИТ: фон сразу, контент плавно появляется через 1.5s ──
        loader.classList.add('is-hidden'); // скрываем лоадер сразу
        setTimeout(() => {
            loader.dataset.loading = "false";
            s2Grid.classList.add('content-ready');
        }, 1000);
    }
}

let lastScrollY = 0;

function initSectionObserver() {
    const section2 = document.getElementById('section-2');
    if (!section2) return;

    // Track scroll direction
    window.addEventListener('scroll', () => {
        lastScrollY = window.scrollY;
    }, { passive: true });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const s2Grid = document.getElementById('s2-grid');
            
            if (entry.isIntersecting) {
                // Detect if user came from above or below
                const rect = entry.boundingClientRect;
                const fromBelow = rect.top > 0; // section is below viewport → user scrolled down
                
                if (s2Grid) {
                    s2Grid.classList.toggle('from-below', fromBelow);
                }
                
                // Section came into view — trigger loading/reveal
                triggerCinematicLoading();
            } else {
                // Section left the viewport — reset so it re-animates on return
                const loader = document.getElementById('s2-loader');
                const s2Grid = document.getElementById('s2-grid');
                
                // Only reset if we're not currently loading
                if (loader && loader.dataset.loading !== "true") {
                    if (s2Grid) s2Grid.classList.remove('content-ready');
                }
            }
        });
    }, { threshold: 0.25 });

    observer.observe(section2);
}

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
                    if (currentStep !== 1) {
                        window.history.pushState({ step: 1 }, '', '');
                        currentStep = 1;
                    }
                    section2.scrollIntoView({ behavior: 'smooth' });
                    triggerCinematicLoading();

                    // Quietly reset the slider so it's ready again if the user scrolls up
                    setTimeout(() => {
                        thumb.style.transition = 'none'; // reset without weird snap if already invisible, or smooth:
                        thumb.style.transition = 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
                        thumb.style.left = minLeft + 'px';
                        currentX = 0;
                        slider.classList.remove('is-complete');
                        const text = slider.querySelector('.slider-btn__text');
                        if (text) {
                            text.style.transition = 'opacity 0.5s';
                            text.style.opacity = '0.5';
                        }
                    }, 800);
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

/* === Card tap-to-play + info highlight === */
function initCards() {
    const cards = document.querySelectorAll('.s2-card');
    const infos = document.querySelectorAll('.s2-info');
    if (!cards.length) return;

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const row = card.getAttribute('data-row');
            const video = card.querySelector('.s2-card__video');

            // Highlight info
            cards.forEach(c => c.classList.remove('is-active'));
            infos.forEach(i => i.classList.remove('is-active'));
            card.classList.add('is-active');
            const info = document.getElementById('info-' + row);
            if (info) info.classList.add('is-active');

            // Reset all OTHER videos
            cards.forEach(c => {
                if (c !== card) {
                    const otherVideo = c.querySelector('.s2-card__video');
                    if (otherVideo) {
                        otherVideo.pause();
                        otherVideo.currentTime = 0;
                    }
                    c.classList.remove('is-playing');
                }
            });

            // Toggle play/pause for clicked video
            if (video) {
                if (video.paused) {
                    video.play().catch(() => {});
                    card.classList.add('is-playing');
                } else {
                    video.pause();
                    video.currentTime = 0; // Return to first frame
                    card.classList.remove('is-playing');
                }
            }
        });
    });
}

function initCheckoutFlow() {
    const accessBtns = document.querySelectorAll('.s2-access-btn');
    accessBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = btn.getAttribute('data-row');
            const card = document.getElementById('card-' + row);
            
            // Transform button to syncing state
            btn.innerHTML = 'Синхронизация...';
            btn.classList.add('is-syncing');

            // Force play the robot video
            if (card) {
                // Ensure other active states and infos highlight properly
                card.click();
                
                const video = card.querySelector('.s2-card__video');
                if (video) {
                    video.currentTime = 0;
                    video.play().catch(() => {});
                    card.classList.add('is-playing');
                }
            }

            // Let the video sequence dramatically complete (~5.5s)
            setTimeout(() => {
                document.body.classList.add('go-to-checkout');
                
                // After fade to black completes
                setTimeout(() => {
                    btn.innerHTML = 'Получить доступ';
                    btn.classList.remove('is-syncing');
                    document.body.classList.remove('go-to-checkout');
                    
                    const section3 = document.getElementById('section-3');
                    if (section3) {
                        if (currentStep !== 2) {
                            window.history.pushState({ step: 2 }, '', '');
                            currentStep = 2;
                        }
                        section3.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 800);
            }, 5500);
        });
    });
}


