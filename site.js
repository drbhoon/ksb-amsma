(() => {
  'use strict';

  document.documentElement.classList.add('js');

  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navigation = document.querySelector('[data-main-navigation]');
  const headerInner = menuToggle?.closest('.header-inner');

  const closeMenu = () => {
    if (!menuToggle || !headerInner) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    headerInner.classList.remove('menu-open');
  };

  if (menuToggle && navigation && headerInner) {
    menuToggle.addEventListener('click', () => {
      const open = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!open));
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

  const video = document.querySelector('[data-hero-background]');
  if (!video) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const saveData = navigator.connection?.saveData ?? false;
  if (reducedMotion || saveData) {
    video.preload = 'none';
    video.pause();
    return;
  }

  const play = () => video.play().catch(() => {});

  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) play();
  else video.addEventListener('canplay', play, { once: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else play();
  });
})();
