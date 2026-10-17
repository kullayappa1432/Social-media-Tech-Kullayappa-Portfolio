# Tech Kullayappa — Creator & Social Studio

A complete, buildless portfolio in semantic HTML5, CSS3 and vanilla JavaScript. No framework, backend, package installation or runtime dependency is required. Fonts, original artwork, profile avatar and the four video thumbnails are included locally.

## Run locally

In PowerShell:

```powershell
cd C:\MySocialMideaPortfolio\tech-kullayappa-portfolio
python -m http.server 4173 --bind 127.0.0.1
```

Open **http://127.0.0.1:4173**. Press Ctrl+C in that terminal to stop. You can also use any static web server. A server is recommended for clipboard support and accurate preview behaviour; no backend processes enquiries.

## Files

```text
index.html                 All 22 requested sections, including the footer
css/style.css              Palette, typography and desktop composition
css/responsive.css         Tablet and mobile layouts, down to 320px
css/animations.css         Entrance, marquee, stamp and reduced-motion rules
js/config.js               Social accounts, metrics, videos, services and pricing
js/main.js                 Navigation, estimator, forms, tabs, FAQs and reviews
js/portfolio.js            Four media features, filters and click-to-load players
js/animations.js           Scroll reveals, confirmed counters and subtle movement
assets/images/             Original artwork, owned-account media and social preview
assets/fonts/              Self-hosted fonts and their SIL Open Font Licenses
assets/icons/              Original botanical illustration
assets/videos/             Available for future owner-supplied local video files
favicon.svg                Original TK mark
build.mjs                  Optional static deployment packaging, Node built-ins only
.openai/hosting.json       Sites identity and static output configuration
tests/verify.py            Browser interaction and responsive regression checks
tests/accessibility-results.json  Recorded accessibility audit result
```

## Update content

Start with **`js/config.js`**. It is a regular deferred script exposing `window.SITE_CONFIG`; keep its property names and valid JavaScript syntax.

| Change | Configuration |
| --- | --- |
| Brand and subtitle | `brandName`, `tagline` |
| Instagram | `instagramProfileUrl`, `instagramUsername`, `instagramBio`, `instagramAvatar` |
| Instagram metric | `instagramFollowerDisplay`, `instagramFollowerValue`, `instagramFollowerVerifiedAt` |
| YouTube | `youtubeChannelUrl`, `youtubeChannelId`, `youtubeDescription`, `youtubeVideoCount` |
| Subscriber metric | `youtubeSubscriberDisplay`, `youtubeSubscriberValue`, `youtubeSubscriberVerifiedAt` |
| Two Instagram Reels | `instagramReels` — real shortcode, editorial title, description, thumbnail, verification date |
| Two YouTube videos | `youtubeVideos` — real video ID, title, original title, description, thumbnail, date |
| WhatsApp | `whatsappNumber`, international digits only: currently `918919047894` |
| Business email | `contactEmail`: currently `rallapallikullayappakullayappa@gmail.com` |
| Owner portrait | `profileImage`, `profileImageAlt` |
| Service cards | `services` — first six primary, remaining four supporting |
| Rates and package inclusions | `pricingPackages` |
| Expertise and quality tabs | `expertise`, `quality` |
| Questions and payment wording | `faqs`; keep their prices consistent with `pricingPackages` |
| Approved client reviews | `testimonials` |
| Final site URL | `deploymentUrl` |

Store replacement images in `assets/images/` and reference their relative paths. Rebuild deployment output after source changes. General narrative copy is in `index.html`; all repeating/configurable components are driven by config.

The no-JavaScript fallback in `index.html` includes social and email links. If contact details change, update that fallback as well. Static `<head>` metadata and initial count/handle text should also match configuration for search crawlers and readers without JavaScript.

## Verified accounts and media

Checked **17 October 2026**, using public signed-out pages. Counts are rounded snapshots, not live statistics.

