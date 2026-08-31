(() => {
  'use strict';

  const video = document.querySelector('[data-hero-background]');
  if (!video) return;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  if (reducedMotion) {
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
