"""Browser regression checks. Requires Python Playwright and its Chromium browser.
Run from the workspace root: python tech-kullayappa-portfolio/tests/verify.py
No message is sent and no external player is loaded by this test.
"""
import functools
import http.server
import json
from pathlib import Path
import threading
from urllib.parse import urlparse, parse_qs, unquote
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

def check(value, description):
    if not value:
        raise AssertionError(description)
    print('PASS:', description)

def main():
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f'http://127.0.0.1:{server.server_port}/'
    errors, missing, remote = [], [], []
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={'width': 1440, 'height': 1000}, reduced_motion='reduce')
            page = context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('response', lambda response: missing.append(response.url) if response.status >= 400 else None)
            page.on('request', lambda request: remote.append(request.url) if not request.url.startswith(base) else None)
            response = page.goto(base, wait_until='networkidle')
            check(response.status == 200, 'Local website serves successfully')
            check(page.locator('#portfolio-grid .video-card').count() == 4, 'Exactly four featured portfolio items')
            check(page.locator('#portfolio-grid [data-platform=instagram]').count() == 2, 'Two authentic Instagram features')
            check(page.locator('#portfolio-grid [data-platform=youtube]').count() == 2, 'Two authentic YouTube features')
            check(page.locator('.price-card').count() == 3 and page.locator('.service-card').count() == 6, 'All packages and primary services render')
            check(page.locator('.extra-service').count() == 4, 'All four supporting services render')
            check(not remote, 'No third-party requests before a video is loaded')
            check(page.locator('.rotating-stamp').evaluate('(el)=>getComputedStyle(el).animationName') == 'none', 'Reduced motion disables decorative animation')
            check(page.evaluate('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size === document.querySelectorAll("[id]").length'), 'No duplicate HTML IDs')
            check(page.evaluate('''()=>[...document.querySelectorAll('a[href^="#"]')].every(a=>a.hash.length>1 && document.getElementById(a.hash.slice(1)))'''), 'Every internal navigation link has a real target')
            check(page.evaluate('''()=>[...document.querySelectorAll('a[target="_blank"]')].every(a=>a.rel.includes('noopener') && a.rel.includes('noreferrer'))'''), 'External new-tab links have safe attributes')
            for width in [1440, 1024, 768, 430, 375, 320]:
                page.set_viewport_size({'width': width, 'height': 900})
                check(page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'No horizontal overflow at {width}px')
                check(page.locator('h1').evaluate('(el)=>el.getBoundingClientRect().right<=innerWidth'), f'Hero heading fits at {width}px')
            page.set_viewport_size({'width': 375, 'height': 900})
            page.locator('.menu-toggle').click()
            check(page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true', 'Mobile menu opens')
            page.keyboard.press('Escape')
            check(page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false', 'Escape closes mobile menu')
            page.locator('.menu-toggle').click()
            page.locator('#primary-nav a[href="#services"]').click()
            check(page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false', 'Mobile navigation closes after selection')
            page.set_viewport_size({'width': 1440, 'height': 1000})
            page.locator('#work').scroll_into_view_if_needed()
            page.locator('[data-filter=instagram]').click()
            check(page.locator('#portfolio-grid .video-card:visible').count() == 2, 'Instagram portfolio filter works')
            page.locator('[data-filter=youtube]').click()
            check(page.locator('#portfolio-grid .video-card:visible').count() == 2, 'YouTube portfolio filter works')
            page.locator('[data-filter=all]').click()
            check(page.locator('#portfolio-grid .video-card:visible').count() == 4, 'All stories filter restores four items')
            first_tab = page.locator('#expertise-tabs [role=tab]').first
            first_tab.focus(); page.keyboard.press('ArrowDown')
            check(page.locator('#expertise-tabs [aria-selected=true]').inner_text().endswith('Short-Form Storytelling'), 'Expertise tabs support keyboard navigation')
            check('full story' in page.locator('#expertise-panel').inner_text(), 'Expertise tab updates content and visual')
            page.locator('#quality-tabs [role=tab]').first.focus(); page.keyboard.press('End')
            check('Made for where it lives' in page.locator('#quality-panel').inner_text(), 'Quality tabs update with End key')
            question = page.locator('.faq-question').first
            question.click()
            check(question.get_attribute('aria-expanded') == 'true' and page.locator('#faq-answer-0').get_attribute('aria-hidden') == 'false', 'FAQ opens accessibly')
            question.click()
            check(question.get_attribute('aria-expanded') == 'false', 'FAQ closes')
            service, quantity = page.locator('#estimate-service'), page.locator('#reel-quantity')
            quantity.fill('3')
            check(page.locator('#estimate-output').inner_text() == '₹1,500 – ₹3,000', 'Three-reel estimate is mathematically correct')
            for invalid in ['0', '1.5', '1001', '']:
                quantity.fill(invalid)
                check(page.locator('#request-quote').is_disabled(), f'Invalid quantity {invalid!r} prevents quotation')
            quantity.fill('1000')
            check(page.locator('#estimate-output').inner_text() == '₹5,00,000 – ₹10,00,000', 'Upper-bound estimate uses correct Indian currency formatting')
            service.select_option('basic')
            check(page.locator('#estimate-output').inner_text() == '₹7,500 / month' and not quantity.is_visible(), 'Basic package uses fixed monthly rate')
            service.select_option('premium')
            check(page.locator('#estimate-output').inner_text() == '₹15,000 / month', 'Premium package uses fixed monthly rate')
            href = page.locator('#estimate-discuss').get_attribute('href')
            check('918919047894' in href and 'Premium Monthly Package' in unquote(href), 'Estimator WhatsApp link contains selected package')
            page.locator('#request-quote').click()
            check(page.locator('#service').input_value() == 'Premium Monthly Package', 'Request Quote transfers package to enquiry form')
            check('15,000' in page.locator('#budget').input_value(), 'Request Quote transfers estimated budget')
            page.locator('.form-submit').click()
            check(page.locator('#full-name').get_attribute('aria-invalid') == 'true', 'Required form fields validate inline')
            page.locator('#full-name').fill('Example Enquirer')
            page.locator('#email').fill('invalid-email'); page.locator('#phone').fill('123')
            page.locator('.form-submit').click()
            check(page.locator('#email-error').inner_text() and page.locator('#phone-error').inner_text(), 'Invalid email and phone receive accessible errors')
            page.locator('#business-name').fill('Example Brand')
            page.locator('#email').fill('enquirer@example.com'); page.locator('#phone').fill('+91 90000 00000')
            page.locator('#platform').select_option('Instagram & YouTube')
            page.locator('#details').fill('Please discuss a monthly creative plan for our brand.')
            page.locator('.form-submit').click()
            check(page.locator('#message-dialog').is_visible(), 'Valid enquiry opens a review dialog')
            message_url = page.locator('#send-message').get_attribute('href')
            message = parse_qs(urlparse(message_url).query)['text'][0]
            check(all(text in message for text in ['Example Enquirer', 'Example Brand', 'enquirer@example.com', '+91 90000 00000', 'Premium Monthly Package', '15,000', 'Instagram & YouTube', 'monthly creative plan']), 'Encoded WhatsApp message includes every enquiry field')
            check(page.locator('#message-status').inner_text() == 'Your message has not been sent.', 'Form never falsely claims message delivery')
            page.keyboard.press('Escape')
            check(not page.locator('#message-dialog').is_visible(), 'Message dialog supports Escape')
            for card in page.locator('.price-card').all():
                href = card.locator('a').get_attribute('href')
                check('https://wa.me/918919047894?' in href and card.locator('h3').inner_text() in unquote(href), 'Pricing enquiry includes the correct package')
            # Stub only the external embed requests: test the real click-to-load wiring without contacting players.
            page.route('https://www.youtube-nocookie.com/**', lambda route: route.fulfill(status=200, content_type='text/html', body='<p>Player wiring check</p>'))
            page.route('https://www.instagram.com/reel/**/embed/', lambda route: route.fulfill(status=200, content_type='text/html', body='<p>Embed wiring check</p>'))
            page.locator('#portfolio-grid [data-video-platform=youtube]').first.click()
            check('youtube-nocookie.com/embed/03jc7qtkBb0' in page.locator('#portfolio-grid iframe').first.get_attribute('src'), 'YouTube loads privacy-enhanced player only after click')
            page.locator('#portfolio-grid [data-video-platform=instagram]').first.click()
            check('/reel/Dejfr4JT-eT/embed/' in page.locator('#portfolio-grid iframe').nth(1).get_attribute('src'), 'Instagram uses official Reel embed URL')
            check(page.locator('#portfolio-grid a[href*="instagram.com/reel/Dejfr4JT-eT/"]').count() == 2, 'Instagram original links remain available after embedding')
            page.locator('#packages').scroll_into_view_if_needed(); page.wait_for_timeout(100)
            check(page.locator('#primary-nav a[href="#packages"]').get_attribute('aria-current') == 'location', 'Navigation marks the current section')
            check(float(page.locator('.scroll-progress').evaluate('(el)=>parseFloat(el.style.width)')) > 0, 'Scroll progress updates')
            page.locator('.back-to-top').click(); page.wait_for_timeout(100)
            check(page.evaluate('scrollY') < 100, 'Back-to-top control works')
            check(page.locator('#copyright-year').inner_text() == page.evaluate('String(new Date().getFullYear())'), 'Copyright year is dynamic')
            check(not errors, f'No JavaScript errors: {errors}')
            check(not missing, f'No failed local resources: {missing}')
            page.reload(wait_until='networkidle')
            page.screenshot(path=str(ROOT / 'tests' / 'desktop.png'), full_page=True)
            page.set_viewport_size({'width':375,'height':900}); page.screenshot(path=str(ROOT/'tests'/'mobile-375.png'))
            # Switch to ordinary motion and verify reveal elements become visible on scroll.
            page.emulate_media(reduced_motion='no-preference'); page.reload(wait_until='networkidle')
            page.locator('#about').scroll_into_view_if_needed(); page.wait_for_timeout(1100)
            check(page.locator('.about-copy').evaluate('(el)=>getComputedStyle(el).opacity') == '1', 'Scroll entrance animations reveal content')
            check(not errors, 'No errors after normal-motion interaction')
            browser.close()
            print(json.dumps({'result':'passed','viewports':[1440,1024,768,430,375,320],'javascript_errors':errors,'failed_resources':missing}, indent=2))
    finally:
        server.shutdown(); server.server_close()

if __name__ == '__main__':
    main()
