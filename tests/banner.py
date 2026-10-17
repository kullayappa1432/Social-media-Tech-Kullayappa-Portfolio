"""Check the owner portrait, scroll transforms and reduced-motion behaviour."""
import functools
import http.server
import threading
from playwright.sync_api import sync_playwright
from verify import ROOT, QuietHandler, check

server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(reduced_motion='no-preference')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        for width in [1440, 1024, 768, 430, 375, 320]:
            page.set_viewport_size({'width': width, 'height': 1000 if width > 600 else 1100})
            page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
            page.wait_for_timeout(1600)
            photo = page.locator('.identity-art')
            check(photo.evaluate('(el)=>el.complete && el.naturalWidth === 768'), f'Owner portrait loads at {width}px')
            check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Portrait composition fits at {width}px')
            baseline = photo.evaluate('(el)=>getComputedStyle(el).transform')
            # The existing sticky header compacts on scroll; exclude that intentional height change.
            reach_top = page.locator('#reach').evaluate('(el)=>el.getBoundingClientRect().top + scrollY - document.querySelector(".site-header").offsetHeight')
            if width in [1440, 375]:
                page.screenshot(path=str(ROOT / 'tests' / f'banner-{width}.png'))
            page.evaluate('window.scrollTo({top:320,behavior:"instant"})')
            page.wait_for_timeout(850)
            moved = photo.evaluate('(el)=>getComputedStyle(el).transform')
            check(baseline != moved, f'Scrolling animates the photo at {width}px')
            check(page.locator('.hero-art').evaluate('(el)=>parseFloat(el.style.getPropertyValue("--banner-tilt")) < 0'), f'Arch and decorative layers respond to scroll at {width}px')
            check(abs(page.locator('#reach').evaluate('(el)=>el.getBoundingClientRect().top + scrollY - document.querySelector(".site-header").offsetHeight') - reach_top) < 1, f'Portrait animation does not shift page layout at {width}px')
            page.emulate_media(reduced_motion='reduce')
            page.wait_for_timeout(100)
            check(photo.evaluate('(el)=>getComputedStyle(el).transform') == 'none', f'Reduced motion immediately stops photo movement at {width}px')
            page.evaluate('window.scrollTo({top:450,behavior:"instant"})')
            page.wait_for_timeout(100)
            check(photo.evaluate('(el)=>getComputedStyle(el).transform') == 'none', f'Reduced-motion portrait remains still while scrolling at {width}px')
            page.emulate_media(reduced_motion='no-preference')
        check(not errors, f'No banner JavaScript errors: {errors}')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
