# Nova Creatives website

This is a static, bilingual site. Every page has a generated HTML document, so navigation and reading do not depend on JavaScript. Browser interactions use a small script; there is no framework dependency.

## Editing

- Edit `content.json` for service descriptions, concept projects, article text and business configuration. English and Dari content live together. `en` / `fa` fields and two-element arrays use English first, Dari second.
- Site-wide copy, navigation, form labels, validation copy and page templates are paired in `build.py` and `dist/app.js`. Use the adjacent English/Dari pairs when revising translations.
- `dist/style.css` contains the theme variables, responsive layout and motion rules. The supplied logo is `dist/assets/nova-logo.png`.
- Team and testimonials are empty structured arrays in `content.json`. Only add real, approved entries. Each team entry uses `name`, `role`, `bio`, `portrait`, with localized two-element arrays for text. Each testimonial uses `quote`, `name`, `role`, `verified: true` and `permission: true`.
- Set the verified business email, phone, location, hours and social URLs before launch. Leave unavailable details empty rather than inventing them.
- Run `python build.py`, then `python check.py` and `node --check dist/app.js`. The bundled Python/Node runtime can be used when they are not on PATH.
- Start the content studio from the project folder with `python admin_server.py`, then open `http://localhost:8001/en/admin/`. Use its sections to edit business/contact details, services, projects, articles, team, testimonials and brand colors. Project covers and team portraits accept PNG, JPG, WebP or GIF images up to 8 MB. **Publish changes** validates `content.json`, saves it in the project root and rebuilds the site; drafts can also be saved locally in the browser. The publishing server binds to this computer only and must be running for the Publish button to work.
- The content studio manages structured content. Page layouts, navigation, shared site copy, FAQ and legal-page templates remain in `build.py`.
- Preview without the content studio: `python -m http.server 4781 --bind 127.0.0.1 --directory dist`.

## Inquiry integration

`business.formEndpoint` is intentionally empty. The form shows a setup state and never pretends to send. Connect a trusted HTTPS endpoint that accepts JSON POST requests and returns `{ "accepted": true }` with a successful HTTP status only after durable acceptance. A generic 200 page does not count as successful delivery. The endpoint should validate inputs again, enforce rate limits, handle spam, avoid exposing secrets and define retention. Test delivery to the actual inbox before enabling it.

No analytics, newsletter, login, payment or tracking integration is enabled. Fonts are self-hosted in dist/assets/fonts. No external font request is needed. Local storage contains only language and theme preferences.

## Content review before public launch

1. Approve the agency description, mission, service scope and English/Dari copy.
2. Add verified team profiles and actual contact/social details.
3. Replace concept art with approved client work when available; retain clear concept labels until then. The photography/video examples are digital art direction and storyboards, not completed client shoots or films.
4. Approve or remove draft articles. They intentionally have no invented author or publication date.
5. Obtain permission before adding client quotes; do not treat the empty testimonial area as an endorsement.
6. Have the privacy and terms drafts reviewed for the real business, providers and operating jurisdiction.
7. Configure and test inquiry delivery, confirm the production origin, then verify the sitemap, language alternate links and social previews.
8. Test real devices, assistive technology and a native Dari editorial review before a public release. Browser checks do not constitute a complete WCAG certification.

## Publication

Sites identity lives in `.openai/hosting.json`. Reuse it for updates. The site is owner-private by default. Publish source updates through the Sites skill workflow; do not create another Site for the same checkout.

## Confirmed brand direction

The user-shared conversation confirms Primary Blue #273D8E, Accent Turquoise #21CCC3, White #FFFFFF and Deep Ink #17233F. The official light/dark colour logo lockups are used without recolouring. Graphic design is the current focus; web design is an expanding practice. Other service capabilities must be confirmed per project. Dari/English communication serves the Afghanistan-focused audience; Instagram and Facebook are the initial content platforms. No account URLs or contact information were supplied. Internal team and Drive arrangements are not published on the website.

Source: https://chatgpt.com/share/6ae714b7-052c-83e8-8281-c132abd5f314?ogimg=plain

Dari typography uses the user-supplied Abar Mid OTF fonts, self-hosted under `dist/assets/fonts/abar/`: Regular 400, SemiBold 600, Bold 700, ExtraBold 800 and Black 900. English typography is unchanged.

## Updated positioning

The user has superseded the earlier graphic-design-first direction. Website and software development are now primary; branding and graphic design remain complementary or standalone creative services. Services are ordered accordingly. Flowdesk is a fictional software-interface concept, not a shipped application.
