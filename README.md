# CarbonTrack Pro (upgraded)

## Folder structure
```
index.html            semantic page, 8 scenes, new feature sections
css/style.css         your original styles (extracted unchanged from index.html)
css/enhancements.css  scenes, overlays, new features, a11y + mobile-only rules
js/app.js             your original calculator (+2 tiny patches: exposes window.CTP, pauses canvas when hidden)
js/enhancements.js    story observer/parallax, flights, trees, what-if, badges, report
assets/img/           sceneN.webp/.jpg (1376w) and sceneN-768.webp/.jpg (mobile)
db/database.sql       users, assessments, results, recommendations
api/save.php          example hardened endpoint (not wired in; site still says "nothing is saved")
build.py              regenerates the site from the original single-file index.html
```
Your style.css / script_js.java uploads differ from the working index.html (no ambient canvas), so index.html was used as the source.

## Story placement
Scenes 1-6 sit before the calculator (the problem); scenes 7-8 sit after your recommendations (the solution). Each scene = image + dark gradient veil + opaque-ish content card, so text never competes with the picture.

## Optimization
- 19 MB of PNG became ~1.5 MB of WebP (both sizes) (plus JPG fallback); 768px variants via srcset on phones. Images are lazy-loaded.
- Parallax only runs for scenes on screen (IntersectionObserver + one rAF), desktop only, off for reduced-motion.
- Backdrop blur only on desktop; phones get an opaque card. Canvas background is off on phones and pauses in hidden tabs.
- Scripts are deferred. Run Lighthouse on your host to confirm the 90+ target; I did not measure it.

## Security
- CSP meta tag (no inline scripts allowed). Prefer sending it as an HTTP header too, plus `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, HSTS.
- Front end renders only clamped numbers and static strings; the report escapes all text with esc().
- save.php: CSRF token, session auth, rate limit (use nginx `limit_req` or Redis in production), whitelist + range validation, PDO prepared statements, DB CHECK constraints as a second wall. Hash passwords with `password_hash()`, use a least-privilege DB user, HTTPS only.

## Accessibility
Skip link, labelled nav, every slider/number labelled, live regions for badge and what-if, 44-48px touch targets on phones, reduced-motion honored, darker faint text and eyebrow colors for AA contrast. Still worth testing with a screen reader.

## Deployment
Any static host works for the front end (Netlify, Cloudflare Pages, nginx). For the DB: `mysql < db/database.sql`, set `DB_USER`/`DB_PASS` env vars, serve `api/` with PHP 8.1+, and add a login plus privacy notice before saving user data.

## Assumptions to review
Flights use ~90 kg CO2e per flight hour; one tree absorbs ~21 kg CO2/year; badge cut-offs are 2.3 / 3.5 / 4.7 t per year. Change them in js/enhancements.js.
