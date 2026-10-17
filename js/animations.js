(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const banner = document.querySelector('.hero');
  const portrait = document.querySelector('.hero-art.has-portrait');
  if (banner && portrait) {
    let frame = 0, current = 0, target = 0;
    // All movement uses compositor transforms: the document layout stays stable.
    function paint(progress) {
      const mobile = innerWidth <= 600;
      portrait.style.setProperty('--portrait-y', `${(progress * (mobile ? 14 : 28)).toFixed(2)}px`);
      portrait.style.setProperty('--portrait-scale', (1.065 + progress * (mobile ? .035 : .075)).toFixed(4));
      portrait.style.setProperty('--banner-y', `${(progress * (mobile ? -6 : -16)).toFixed(2)}px`);
      portrait.style.setProperty('--banner-tilt', `${(progress * (mobile ? -.6 : -1.4)).toFixed(3)}deg`);
      portrait.style.setProperty('--note-y', `${(progress * (mobile ? -10 : -28)).toFixed(2)}px`);
      portrait.style.setProperty('--stamp-y', `${(progress * (mobile ? 6 : 14)).toFixed(2)}px`);
    }
    function animate() {
      current += (target - current) * .13;
      if (Math.abs(target - current) < .0005) current = target;
      paint(current);
      frame = current !== target ? requestAnimationFrame(animate) : 0;
    }
    function updateBanner() {
      if (preference.matches) {
        cancelAnimationFrame(frame); frame = 0; current = target = 0; paint(0); return;
      }
      const bounds = banner.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= innerHeight) {
        cancelAnimationFrame(frame); frame = 0; return;
      }
      target = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height * .85)));
      if (!frame) frame = requestAnimationFrame(animate);
    }
    window.addEventListener('scroll', updateBanner, { passive: true });
    window.addEventListener('resize', updateBanner, { passive: true });
    preference.addEventListener('change', updateBanner);
    updateBanner();
  }
  if (preference.matches || !('IntersectionObserver' in window)) return;
  document.body.classList.add('motion-ready');
  const reveals = [...document.querySelectorAll('.reveal')];
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); } });
  }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
  reveals.forEach(el => observer.observe(el));
  const c = window.SITE_CONFIG;
  const metrics = [
    { el: document.querySelector('.stats-grid [data-instagram-count]'), value: c.instagramFollowerValue, display: c.instagramFollowerDisplay, date: c.instagramFollowerVerifiedAt },
    { el: document.querySelector('.stats-grid [data-youtube-count]'), value: c.youtubeSubscriberValue, display: c.youtubeSubscriberDisplay, date: c.youtubeSubscriberVerifiedAt }
  ];
  const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counterObserver.unobserve(entry.target);
    const metric = metrics.find(item => item.el === entry.target);
    const start = performance.now();
    function frame(now) {
      if (preference.matches) { metric.el.textContent = metric.display; return; }
      const progress = Math.min(1, (now - start) / 1100);
      const amount = metric.value * (1 - Math.pow(1 - progress, 3));
      metric.el.textContent = progress === 1 ? metric.display : `${(amount / 1000).toFixed(1)}K`;
      if (progress < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }), { threshold: .8 });
  metrics.filter(m => m.el && m.date && Number.isFinite(m.value)).forEach(m => counterObserver.observe(m.el));
  preference.addEventListener('change', event => {
    if (event.matches) { document.body.classList.remove('motion-ready'); observer.disconnect(); counterObserver.disconnect(); metrics.forEach(m => { if (m.el) m.el.textContent = m.display; }); }
  });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('pointermove', event => {
        if (preference.matches) return;
        const bounds = button.getBoundingClientRect();
        button.style.translate = `${(event.clientX - bounds.left - bounds.width / 2) * .045}px ${(event.clientY - bounds.top - bounds.height / 2) * .06}px`;
      });
      button.addEventListener('pointerleave', () => { button.style.translate = ''; });
    });
    let pending = false;
    const branch = document.querySelector('.cta-branch');
    window.addEventListener('scroll', () => {
      if (pending || preference.matches) return;
      pending = true;
      requestAnimationFrame(() => {
        const bounds = branch.getBoundingClientRect();
        if (bounds.top < innerHeight && bounds.bottom > 0) branch.style.translate = `0 ${Math.max(-12, Math.min(12, (innerHeight / 2 - bounds.top) * .035))}px`;
        pending = false;
      });
    }, { passive: true });
  }
})();
