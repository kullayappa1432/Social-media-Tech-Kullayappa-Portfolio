"""Regression check for image visibility in direct-file and HTTP previews."""
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
        errors = []
        for url in [(ROOT / 'index.html').as_uri(), f'http://127.0.0.1:{server.server_port}/']:
            for width in [1440, 375]:
                page = browser.new_page(viewport={'width': width, 'height': 1000}, reduced_motion='reduce')
                page.on('pageerror', lambda error: errors.append(str(error)))
                page.goto(url, wait_until='networkidle')
                mode = url.split(':')[0]
                check(page.locator('.identity-art').evaluate('(el)=>el.complete && el.naturalWidth === 768'), f'Portrait is visible in {mode} preview at {width}px')
                page.locator('img').evaluate_all('(images)=>images.forEach(img=>img.loading="eager")')
                page.wait_for_function('Array.from(document.images).every(img=>img.complete && img.naturalWidth > 0)')
                check(True, f'All bundled images load in {mode} preview at {width}px')
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Layout fits {mode} preview at {width}px')
                check(page.evaluate('Studio.safeUrl("assets/images/creator-portrait.jpg") === new URL("assets/images/creator-portrait.jpg",location.href).href'), 'Relative image URLs resolve correctly')
                for value in ['javascript:alert(1)', 'data:text/html,test', 'file:///C:/outside-project.jpg', '']:
                    check(page.evaluate('(value)=>Studio.safeUrl(value) === ""', value), f'URL checker rejects {value!r}')
                if mode == 'file':
                    check(page.evaluate('Studio.safeUrl("../outside-project.jpg") === ""'), 'Local preview restricts file assets to the project directory')
                page.close()
        check(not errors, f'No JavaScript errors in either preview mode: {errors}')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
