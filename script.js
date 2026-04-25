document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initMobileFullscreen();
    initSlider();
    initCardVideo();
    initScrubSlider();
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

/* === Card Video — open fullscreen overlay === */
function initCardVideo() {
    const card = document.getElementById('card-video');
    const overlay = document.getElementById('scrub-overlay');
    const video = document.getElementById('scrub-video');
    const canvas = document.getElementById('scrub-canvas');
    const closeBtn = document.getElementById('scrub-close');
    if (!card || !overlay || !video || !canvas) return;

    const ctx = canvas.getContext('2d');

    function drawFrame() {
        canvas.width = video.videoWidth || 1080;
        canvas.height = video.videoHeight || 1920;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    card.addEventListener('click', () => {
        overlay.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        // Prime video for mobile — play then pause, then draw first frame
        video.currentTime = 0;
        const p = video.play();
        if (p) {
            p.then(() => {
                video.pause();
                video.currentTime = 0;
                // Wait for seek to complete, then draw
                video.addEventListener('seeked', function onFirstSeek() {
                    video.removeEventListener('seeked', onFirstSeek);
                    drawFrame();
                });
            }).catch(() => {
                video.load();
                video.addEventListener('loadeddata', function onLoad() {
                    video.removeEventListener('loadeddata', onLoad);
                    video.currentTime = 0;
                    drawFrame();
                });
            });
        }
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('is-open');
        document.body.style.overflow = '';
        video.pause();
        video.currentTime = 0;
        // Reset scrub slider
        const thumb = document.getElementById('scrub-thumb');
        const progress = document.getElementById('scrub-progress');
        const text = overlay.querySelector('.scrub-slider__text');
        if (thumb) { thumb.style.left = '5px'; thumb.style.transition = 'left 0.3s'; }
        if (progress) { progress.style.width = '0%'; }
        if (text) { text.style.opacity = '0.45'; }
    });

    // Store drawFrame globally so scrub slider can use it
    window._scrubDrawFrame = drawFrame;
}

/* === Scrub Slider — drag to control video time via Canvas === */
function initScrubSlider() {
    const overlay = document.getElementById('scrub-overlay');
    const slider = document.getElementById('scrub-slider');
    const thumb = document.getElementById('scrub-thumb');
    const video = document.getElementById('scrub-video');
    const progressBar = document.getElementById('scrub-progress');
    if (!slider || !thumb || !video || !overlay) return;

    thumb.style.touchAction = 'none';
    slider.style.touchAction = 'none';

    let scrubDragging = false;
    let scrubCurrentX = 0;
    let scrubStartX = 0;
    const minLeft = 5;
    let pendingSeek = false;

    function getMaxLeft() {
        return slider.offsetWidth - thumb.offsetWidth - 7;
    }

    // Listen for seeked event to draw frame on canvas
    video.addEventListener('seeked', () => {
        pendingSeek = false;
        if (window._scrubDrawFrame) window._scrubDrawFrame();
    });

    function scrubStart(clientX) {
        scrubDragging = true;
        scrubStartX = clientX - scrubCurrentX;
        thumb.style.transition = 'none';
        if (progressBar) progressBar.style.transition = 'none';
    }

    function scrubMove(clientX) {
        if (!scrubDragging) return;
        let x = clientX - scrubStartX;
        const maxLeft = getMaxLeft();
        if (maxLeft <= 0) return;
        x = Math.max(0, Math.min(x, maxLeft));
        scrubCurrentX = x;
        thumb.style.left = (minLeft + x) + 'px';

        const progress = x / maxLeft;

        // Seek video — only if not already seeking
        if (!pendingSeek && video.readyState >= 1 && video.duration && isFinite(video.duration)) {
            pendingSeek = true;
            video.currentTime = Math.min(progress * video.duration, video.duration - 0.05);
        }

        if (progressBar) {
            progressBar.style.width = (progress * 100) + '%';
        }

        const text = slider.querySelector('.scrub-slider__text');
        if (text) text.style.opacity = Math.max(0, 0.45 - progress * 0.7);
    }

    function scrubEnd() {
        if (!scrubDragging) return;
        scrubDragging = false;

        // Always snap back to start
        thumb.style.transition = 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        thumb.style.left = minLeft + 'px';
        scrubCurrentX = 0;
        if (progressBar) {
            progressBar.style.transition = 'width 0.4s';
            progressBar.style.width = '0%';
        }
        if (video.readyState >= 1) video.currentTime = 0;
        const text = slider.querySelector('.scrub-slider__text');
        if (text) {
            text.style.transition = 'opacity 0.4s';
            text.style.opacity = '0.45';
        }
    }

    // Touch events on SLIDER + OVERLAY
    slider.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        scrubStart(e.touches[0].clientX);
    }, { passive: false });

    overlay.addEventListener('touchmove', (e) => {
        if (scrubDragging) {
            e.preventDefault();
            e.stopPropagation();
            scrubMove(e.touches[0].clientX);
        }
    }, { passive: false });

    overlay.addEventListener('touchend', (e) => {
        if (scrubDragging) {
            e.stopPropagation();
            scrubEnd();
        }
    });

    // Mouse events
    slider.addEventListener('mousedown', (e) => {
        e.preventDefault();
        scrubStart(e.clientX);
    });

    document.addEventListener('mousemove', (e) => {
        if (scrubDragging) scrubMove(e.clientX);
    });

    document.addEventListener('mouseup', () => {
        if (scrubDragging) scrubEnd();
    });
}
