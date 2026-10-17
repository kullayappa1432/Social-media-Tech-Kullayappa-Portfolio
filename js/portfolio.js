(() => {
  'use strict';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const icon = name => `<svg class="icon" aria-hidden="true"><use href="#i-${escape(name)}"/></svg>`;
  const safeUrl = (value, fallback = '') => {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    try {
      const url = new URL(value, location.href);
      if (['https:', 'http:'].includes(url.protocol)) return url.href;
      // Directly opening index.html uses file://. Permit relative project assets
      // in that preview mode without accepting arbitrary file URLs or schemes.
      const relative = !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(value.trim());
      const projectDirectory = new URL('.', location.href).href;
      if (location.protocol === 'file:' && url.protocol === 'file:' && relative && url.href.startsWith(projectDirectory)) return url.href;
      return fallback;
    }
    catch { return fallback; }
  };
  const external = 'target="_blank" rel="noopener noreferrer"';
  function reelUrl(item) { return `https://www.instagram.com/reel/${encodeURIComponent(item.shortcode)}/`; }
  function youtubeUrl(item) { return `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`; }
  function pendingArt(tone, title, label = 'REEL PREVIEW TO COME') {
    return `<div class="pending-visual ${tone}">${icon('instagram')}<span class="pending-star" aria-hidden="true">✳</span><span class="pending-title">${title}</span><span class="pending-label">${label}</span></div>`;
  }
  function videoCard(item, platform, index) {
    const pending = !item;
    const titles = ['Ideas, brought<br>to life.', 'A different<br>perspective.'];
    const title = pending ? ['AI & creative ideas.', 'Brand stories in motion.'][index % 2] : item.title;
    const original = pending ? window.SITE_CONFIG.instagramProfileUrl : platform === 'youtube' ? youtubeUrl(item) : reelUrl(item);
    const description = pending ? 'Reel preview coming soon. Explore the creator’s public Instagram profile.' : item.description;
    const thumb = !pending && item.thumbnail ? `<img src="${escape(safeUrl(item.thumbnail))}" alt="${escape(item.originalTitle || title)} — video thumbnail" width="640" height="400" loading="lazy">` : pendingArt(index % 2 ? 'olive' : 'terracotta', titles[index % 2], pending ? 'INSTAGRAM / PREVIEW COMING SOON' : 'INSTAGRAM / ORIGINAL REEL');
    const playable = !pending && (platform === 'youtube' ? /^[A-Za-z0-9_-]{11}$/.test(item.id) : /^[A-Za-z0-9_-]+$/.test(item.shortcode));
    return `<article class="video-card" data-platform="${platform}"><div class="video-visual">${thumb}<span class="video-platform">${icon(platform)} ${platform.toUpperCase()}</span>${playable ? `<button class="play-button" type="button" data-video-platform="${platform}" data-video-id="${escape(platform === 'youtube' ? item.id : item.shortcode)}" data-video-title="${escape(item.originalTitle || title)}" aria-label="Play ${escape(title)}"><span class="play-triangle" aria-hidden="true"></span></button>` : ''}</div><div class="video-caption"><div><span class="video-category">${escape(pending ? 'Preview coming soon' : item.category || 'Creative storytelling')}</span><h3>${escape(title)}</h3><p>${escape(description)}</p></div><a href="${escape(safeUrl(original))}" ${external} aria-label="${pending ? 'Explore Instagram profile' : 'View original: ' + escape(title)}">${icon('up-right')}</a></div><a class="video-original" href="${escape(safeUrl(original))}" ${external}>${pending ? 'Explore Instagram' : `Watch on ${platform === 'youtube' ? 'YouTube' : 'Instagram'}`} ↗</a></article>`;
  }
  function renderPortfolio() {
    const c = window.SITE_CONFIG;
    const videos = c.youtubeVideos.slice(0, 2);
    const reels = c.instagramReels.slice(0, 2);
    document.querySelector('#portfolio-grid').innerHTML = videoCard(videos[0], 'youtube', 0) + videoCard(reels[0], 'instagram', 0) + videoCard(reels[1], 'instagram', 1) + videoCard(videos[1], 'youtube', 1);
    document.querySelector('#youtube-showcase').innerHTML = videos.map((v, i) => videoCard(v, 'youtube', i)).join('');
    if (reels.length === 2) document.querySelector('.portfolio-note').textContent = 'Original videos and Reels from Tech Kullayappa’s own accounts. Select a story to watch.';
    const phone = document.querySelector('#instagram-phone');
    if (reels[0]) {
      const r = reels[0];
      phone.innerHTML = (r.thumbnail ? `<img src="${escape(safeUrl(r.thumbnail))}" alt="${escape(r.title)} — Instagram Reel preview" width="300" height="450" loading="lazy">` : pendingArt('terracotta', 'Ideas in<br>motion.', 'ORIGINAL INSTAGRAM REEL')) + `<a class="phone-watch" href="${escape(reelUrl(r))}" ${external}>Watch this Reel on Instagram ↗</a>`;
    } else {
      phone.innerHTML = pendingArt('terracotta', 'A little AI.<br>A lot of<br>imagination.', 'BRANDED ARTWORK / REEL PREVIEW TO COME') + `<a class="phone-watch" href="${escape(c.instagramProfileUrl)}" ${external}>Explore the Instagram profile ↗</a>`;
    }
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-filter]').forEach(other => {
        const active = button === other;
        other.classList.toggle('active', active); other.setAttribute('aria-pressed', String(active));
      });
      let visible = 0;
      document.querySelectorAll('#portfolio-grid .video-card').forEach(card => {
        card.hidden = button.dataset.filter !== 'all' && card.dataset.platform !== button.dataset.filter;
        if (!card.hidden) visible++;
      });
      document.querySelector('#filter-status').textContent = `${visible} ${button.dataset.filter === 'all' ? 'portfolio' : button.dataset.filter} items shown.`;
    }));
    document.addEventListener('click', event => {
      const button = event.target.closest('[data-video-id]');
      if (!button) return;
      const iframe = document.createElement('iframe');
      const id = encodeURIComponent(button.dataset.videoId);
      iframe.src = button.dataset.videoPlatform === 'youtube' ? `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1` : `https://www.instagram.com/reel/${id}/embed/`;
      iframe.title = button.dataset.videoTitle;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      button.closest('.video-visual').replaceChildren(iframe);
      iframe.focus();
    });
  }
  window.Studio = { escape, icon, safeUrl, external, renderPortfolio };
})();
