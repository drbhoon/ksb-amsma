'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function MotionInit() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const transition = document.querySelector<HTMLElement>('.ll-route-transition');
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    root.classList.add('reveal-ready');
    if (!reduced && transition) {
      transition.classList.remove('is-active');
      requestAnimationFrame(() => transition.classList.add('is-active'));
    }

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-revealed'));
      return () => root.classList.remove('reveal-ready');
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        (entry.target as HTMLElement).classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    items.forEach((item, index) => {
      item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 70}ms`);
      observer.observe(item);
    });

    return () => {
      observer.disconnect();
      root.classList.remove('reveal-ready');
    };
  }, [pathname]);

  return <div className="ll-route-transition" aria-hidden="true" />;
}
