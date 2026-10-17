"""Check saved/system themes, mobile toggle accessibility and storage fallback."""
import functools
import http.server
import threading
from playwright.sync_api import sync_playwright
from verify import ROOT, QuietHandler, check

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(color_scheme='light', reduced_motion='reduce')
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base, wait_until='networkidle')
        toggle = page.locator('#theme-toggle')
        check(page.locator('html').get_attribute('data-theme') == 'light', 'Initial theme follows light system preference')
        page.emulate_media(color_scheme='dark')
        page.wait_for_function('document.documentElement.dataset.theme === "dark"')
        check(page.locator('html').get_attribute('data-theme') == 'dark', 'System theme changes apply before a manual choice')
        toggle.click()
        check(page.locator('html').get_attribute('data-theme') == 'light', 'Toggle switches back to light mode')
        check(toggle.get_attribute('aria-label') == 'Switch to dark mode' and toggle.get_attribute('aria-pressed') == 'false', 'Theme button exposes the next action and current state')
        page.reload(wait_until='networkidle')
        check(page.locator('html').get_attribute('data-theme') == 'light', 'Saved light theme overrides dark system preference after reload')
        toggle.click()
        page.reload(wait_until='networkidle')
        check(page.locator('html').get_attribute('data-theme') == 'dark', 'Dark preference persists after reload')
        check(page.locator('meta[name="theme-color"]').get_attribute('content') == '#211C18', 'Browser theme colour matches dark theme')
        for width in [1440, 1024, 768, 430, 375, 320]:
            page.set_viewport_size({'width': width, 'height': 1000})
            for theme in ['dark', 'light']:
                if page.locator('html').get_attribute('data-theme') != theme:
                    toggle.click()
                check(toggle.is_visible() and toggle.bounding_box()['width'] >= 44, f'Theme control is touch-friendly at {width}px in {theme} mode')
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'No horizontal overflow at {width}px in {theme} mode')
                check(page.locator('.identity-art').evaluate('(el)=>el.complete&&el.naturalWidth>0'), f'Portrait remains visible in {theme} mode')
                if width in [1440, 375]:
                    page.screenshot(path=str(ROOT / 'tests' / f'{theme}-{width}.png'))
            if width <= 768:
                page.locator('.menu-toggle').click()
                check(page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true', 'Mobile menu still opens beside theme control')
                page.keyboard.press('Escape')
        toggle.focus(); page.keyboard.press('Enter')
        check(page.locator('html').get_attribute('data-theme') == 'dark', 'Keyboard activates theme toggle')
        # A separate tab receives changes through the native storage event.
        second = context.new_page(); second.goto(base, wait_until='networkidle')
        toggle.click()
        second.wait_for_function('document.documentElement.dataset.theme === "light"')
        check(True, 'Theme preference synchronises between tabs')
        second.close()
        private = browser.new_context(color_scheme='dark', reduced_motion='reduce')
        private.add_init_script('Object.defineProperty(window,"localStorage",{get(){throw new Error("Storage unavailable")}})')
        fallback = private.new_page(); fallback.goto(base, wait_until='networkidle')
        check(fallback.locator('html').get_attribute('data-theme') == 'dark', 'System dark mode works when storage is blocked')
        fallback.locator('#theme-toggle').click()
        check(fallback.locator('html').get_attribute('data-theme') == 'light', 'Toggle still works when storage is blocked')
        private.close()
        file_page = browser.new_page(color_scheme='light', reduced_motion='reduce')
        file_page.goto((ROOT / 'index.html').as_uri(), wait_until='networkidle')
        file_page.locator('#theme-toggle').click()
        check(file_page.locator('html').get_attribute('data-theme') == 'dark', 'Theme toggle works in direct-file previews')
        check(not errors, f'No theme JavaScript errors: {errors}')
        browser.close()
finally:
    server.shutdown(); server.server_close()
