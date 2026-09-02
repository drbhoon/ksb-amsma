'use client';

import { useState } from 'react';

export function HeroVideo() {
  const [ready, setReady] = useState(false);

  return (
    <div className={`ll-hero-media ${ready ? 'is-ready' : ''}`}>
      <img src="/assets/quarry-nesting-habitat-poster.jpg" alt="" aria-hidden="true" width="1280" height="720" />
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/assets/quarry-nesting-habitat-poster.jpg"
        aria-hidden="true"
        tabIndex={-1}
        onCanPlay={() => setReady(true)}
      >
        <source src="/assets/quarry-nesting-habitat-web.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
