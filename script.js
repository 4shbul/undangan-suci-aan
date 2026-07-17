'use strict';

/* =========================================================
   BUGIS ROYAL WEDDING — PREMIUM INVITATION SCRIPT
   Pure vanilla JavaScript. No frameworks / libraries.
   ========================================================= */

(function () {

  /* ---------------------------------------------------
     0. UTILITIES
  --------------------------------------------------- */
  function debounce(fn, wait) {
    let timeout;
    return function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function qsa(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  /* ---------------------------------------------------
     GALLERY PLACEHOLDER (SVG data-URI, no external images)
  --------------------------------------------------- */
  const PLACEHOLDER_PALETTES = [
    ['#2d1a0a', '#5c3a1e', '#C7A15A'],
    ['#7C2434', '#a13a4e', '#E3CB94'],
    ['#1D5D4F', '#2d7a68', '#C7A15A'],
    ['#3a2818', '#6a4a2a', '#E3CB94'],
    ['#5a1a26', '#7C2434', '#C7A15A'],
    ['#123f35', '#1D5D4F', '#E3CB94'],
    ['#2B2119', '#4a3520', '#C7A15A'],
    ['#4a1520', '#7C2434', '#E3CB94'],
    ['#1a2a1a', '#2d5a2d', '#C7A15A'],
    ['#5c3a1e', '#8a6a3a', '#E3CB94'],
    ['#2d1a0a', '#7C2434', '#C7A15A'],
    ['#1a1008', '#1D5D4F', '#E3CB94']
  ];

  window.WeddingGalleryPlaceholder = function (index, ratio) {
    const i = ((Number(index) || 1) - 1) % PLACEHOLDER_PALETTES.length;
    const [c1, c2, gold] = PLACEHOLDER_PALETTES[i];
    const w = 600;
    const h = ratio === 'tall' ? 840 : 600;
    const label = String(index).padStart(2, '0');
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
      `<defs><linearGradient id="g${i}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>` +
      `</linearGradient>` +
      `<pattern id="p${i}" width="40" height="40" patternUnits="userSpaceOnUse">` +
      `<path d="M0 20 L20 0 L40 20 L20 40 Z" fill="none" stroke="${gold}" stroke-width="0.6" opacity="0.25"/>` +
      `</pattern></defs>` +
      `<rect width="100%" height="100%" fill="url(#g${i})"/>` +
      `<rect width="100%" height="100%" fill="url(#p${i})"/>` +
      `<circle cx="${w / 2}" cy="${h / 2 - 20}" r="36" fill="none" stroke="${gold}" stroke-width="1.5" opacity="0.55"/>` +
      `<text x="${w / 2}" y="${h / 2 - 12}" text-anchor="middle" font-family="Cinzel,serif" font-size="22" fill="${gold}" opacity="0.9">S &amp; A</text>` +
      `<text x="${w / 2}" y="${h / 2 + 40}" text-anchor="middle" font-family="Cinzel,serif" font-size="14" fill="${gold}" opacity="0.7">${label}</text>` +
      `</svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  };

  /* ---------------------------------------------------
     1. GUEST NAME FROM URL (?to=Nama+Tamu)
  --------------------------------------------------- */
  function initGuestName() {
    const params = new URLSearchParams(window.location.search);
    const guest = params.get('to') || params.get('nama');
    const el = qs('#guest-name');
    if (el && guest) {
      el.textContent = decodeURIComponent(guest.replace(/\+/g, ' '));
    }
  }

  /* ---------------------------------------------------
     2. OPENING SCREEN + MUSIC START
  --------------------------------------------------- */
  function initOpeningScreen() {
    const openingScreen = qs('#opening-screen');
    const openBtn = qs('#open-invitation-btn');
    const floatingNav = qs('#floating-nav');
    const musicPlayer = qs('#music-player');

    if (!openingScreen || !openBtn) return;

    document.body.classList.add('no-scroll');

    // Animate opening content immediately
    qsa('#opening-screen [data-animate]').forEach((el, i) => {
      setTimeout(() => el.classList.add('is-visible'), 200 + i * 120);
    });

    openBtn.addEventListener('click', function () {
      openingScreen.classList.add('is-closed');
      document.body.classList.remove('no-scroll');

      if (floatingNav) floatingNav.hidden = false;
      if (musicPlayer) musicPlayer.hidden = false;

      if (window.WeddingMusic) {
        window.WeddingMusic.play();
      }

      setTimeout(() => {
        openingScreen.setAttribute('aria-hidden', 'true');
        openingScreen.style.display = 'none';
      }, 1000);

      requestAnimationFrame(revealVisibleOnLoad);
    });
  }

  /* ---------------------------------------------------
     3. SCROLL REVEAL (Intersection Observer)
  --------------------------------------------------- */
  let revealObserver;

  function initScrollReveal() {
    const targets = qsa('[data-animate]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-visible'));
      return;
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delayAttr = el.getAttribute('data-delay');
            const delay = delayAttr ? parseInt(delayAttr, 10) : 0;
            setTimeout(() => el.classList.add('is-visible'), delay);
            revealObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );

    targets.forEach((t) => {
      // Skip opening screen items — they animate on their own
      if (t.closest('#opening-screen')) return;
      revealObserver.observe(t);
    });
  }

  function revealVisibleOnLoad() {
    qsa('#hero [data-animate]').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------
     4. FLOATING NAV — ACTIVE STATE + SMOOTH SCROLL
  --------------------------------------------------- */
  function initFloatingNav() {
    const nav = qs('#floating-nav');
    if (!nav) return;

    const links = qsa('.floating-nav__item', nav);
    const sections = links
      .map((l) => document.getElementById(l.dataset.navTarget))
      .filter(Boolean);

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(link.dataset.navTarget);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    const onScroll = debounce(() => {
      let currentId = sections[0] ? sections[0].id : null;
      const scrollPos = window.scrollY + window.innerHeight * 0.35;

      sections.forEach((sec) => {
        if (sec.offsetTop <= scrollPos) currentId = sec.id;
      });

      links.forEach((l) =>
        l.classList.toggle('is-active', l.dataset.navTarget === currentId)
      );
    }, 80);

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------
     5. BACK TO TOP + PARALLAX
  --------------------------------------------------- */
  function initScrollEffects() {
    const backToTop = qs('#back-to-top');
    const parallaxEls = qsa('[data-parallax]');

    const onScroll = debounce(() => {
      const y = window.scrollY;

      if (backToTop) {
        backToTop.classList.toggle('is-visible', y > 600);
      }

      parallaxEls.forEach((el) => {
        const speed = 0.18;
        el.style.transform = `translate3d(0, ${y * speed * -0.12}px, 0) scale(1.06)`;
      });
    }, 12);

    window.addEventListener('scroll', onScroll, { passive: true });

    if (backToTop) {
      backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  /* ---------------------------------------------------
     6. COUNTDOWN TIMER — flip animation
  --------------------------------------------------- */
  function initCountdown() {
    const el = qs('#countdown');
    if (!el) return;

    // Wedding: Saturday, 08 August 2026, 08:00 WITA (UTC+8)
    const targetDate = new Date('2026-08-08T08:00:00+08:00').getTime();
    const daysEl = qs('#cd-days');
    const hoursEl = qs('#cd-hours');
    const minutesEl = qs('#cd-minutes');
    const secondsEl = qs('#cd-seconds');

    function updateField(node, value) {
      if (!node) return;
      const formatted = String(value).padStart(2, '0');
      if (node.textContent !== formatted) {
        node.textContent = formatted;
        node.classList.remove('is-flipping');
        void node.offsetWidth;
        node.classList.add('is-flipping');
      }
    }

    function tick() {
      const now = Date.now();
      const diff = Math.max(0, targetDate - now);

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      updateField(daysEl, d);
      updateField(hoursEl, h);
      updateField(minutesEl, m);
      updateField(secondsEl, s);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------
     7. GALLERY LIGHTBOX
  --------------------------------------------------- */
  function initLightbox() {
    const items = qsa('.masonry__item');
    const lightbox = qs('#lightbox');
    const lightboxImg = qs('#lightbox-img');
    const lightboxCounter = qs('#lightbox-counter');
    const closeBtn = qs('#lightbox-close');
    const prevBtn = qs('#lightbox-prev');
    const nextBtn = qs('#lightbox-next');

    if (!items.length || !lightbox || !lightboxImg) return;

    let currentIndex = 0;
    let lastFocused = null;

    function getImg(index) {
      return items[index].querySelector('img');
    }

    function openLightbox(index) {
      currentIndex = index;
      const img = getImg(index);
      if (!img) return;

      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      if (lightboxCounter) {
        lightboxCounter.textContent = `${index + 1} / ${items.length}`;
      }

      lastFocused = document.activeElement;
      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
      closeBtn.focus();
    }

    function closeLightbox() {
      lightbox.hidden = true;
      document.body.classList.remove('no-scroll');
      lightboxImg.src = '';
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    function showRelative(offset) {
      currentIndex = (currentIndex + offset + items.length) % items.length;
      const img = getImg(currentIndex);
      if (!img) return;
      lightboxImg.src = img.currentSrc || img.src;
      lightboxImg.alt = img.alt || '';
      if (lightboxCounter) {
        lightboxCounter.textContent = `${currentIndex + 1} / ${items.length}`;
      }
    }

    items.forEach((item, i) => {
      item.addEventListener('click', () => openLightbox(i));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(i);
        }
      });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => showRelative(-1));
    nextBtn.addEventListener('click', () => showRelative(1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showRelative(-1);
      if (e.key === 'ArrowRight') showRelative(1);
    });
  }

  /* ---------------------------------------------------
     8. RSVP FORM + UCAPAN LIST
  --------------------------------------------------- */
  function initRsvpForm() {
    const form = qs('#rsvp-form');
    if (!form) return;

    const status = qs('#form-status');
    const ucapanList = qs('#ucapan-items');
    const ucapanCount = qs('#ucapan-count');
    const charCount = qs('#char-count');
    const ucapanField = qs('#rsvp-ucapan');

    if (ucapanField && charCount) {
      ucapanField.addEventListener('input', () => {
        charCount.textContent = String(ucapanField.value.length);
      });
    }

    function setError(fieldId, message) {
      const errEl = qs('#error-' + fieldId);
      if (errEl) errEl.textContent = message || '';
    }

    function validate(data) {
      let valid = true;
      setError('nama', '');
      setError('jumlah', '');
      setError('kehadiran', '');
      setError('ucapan', '');

      if (!data.nama.trim()) {
        setError('nama', 'Nama wajib diisi.');
        valid = false;
      }
      if (!data.jumlah) {
        setError('jumlah', 'Pilih jumlah tamu.');
        valid = false;
      }
      if (!data.kehadiran) {
        setError('kehadiran', 'Pilih status kehadiran.');
        valid = false;
      }
      if (!data.ucapan.trim()) {
        setError('ucapan', 'Tuliskan ucapan dan doa.');
        valid = false;
      }

      return valid;
    }

    function statusLabel(value) {
      if (value === 'hadir') return { text: 'Hadir', icon: 'fa-circle-check' };
      if (value === 'tidak-hadir') return { text: 'Tidak Hadir', icon: 'fa-circle-xmark' };
      return { text: 'Masih Ragu', icon: 'fa-circle-question' };
    }

    function addUcapanToList(data) {
      if (!ucapanList) return;

      const li = document.createElement('li');
      li.className = 'ucapan-item glass is-new';
      const st = statusLabel(data.kehadiran);

      const head = document.createElement('div');
      head.className = 'ucapan-item__head';

      const avatar = document.createElement('span');
      avatar.className = 'ucapan-item__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.innerHTML = '<i class="fa-solid fa-user"></i>';

      const meta = document.createElement('div');
      const nameEl = document.createElement('p');
      nameEl.className = 'ucapan-item__name';
      nameEl.textContent = data.nama;

      const statusEl = document.createElement('p');
      statusEl.className = 'ucapan-item__status';
      statusEl.innerHTML = `<i class="fa-solid ${st.icon}" aria-hidden="true"></i> ${st.text}`;

      meta.appendChild(nameEl);
      meta.appendChild(statusEl);
      head.appendChild(avatar);
      head.appendChild(meta);

      const textEl = document.createElement('p');
      textEl.className = 'ucapan-item__text';
      textEl.textContent = data.ucapan;

      li.appendChild(head);
      li.appendChild(textEl);
      ucapanList.prepend(li);

      if (ucapanCount) {
        const total = ucapanList.children.length;
        ucapanCount.textContent = total + ' ucapan telah diberikan';
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const formData = new FormData(form);
      const data = {
        nama: (formData.get('nama') || '').toString(),
        jumlah: (formData.get('jumlah') || '').toString(),
        kehadiran: (formData.get('kehadiran') || '').toString(),
        ucapan: (formData.get('ucapan') || '').toString()
      };

      if (!validate(data)) {
        if (status) {
          status.textContent = 'Mohon lengkapi data sebelum mengirim.';
          status.classList.remove('is-success');
        }
        return;
      }

      addUcapanToList(data);
      form.reset();
      if (charCount) charCount.textContent = '0';

      if (status) {
        status.textContent = 'Terima kasih! Ucapan dan konfirmasi Anda telah terkirim.';
        status.classList.add('is-success');
      }

      setTimeout(() => {
        const ucapanSection = qs('#ucapan');
        if (ucapanSection) {
          ucapanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 700);
    });
  }

  /* ---------------------------------------------------
     9. COPY TO CLIPBOARD
  --------------------------------------------------- */
  function initCopyButtons() {
    const buttons = qsa('.copy-btn');

    buttons.forEach((btn) => {
      btn.addEventListener('click', async () => {
        const targetId = btn.dataset.copyTarget;
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        const text = targetEl.textContent.replace(/\s+/g, ' ').trim();
        const original = btn.innerHTML;

        try {
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
          } else {
            const temp = document.createElement('textarea');
            temp.value = text;
            temp.setAttribute('readonly', '');
            temp.style.position = 'fixed';
            temp.style.opacity = '0';
            document.body.appendChild(temp);
            temp.select();
            document.execCommand('copy');
            document.body.removeChild(temp);
          }

          btn.classList.add('is-copied');
          btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Tersalin!';

          setTimeout(() => {
            btn.innerHTML = original;
            btn.classList.remove('is-copied');
          }, 2000);
        } catch (err) {
          btn.innerHTML = '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Gagal';
          setTimeout(() => {
            btn.innerHTML = original;
          }, 2000);
        }
      });
    });
  }

  /* ---------------------------------------------------
     10. BUTTON RIPPLE
  --------------------------------------------------- */
  function initRipple() {
    qsa('.btn--ripple').forEach((btn) => {
      btn.addEventListener('click', function (e) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.className = 'ripple';
        ripple.style.width = size + 'px';
        ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';
        btn.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ---------------------------------------------------
     11. YOUTUBE IFRAME API — FLOATING MUSIC
  --------------------------------------------------- */
  const WeddingMusic = (function () {
    let player = null;
    let isReady = false;
    let isLooping = true;
    let pendingPlay = false;

    // Soft instrumental placeholder — ganti VIDEO_ID dengan lagu pilihan pasangan
    const VIDEO_ID = 'jfKfPfyJRdk';

    function createPlayer() {
      if (!window.YT || !window.YT.Player) return;
      if (player) return;

      const host = document.getElementById('youtube-player');
      if (!host) return;

      player = new YT.Player('youtube-player', {
        height: '1',
        width: '1',
        videoId: VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          loop: 1,
          playlist: VIDEO_ID
        },
        events: {
          onReady: function (e) {
            isReady = true;
            e.target.setVolume(60);
            if (pendingPlay) {
              e.target.playVideo();
              pendingPlay = false;
            }
          },
          onStateChange: function (e) {
            if (e.data === YT.PlayerState.ENDED && isLooping) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: function () {
            // Silent fail — music is non-critical
          }
        }
      });
    }

    function play() {
      if (isReady && player && player.playVideo) {
        player.playVideo();
      } else {
        pendingPlay = true;
      }
    }

    function pause() {
      if (isReady && player && player.pauseVideo) {
        player.pauseVideo();
      }
      pendingPlay = false;
    }

    function setVolume(v) {
      if (isReady && player && player.setVolume) {
        player.setVolume(Math.max(0, Math.min(100, Number(v) || 0)));
      }
    }

    function setLoop(state) {
      isLooping = !!state;
    }

    // YouTube API global callback
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof previousReady === 'function') previousReady();
      createPlayer();
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    }

    return { play, pause, setVolume, setLoop, createPlayer };
  })();

  window.WeddingMusic = WeddingMusic;

  function initMusicPlayerUI() {
    const toggleBtn = qs('#music-toggle');
    const panel = qs('#music-panel');
    const playPauseBtn = qs('#music-playpause');
    const volumeSlider = qs('#music-volume');
    const loopBtn = qs('#music-loop');

    if (!toggleBtn) return;

    let playing = true;
    let panelOpen = true;

    toggleBtn.addEventListener('click', () => {
      panelOpen = !panelOpen;
      if (panel) panel.classList.toggle('is-collapsed', !panelOpen);
      toggleBtn.setAttribute('aria-expanded', String(panelOpen));
    });

    if (playPauseBtn) {
      playPauseBtn.addEventListener('click', () => {
        playing = !playing;
        const icon = playPauseBtn.querySelector('i');
        if (playing) {
          WeddingMusic.play();
          if (icon) icon.className = 'fa-solid fa-pause';
          toggleBtn.classList.remove('is-paused');
          playPauseBtn.setAttribute('aria-label', 'Jeda musik');
        } else {
          WeddingMusic.pause();
          if (icon) icon.className = 'fa-solid fa-play';
          toggleBtn.classList.add('is-paused');
          playPauseBtn.setAttribute('aria-label', 'Putar musik');
        }
      });
    }

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        WeddingMusic.setVolume(Number(e.target.value));
      });
    }

    if (loopBtn) {
      loopBtn.addEventListener('click', () => {
        const isActive = loopBtn.classList.toggle('is-active');
        loopBtn.setAttribute('aria-pressed', String(isActive));
        WeddingMusic.setLoop(isActive);
      });
    }
  }

  /* ---------------------------------------------------
     12. VISUALLY HIDDEN HELPER (for a11y labels in CSS)
  --------------------------------------------------- */
  function injectA11yStyles() {
    if (document.getElementById('wedding-a11y-style')) return;
    const style = document.createElement('style');
    style.id = 'wedding-a11y-style';
    style.textContent =
      '.visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;}';
    document.head.appendChild(style);
  }

  /* ---------------------------------------------------
     13. INIT ON DOM READY
  --------------------------------------------------- */
  function init() {
    injectA11yStyles();
    initGuestName();
    initOpeningScreen();
    initScrollReveal();
    initFloatingNav();
    initScrollEffects();
    initCountdown();
    initLightbox();
    initRsvpForm();
    initCopyButtons();
    initRipple();
    initMusicPlayerUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
