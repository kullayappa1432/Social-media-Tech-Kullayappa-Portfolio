/* One intro per document. Section navigation never starts another intro. */
(() => {
  'use strict';
  const root = document.documentElement;
  let intro, video, loader, skip, sound, startScreen, startButton, watchdog, fadeTimer;
  let awaitingSound = false;
  let playbackAttempt = 0;
  let finished = false;
  let closed = false;
  let returnFocus = false;
  const listeners = [];
  const listen = (target, name, handler) => {
    target.addEventListener(name, handler);
    listeners.push(() => target.removeEventListener(name, handler));
  };

  function closeIntro() {
    if (closed) return;
    closed = true;
    clearTimeout(fadeTimer);
    if (intro) {
      if (intro.open) intro.close();
      intro.hidden = true;
    }
    if (video) {
      video.removeAttribute('src');
      video.load(); // Release the download after the paused last frame has faded.
    }
    root.classList.remove('splash-pending');
    // Give keyboard users a useful position without changing the current hash/scroll.
    if (returnFocus) {
      const main = document.getElementById('main');
      if (main) {
        const previous = main.getAttribute('tabindex');
        main.setAttribute('tabindex', '-1');
        main.focus({ preventScroll:true });
        main.addEventListener('blur', () => {
          if (previous === null) main.removeAttribute('tabindex');
          else main.setAttribute('tabindex', previous);
        }, { once:true });
      }
    }
  }

  function finish(immediate = false) {
    if (finished) {
      if (immediate) closeIntro();
      return;
    }
    finished = true;
    clearTimeout(watchdog);
    listeners.forEach(remove => remove());
    if (video) {
      video.pause();
    }
    root.classList.remove('splash-pending');
    if (intro) intro.classList.add('is-leaving');
    if (immediate || !intro?.open || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      closeIntro();
    } else {
      intro.addEventListener('transitionend', event => {
        if (event.target === intro && event.propertyName === 'opacity') closeIntro();
      }, { once:true });
      fadeTimer = window.setTimeout(closeIntro, 650);
    }
  }

  function armWatchdog() {
    clearTimeout(watchdog);
    // A missing file, stalled connection or broken script must never block the site.
    watchdog = window.setTimeout(() => finish(), 10000);
  }

  function updateSound() {
    const enabled = !video.muted && video.volume > 0;
    sound.setAttribute('aria-pressed', String(enabled));
    sound.querySelector('[data-sound-label]').textContent = enabled ? 'Sound On' : 'Enable Sound';
    sound.title = enabled ? 'Mute intro sound' : 'Enable intro sound';
  }

  function playIntro(withSound) {
    if (finished) return;
    const attempt = ++playbackAttempt;
    video.muted = !withSound;
    if (withSound) video.volume = 1;
    updateSound();
    const failed = error => {
      // Ignore stale playback promises after a newer click or Skip.
      if (finished || attempt !== playbackAttempt) return;
      if (withSound && error.name === 'NotAllowedError') {
        // Keep the first second for the visitor: never fall back to a silent intro.
        video.pause();
        video.autoplay = false;
        video.currentTime = 0;
        awaitingSound = true;
        clearTimeout(watchdog);
        loader.setAttribute('aria-hidden', 'true');
        startScreen.hidden = false;
        sound.hidden = true;
        intro.classList.add('needs-sound');
        startButton.focus({ preventScroll:true });
      } else finish();
    };
    try {
      const playback = video.play();
      if (playback && typeof playback.catch === 'function') playback.catch(failed);
    } catch (error) {
      failed(error);
    }
  }

  function start() {
    if (finished) return;
    try {
      intro = document.getElementById('splash-intro');
      video = document.getElementById('splash-video');
      loader = document.getElementById('splash-loading');
      skip = document.getElementById('splash-skip');
      sound = document.getElementById('splash-sound');
      startScreen = document.getElementById('splash-start-screen');
      startButton = document.getElementById('splash-start');
      if (!intro || !video || !loader || !skip || !sound || !startScreen || !startButton || typeof intro.showModal !== 'function') {
        finish(true);
        return;
      }
      listen(skip, 'click', () => { returnFocus = true; finish(); });
      listen(sound, 'click', () => playIntro(video.muted || video.volume === 0));
      listen(startButton, 'click', () => {
        awaitingSound = false;
        startScreen.hidden = true;
        sound.hidden = false;
        intro.classList.remove('needs-sound');
        video.currentTime = 0;
        loader.removeAttribute('aria-hidden');
        armWatchdog();
        playIntro(true); // Called directly from the gesture, with audio from time zero.
        sound.focus({ preventScroll:true });
      });
      listen(video, 'volumechange', updateSound);
      listen(intro, 'cancel', event => { event.preventDefault(); returnFocus = true; finish(); });
      listen(intro, 'close', () => finish(true));
      listen(video, 'ended', () => finish());
      listen(video, 'error', () => finish());
      listen(video, 'playing', () => loader.setAttribute('aria-hidden', 'true'));
      for (const event of ['waiting', 'stalled']) {
        listen(video, event, () => {
          if (awaitingSound) return;
          loader.removeAttribute('aria-hidden'); armWatchdog();
        });
      }
      // Reset the inactivity limit only while the playback position advances.
      let previousTime = -1;
      listen(video, 'timeupdate', () => {
        if (!awaitingSound && video.currentTime > previousTime) {
          previousTime = video.currentTime;
          if (!video.paused && video.readyState >= 3) loader.setAttribute('aria-hidden', 'true');
          armWatchdog();
        }
      });
      listen(window, 'pagehide', () => finish(true));
      intro.hidden = false;
      intro.showModal();
      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.src = video.dataset.src;
      armWatchdog();
      // Start audibly when permitted; otherwise ask for a tap before frame one.
      playIntro(true);
    } catch {
      finish(true);
    }
  }

  // Run in the head to prevent a flash of the page; no JavaScript leaves it visible.
  armWatchdog();
  root.classList.add('splash-pending');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
