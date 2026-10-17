"""Check the monthly-management journey and the three service enquiry routes."""
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
        errors, failed = [], []
        for theme in ['light', 'dark']:
            context = browser.new_context(color_scheme=theme, reduced_motion='reduce')
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: failed.append(response.url) if response.status >= 400 else None)
            page.goto(base, wait_until='networkidle')
            check('Your Social Media.' in page.locator('h1').inner_text(), f'{theme}: hero states the main service')
            check(page.locator('.hero-buttons .button').get_attribute('href') == '#packages', 'Primary hero CTA goes to monthly plans')
            check(page.locator('[data-monthly-start]').inner_text() == '₹7,500', 'Starting monthly price comes from configuration')
            order = page.locator('main>section[id]').evaluate_all('(els)=>els.map(el=>el.id)')
            check(order.index('services') < order.index('packages') < order.index('process') < order.index('work') < order.index('about'), 'Monthly service, plans and process lead the page')
            cards = page.locator('#pricing-grid .price-card').evaluate_all('(els)=>els.map(el=>el.className)')
            check('basic' in cards[0] and 'premium' in cards[1] and 'individual' in cards[2], 'Both monthly plans precede the secondary individual reel offer')
            for selector, expected in [('.hero-buttons .service-enquiry', 'Social Media Management'), ('.service-path [data-service-name="Reel Editing"]', 'Reel Editing'), ('.service-path [data-service-name="Brand Collaboration"]', 'Brand Collaboration')]:
                page.locator(selector).click()
                check(page.locator('#service').input_value() == expected, f'{theme}: enquiry route preselects {expected}')
                page.locator('#details').fill('')
            for width in [1440, 1024, 768, 430, 375, 320]:
                page.set_viewport_size({'width': width, 'height': 1100})
                page.evaluate('window.scrollTo({top:0,behavior:"instant"})')
                page.wait_for_timeout(100)
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'{theme}: layout fits {width}px')
                if width in [1440, 375]:
                    page.screenshot(path=str(ROOT / 'tests' / f'management-hero-{theme}-{width}.png'))
                catalog = page.locator('.service-catalog')
                catalog.locator('summary').click()
                check(page.locator('.service-card:visible').count() == 6, 'Expanded service catalogue exposes all six main creative services')
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Expanded catalogue does not overflow')
                catalog.locator('summary').click()
            page.set_viewport_size({'width':1440, 'height':1100})
            for section in ['services','packages']:
                page.evaluate('(id)=>window.scrollTo({top:document.getElementById(id).offsetTop-85,behavior:"instant"})', section)
                page.wait_for_timeout(100)
                page.screenshot(path=str(ROOT / 'tests' / f'management-{section}-{theme}.png'))
            page.locator('#packages').scroll_into_view_if_needed(); page.wait_for_timeout(100)
            check(page.locator('#primary-nav [href="#packages"]').get_attribute('aria-current') == 'location', 'Active navigation follows the reordered sections')
            context.close()
        check(not errors and not failed, f'No errors or failed local assets: {errors}, {failed}')
        browser.close()
finally:
    server.shutdown(); server.server_close()
