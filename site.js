(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-main-navigation]');
  const headerInner = menuToggle?.closest('.header-inner');

  const closeMenu = () => {
    if (!menuToggle || !headerInner) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open main menu');
    headerInner.classList.remove('menu-open');
  };

  if (menuToggle && navigation && headerInner) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
      menuToggle.setAttribute('aria-label', open ? 'Open main menu' : 'Close main menu');
      headerInner.classList.toggle('menu-open', !open);
    });

    navigation.addEventListener('click', (event) => {
      if (event.target.closest('a')) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
        closeMenu();
        menuToggle.focus();
      }
    });

    window.matchMedia('(min-width: 821px)').addEventListener?.('change', closeMenu);
  }

  const revealItems = [...document.querySelectorAll('[data-reveal]')];
  if (revealItems.length) {
    document.documentElement.classList.add('reveal-ready');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach((item) => item.classList.add('is-revealed'));
    } else {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      revealItems.forEach((item) => observer.observe(item));
    }
  }

  const video = document.querySelector('[data-hero-background]');
  if (!video) return;

  const saveData = navigator.connection?.saveData ?? false;
  if (reducedMotion || saveData) {
    video.preload = 'none';
    video.pause();
    return;
  }

  const markReady = () => video.closest('.hero-media')?.classList.add('is-ready');
  const play = () => {
    markReady();
    video.play().catch(() => {});
  };

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) play();
  else video.addEventListener('canplay', play, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
})();
