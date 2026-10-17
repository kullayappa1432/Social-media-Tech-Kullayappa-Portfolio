"""Exercise actual intro playback and fail-open paths without external services."""
import functools
import http.server
import threading
from playwright.sync_api import sync_playwright
from verify import ROOT, QuietHandler, check

class MediaHandler(QuietHandler):
    def copyfile(self, source, outputfile):
        try:
            super().copyfile(source, outputfile)
        except (ConnectionResetError, BrokenPipeError):
            pass  # Skip intentionally cancels an in-progress media response.


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(MediaHandler, directory=str(ROOT)))
threading.Thread(target=server.serve_forever, daemon=True).start()
base = f'http://127.0.0.1:{server.server_port}/'
errors = []


def ready(page):
    page.wait_for_function('document.getElementById("splash-video").currentTime > .1')
    check(page.locator('#splash-intro').evaluate('(el)=>el.open && el.matches(":modal")'), 'Intro is a modal above the portfolio')
    check(not page.locator('main').is_visible(), 'Portfolio stays hidden during intro')
    check(page.locator('#splash-video').evaluate('(v)=>v.autoplay && v.muted && v.playsInline && !v.loop && !v.paused'), 'Video autoplays muted and inline, once')


def released(page):
    page.wait_for_function('document.getElementById("splash-intro").hidden')
    check(page.locator('main').is_visible(), 'Portfolio becomes visible')
    check(page.locator('#splash-video').evaluate('(v)=>v.paused && !v.getAttribute("src")'), 'Video is stopped and its download released')
    check(page.evaluate('!document.documentElement.classList.contains("splash-pending") && getComputedStyle(document.documentElement).overflow !== "hidden"'), 'Scrolling is restored')


try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width':1440, 'height':900})
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(base, wait_until='load')
        ready(page)
        for width, height in [(1440,900), (768,1024), (375,812), (320,568), (812,375)]:
            page.set_viewport_size({'width':width, 'height':height})
            check(page.locator('#splash-intro').evaluate('(el)=>{const r=el.getBoundingClientRect();return r.x===0 && r.y===0 && Math.abs(r.width-innerWidth)<1 && Math.abs(r.height-innerHeight)<1;}'), f'Splash fills {width}x{height}')
            check(page.locator('#splash-video').evaluate('(el)=>getComputedStyle(el).objectFit === "contain"'), 'Video preserves the complete frame without distortion')
            check(page.locator('#splash-skip').evaluate('(el)=>{const r=el.getBoundingClientRect();return r.x>=0 && r.y>=0 && r.right<=innerWidth && r.bottom<=innerHeight && r.height>=44;}'), 'Skip stays within the viewport with a usable touch target')
        page.set_viewport_size({'width':1440, 'height':900})
        page.screenshot(path=str(ROOT/'tests/splash-desktop.png'))
        page.locator('#splash-skip').click()
        check(page.locator('#splash-video').evaluate('(v)=>v.paused'), 'Skip stops playback immediately')
        check(page.locator('#splash-intro').evaluate('(el)=>el.classList.contains("is-leaving") && el.open'), 'Skip starts a fade before closing')
        released(page)
        check(page.locator('main').evaluate('(el)=>document.activeElement===el'), 'Skip moves keyboard focus into the website')
        page.locator('#primary-nav a[href="#about"]').click()
        page.wait_for_function('location.hash === "#about"')
        check(page.locator('#splash-intro').is_hidden(), 'Section navigation does not replay the intro')
        page.locator('#theme-toggle').click()
        check(page.locator('#theme-toggle').get_attribute('aria-pressed') == 'true', 'Existing theme toggle works after intro')
        page.close()

        # Actual natural end, accelerated only by the test to avoid waiting 52 seconds.
        mobile = browser.new_page(viewport={'width':375, 'height':812}, is_mobile=True, has_touch=True)
        mobile.on('pageerror', lambda error: errors.append(str(error)))
        mobile.goto(base, wait_until='load')
        ready(mobile)
        mobile.screenshot(path=str(ROOT/'tests/splash-mobile.png'))
        mobile.locator('#splash-video').evaluate('(v)=>{v.playbackRate=16;}')
        released(mobile)
        mobile.locator('.menu-toggle').click()
        check(mobile.locator('.menu-toggle').get_attribute('aria-expanded') == 'true', 'Existing mobile navigation works after natural completion')
        mobile.close()

        # Direct-file previews and reduced motion are supported too.
        local = browser.new_page(reduced_motion='reduce')
        local.goto((ROOT/'index.html').as_uri(), wait_until='load')
        ready(local)
        local.keyboard.press('Escape')
        released(local)
        check(local.locator('#splash-intro').evaluate('(el)=>getComputedStyle(el).transitionDuration === "0s"'), 'Reduced motion removes the intro transition')
        local.close()

        failed = browser.new_page()
        failed.route('**/assets/videos/splash.mp4', lambda route: route.abort())
        failed.goto(base, wait_until='load')
        released(failed)
        failed.close()
        check(True, 'Missing or failed video releases the website')

        blocked = browser.new_page()
        blocked.add_init_script('HTMLMediaElement.prototype.play = function(){return Promise.reject(new DOMException("Autoplay blocked", "NotAllowedError"));}')
        blocked.goto(base, wait_until='load')
        released(blocked)
        blocked.close()
        check(True, 'Rejected autoplay releases the website')

        # Hold the video request: loading remains elegant, and Skip needs no media.
        slow = browser.new_page()
        held = []
        slow.route('**/assets/videos/splash.mp4', lambda route: held.append(route))
        slow.goto(base, wait_until='domcontentloaded')
        check(slow.locator('#splash-loading').is_visible(), 'Loading fallback is visible while media is pending')
        slow.screenshot(path=str(ROOT/'tests/splash-loading.png'))
        slow.locator('#splash-skip').click()
        released(slow)
        for route in held:
            route.abort()
        slow.unroute_all(behavior='wait')
        slow.close()
        check(True, 'Skip works before any video data arrives')

        timeout = browser.new_page()
        held_timeout = []
        timeout.route('**/assets/videos/splash.mp4', lambda route: held_timeout.append(route))
        timeout.goto(base, wait_until='domcontentloaded')
        released(timeout)
        for route in held_timeout:
            route.abort()
        timeout.unroute_all(behavior='wait')
        timeout.close()
        check(True, 'Ten seconds without media progress automatically releases the website')

        for js in [False, True]:
            no_intro = browser.new_page(java_script_enabled=js)
            if js:
                no_intro.route('**/js/splash.js*', lambda route: route.abort())
            no_intro.goto(base, wait_until='load')
            check(no_intro.locator('main').is_visible() and no_intro.locator('#splash-intro').is_hidden(), 'Site stays accessible without JavaScript or the intro script')
            no_intro.close()
        check(not errors, f'No JavaScript errors during actual playback: {errors}')
        browser.close()
finally:
    server.shutdown()
    server.server_close()
