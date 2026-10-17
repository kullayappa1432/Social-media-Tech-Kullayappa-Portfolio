(() => {
  'use strict';
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
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