| Account | Confirmed details |
| --- | --- |
| [Instagram](https://www.instagram.com/techkullayappa__ai_creator/) | `@techkullayappa__ai_creator`; display name **TechKullayappa \| AI Creator**; rendered profile shows **13.6K followers**, while metadata rounds to 14K |
| [YouTube](https://www.youtube.com/@TechKullayappa) | **TechKullayappa**, **17.6K subscribers**, **27 videos**; channel ID `UCko23w-50AdxCPQiOh5FFZQ` |

The supplied Google Share URL originally resolved to `@kullayappa_ck`. The owner's later direct instruction selects **`@techkullayappa__ai_creator`**, which is used throughout this website. The two accounts' details have not been mixed.

Instagram's public biography identifies AI content creation, AI brand promotions and thumbnail design. A self-reported monthly-view claim in the biography is intentionally not used as independently verified reach. The YouTube overview in the site is a concise English paraphrase of the channel's public Telugu description: science, technology, AI, history, knowledge and everyday mysteries.

The four selected features are:

1. [Instagram — Dejfr4JT-eT](https://www.instagram.com/reel/Dejfr4JT-eT/): social media and creative-service promotion, published 16 October 2026.
2. [Instagram — DebgyFQucJB](https://www.instagram.com/reel/DebgyFQucJB/): AI real estate and property promotion, published 13 October 2026.
3. [YouTube — 03jc7qtkBb0](https://www.youtube.com/watch?v=03jc7qtkBb0): Simhachalam Temple Mystery, a Telugu temple story.
4. [YouTube — PKGVgc2ldkc](https://www.youtube.com/watch?v=PKGVgc2ldkc): My First Vlog Ever | New Beginning.

Instagram ownership was checked against links in the public profile grid and individual Reel metadata. YouTube ownership was confirmed by channel-page listings, official oEmbed author information and the public player response's channel ID. Both selected YouTube videos returned playback status `OK` and `playableInEmbed: true`. On-page titles are concise editorial summaries; full original YouTube titles remain in config and player accessibility labels.

Thumbnails and the small Instagram avatar are cached locally to avoid expiring CDN links. Instagram and YouTube media remain subject to the owner's rights and platform availability. No private content or authenticated account data was accessed.

## Enquiry behaviour

- Every package CTA creates a package-specific `wa.me` URL for the configured number.
- The estimator calculates ₹500–₹1,000 × reel quantity, ₹7,500 per Basic month, or ₹15,000 per Premium month. Reel quantities must be whole numbers from 1 to 1,000.
- Request Quote transfers the selected plan, estimate and project text into the lead form.
- The form validates name, email, phone, service and project details. Phone accepts 7–15 digits with common formatting characters.
- A valid form opens an accessible **review dialog**. Its WhatsApp link contains every field in a URL-encoded message. The visitor must send it in WhatsApp.
- Copy Message is available. Nothing is stored by this website, automatically sent or reported as delivered.
- If the WhatsApp number is blank, valid configured email becomes the `mailto:` fallback. If both channels are absent, the user can copy the enquiry and open the real Instagram profile. Fake contact links are never created.
- The terms are 30% advance and remaining 70% on the agreed schedule. Estimates are not invoices. Scope, platforms, complexity and deliverables require mutual agreement.

## Playback and privacy

No external scripts, tracking, remote fonts or video iframes load on the initial page. Clicking a video loads the official Instagram `/reel/.../embed/` iframe or YouTube's `youtube-nocookie.com` player. Playback can be affected by third-party settings, sign-in requirements, deleted posts, regional restrictions or blockers. **Watch on Instagram/YouTube links remain available beneath every card**, including after an embed loads. The phone showcase also links to the real Reel.

## Missing information and deliberate omissions

- **Full-size personal portrait:** not supplied. The hero and About use original branded artwork, clearly distinguishable from a portrait. No unrelated person's stock photograph is presented as Kullayappa.
- **Approved client testimonials:** not supplied. The site displays Client Stories Coming Soon. Add authentic records to `testimonials` with `{ clientName, businessName, quote, photo? }` to activate the controlled carousel.
- **Independent audience demographics, results, client names, awards and years of experience:** not supplied and not claimed.
- **Live subscriber/follower updates:** not implemented. Counts must be rechecked and updated with their dates. Automated YouTube updates require the YouTube Data API or another legitimate authorised source; secret credentials must remain on a secure server, never in frontend config.

## Visual system and accessibility

The six requested colours are defined in `:root`: cream `#F7EFE3`, terracotta `#B6542D`, burnt rust `#A64D2A`, olive `#45482B`, sand `#DCC6A9`, espresso `#332A21`. Small cream text uses burnt rust surfaces because cream on the lighter terracotta is below the WCAG AA 4.5:1 threshold. Terracotta remains an illustration and accent colour.

Cormorant Garamond, DM Sans and Dancing Script are self-hosted with their original licenses. Cormorant and DM Sans use Latin subsets in WOFF; Dancing Script retains the original downloaded font. Browser-synthesised italics and heavier weights avoid extra font downloads. The design includes semantic landmarks, a skip link, focus styles, labelled form errors, keyboard tabs, native dialog focus handling, accessible accordion state, safe external links and reduced-motion support.

## Validation performed

`tests/verify.py` passed in Chromium at **1440, 1024, 768, 430, 375 and 320px**, checking layout overflow, heading fit, mobile navigation and Escape, active navigation, every internal link target, external link attributes, exactly four portfolio features, filters, tab keyboard behaviour, FAQ states, estimator bounds and calculations, package message URLs, validation, review dialog, all encoded enquiry fields, video iframe URLs and persistent original links, scroll progress, back-to-top and dynamic year. No page JavaScript errors or failed local resources were observed. No enquiry was actually sent.

Player requests are stubbed only inside the regression test to verify click-to-load behaviour without loading remote players. Public video availability and embedding permissions were separately checked as described above. Browser checks do not prove third-party playback in every visitor's browser.

An **axe-core 4.10.3** automated WCAG A/AA/2.1 AA audit reported **zero automatic violations** at desktop and mobile widths; remaining contrast checks involving artwork require human review. See `tests/accessibility-results.json`. This is not a complete accessibility certification. Desktop and mobile screenshots were also inspected. Lighthouse has not been run, so no Lighthouse score is claimed.

To rerun the browser checks with an existing Python Playwright installation:

```powershell
cd C:\MySocialMideaPortfolio
python tech-kullayappa-portfolio/tests/verify.py
```

The check starts and stops its own temporary local server. Playwright and Chromium are development tools only; the deployed site does not depend on them.

## Static deployment

Upload `index.html`, `favicon.svg`, `css/`, `js/` and `assets/` to any HTTPS static host. The optional packaging command is:

```powershell
node build.mjs
```

It copies only runtime files to `dist/` using Node's built-in APIs. Sites uses the tracked identity in `.openai/hosting.json` and publishes `dist/`. Hosting access starts private; changing the audience is a separate owner decision.

When moving to a custom domain, update `deploymentUrl`, the static canonical URL and `og:url`, and use absolute URLs for the social-preview image in Open Graph/Twitter metadata. The supplied social preview is `assets/images/social-preview.png` (1200×630). JavaScript updates metadata for configured URLs, but static crawler-facing tags should also be changed before deployment. Keep the canonical omitted if no final origin is known.
