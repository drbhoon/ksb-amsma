(() => {
  'use strict';
  const video = document.querySelector('[data-hero-sequence]');
  if (!video) return;

  const clips = [
    { file: '../assets/quarry-nesting-habitat.mp4', label: 'Quarry nesting habitat' },
    { file: '../assets/aggregate-production.mp4', label: 'Aggregate production' },
    { file: '../assets/quarry-water-and-wildlife.mp4', label: 'Quarry water and wildlife' }
  ];
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const status = document.getElementById('sequence-status');
  let index = 0;
  let ended = false;

  function updateStatus() {
    if (!status) return;
    const suffix = ended ? ' · Sequence complete' : reducedMotion ? ' · Press play' : '';
    status.textContent = `Clip ${index + 1} of ${clips.length} · ${clips[index].label}${suffix}`;
  }

  function setClip(nextIndex, shouldPlay) {
    index = nextIndex;
    ended = false;
    video.src = clips[index].file;
    video.load();
    updateStatus();
    if (shouldPlay) {
      const promise = video.play();
      promise?.catch(() => updateStatus());
    }
  }

  function advance(shouldPlay = !reducedMotion) {
    if (index >= clips.length - 1) {
      ended = true;
      video.pause();
      updateStatus();
      return false;
    }
    setClip(index + 1, shouldPlay);
    return true;
  }

  video.addEventListener('ended', () => advance(!reducedMotion));
  video.addEventListener('error', updateStatus);
  updateStatus();

  window.__amsmaHeroSequence = {
    files: clips.map(clip => clip.file.split('/').pop()),
    get currentIndex() { return index; },
    get complete() { return ended; },
    reducedMotion,
    advance
  };

  if (!reducedMotion) {
    const play = () => video.play().catch(() => updateStatus());
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) play();
    else video.addEventListener('canplay', play, { once: true });
  }
})();
