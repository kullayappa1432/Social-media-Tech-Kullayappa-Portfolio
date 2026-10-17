/* Apply the saved/system theme before styles paint, then wire the header control. */
(() => {
  'use strict';
  const key = 'tk-color-theme';
  const system = matchMedia('(prefers-color-scheme: dark)');
  let choice = null;
  try { const saved = localStorage.getItem(key); if (saved === 'light' || saved === 'dark') choice = saved; } catch { /* Storage can be unavailable in private/file previews. */ }
  function apply(theme) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = dark ? '#211C18' : '#F7EFE3';
    const button = document.querySelector('#theme-toggle');
    if (button) {
      const action = dark ? 'Switch to light mode' : 'Switch to dark mode';
      button.setAttribute('aria-label', action);
      button.setAttribute('aria-pressed', String(dark));
      button.title = action;
    }
  }
  const preferred = () => choice || (system.matches ? 'dark' : 'light');
  apply(preferred());
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.querySelector('#theme-toggle');
    if (!button) return;
    apply(preferred());
    button.hidden = false;
    button.addEventListener('click', () => {
      choice = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, choice); } catch { /* The toggle still works for this page. */ }
      apply(choice);
    });
  }, { once: true });
  system.addEventListener('change', () => { if (!choice) apply(preferred()); });
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    choice = event.newValue === 'light' || event.newValue === 'dark' ? event.newValue : null;
    apply(preferred());
  });
})();
