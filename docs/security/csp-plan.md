# CSP plan — inventory, options, and a report-only proposal

**Owner batch 6, Phase W4. This plan ENFORCES NOTHING.** No header was changed, no directive was
added or removed, and no rollout was started. The current policy in `next.config.ts` stays exactly
as it is until the owner says otherwise. Everything below is measured, not assumed: each claim
names the command, file:line or page that produced it (2026-11-06).

---

## 1. What the live site sends today

`node .git/v-csp-raw.mjs` reads `res.rawHeaders`, which is the only place duplicate headers stay
separate — `fetch()` merges them and makes one header look like two (that trap is documented in
`docs/status/backlog-refresh-2026-11.md` V3a). Result on `/` and on `/sarkari-naukri`:

```
Content-Security-Policy HEADER LINES: 2
  [1] default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com
      https://pagead2.googlesyndication.com https://partner.googleadservices.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      font-src 'self' https://fonts.gstatic.com;
      img-src 'self' data: https://*.supabase.co https://images.unsplash.com;
      connect-src 'self' https://*.supabase.co https://www.googletagmanager.com
      https://www.google-analytics.com;
      frame-src https://www.googletagmanager.com https://td.doubleclick.net;
      frame-ancestors 'none'; base-uri 'self'; form-action 'self'
  [2] upgrade-insecure-requests
```

Line 1 is built in `next.config.ts:42-53` and attached at `:93` for `/(.*)`.
Line 2 is **not from this repository**: `git grep upgrade-insecure-requests` across the frontend
hits only documents, never code. It comes from the hosting layer.

**Why that matters before anything else:** two `Content-Security-Policy` headers are both enforced
and the browser applies the **intersection**. So (a) the site is already more constrained than
line 1 alone suggests, and (b) loosening line 1 later will not loosen line 2 — a directive change
that "does nothing" is most likely being overridden by the host line. Stage 0 of the rollout is
finding out where line 2 is set, because a plan that ignores it will be debugging a policy it
cannot see.

`X-Frame-Options: SAMEORIGIN` (`next.config.ts:89`) is also sent alongside
`frame-ancestors 'none'`; browsers apply the stricter of the two, so `frame-ancestors 'none'`
wins and the header is redundant rather than wrong.

---

## 2. The observed inventory (what the pages really use)

`node .git/w4-csp-inventory.mjs` classifies every inline `<script>` and every external origin in
the served HTML of three live pages:

| page | inline scripts | external origins in the HTML | self-hosted refs |
|---|---|---|---|
| `/` (678 KB html) | 51 × `self.__next_f.push(...)` (RSC flight payload), 2 × `application/ld+json` | `googletagmanager.com` ×1; `whatsapp.com` ×2, `t.me` ×2, `youtube.com` ×2, `facebook.com` ×1 (share links, `<a href>`) | 12 `/_next/` scripts, 1 CSS link, **0** `/_next/image`, 0 inline `style=""` |
| `/sarkari-naukri/banking/ibps-clerk` (267 KB) | 58 × flight payload, 4 × JSON-LD | same, plus `ibps.in` ×6 (the official site links) | 14 scripts, 1 CSS, 0 `/_next/image`, 5 inline `style=""` |
| `/blog/exam-prep/clat-2026-preparation-strategy` (223 KB) | 37 × flight payload, 5 × JSON-LD | same pattern + `twitter.com`, `linkedin.com`, `wa.me` | 15 scripts, 1 CSS, 0 `/_next/image`, 6 inline `style=""` |

Read alongside the code:

* **No Supabase Realtime.** `git grep` for `.channel(`, `realtime`, `wss://` in `lib`, `services`,
  `components`, `app` → no hits. So `connect-src` does not need a `wss:` source today.
* **GA4 is consent-gated and lazy.** `components/analytics/GATag.tsx` loads `gtag.js` through
  `next/script` with `strategy="afterInteractive"` and only when a real `GA_ID` is configured
  *and* the reader has granted consent (`lib/analytics/consent.ts`, custom event
  `iei-consent-change`). Before a choice, nothing is fetched.
* **AdSense is allowed by the CSP but cannot run.** `components/ads/AdSlot.tsx:76-79` pushes
  `(window.adsbygoogle = window.adsbygoogle || []).push({})` with the comment "AdSense script
  must already be in layout" — and `git grep` for `adsbygoogle.js` / `pagead/js` across the repo
  returns **0 matches**. Nothing ever loads the AdSense tag. The publisher id also defaults to
  the placeholder `"ca-pub-XXXXXXXXXX"` (`AdSlot.tsx:84`), which `README.md:203` already lists as
  an unset item.
* **Images are barely used.** 0 files import `next/image`; 2 raw `<img>` tags exist in
  `components`/`app`; the probe found 0 `/_next/image` requests on three pages. `unsplash` appears
  only in `next.config.ts:47` (CSP) and `:77` (a `remotePatterns` entry), never in code.
* **Inline `style=""` attributes are used** (5-6 per content page, from the probe). They are
  covered by `style-src 'unsafe-inline'`; a nonce/hash for styles would break them unless
  `style-src-attr 'unsafe-inline'` is kept separately.
* **JSON-LD is not a CSP problem.** The 2-5 `application/ld+json` blocks per page are data blocks,
  which browsers do not execute, so `script-src` does not gate them. (If a `type` were ever
  omitted, the same content would become an executable inline script — worth remembering when
  touching `components/seo/JsonLd.tsx`.)

### Directive-by-directive verdict

| directive | allowance | evidence | verdict |
|---|---|---|---|
| `script-src` | `'self'` | 12-15 `/_next/` script refs per page | needed |
| | `'unsafe-inline'` | 37-58 flight-payload inline scripts per page | **needed today** — see §3 for why a nonce is not a free swap |
| | `googletagmanager.com` | consent-gated `GATag.tsx` | needed when analytics is on |
| | `pagead2.googlesyndication.com`, `partner.googleadservices.com` | no AdSense loader exists in the repo | **dead today**, needed only if the AdSense gap above is fixed |
| `style-src` | `'self'` + `'unsafe-inline'` | 1 CSS link; 5-6 inline `style=""` | needed (Tailwind/Next CSS + style attributes) |
| | `fonts.googleapis.com` | fonts are self-hosted since batch 5 (`0679898`, `next/font/local`) | **dead — remove** |
| `font-src` | `'self'` | `/_next/static/media/*.woff2` | needed |
| | `fonts.gstatic.com` | same | **dead — remove** |
| `img-src` | `'self' data:` | inline SVG data URIs | needed |
| | `*.supabase.co` | DB-stored media URLs in `<img>` | keep until the media columns are audited |
| | `images.unsplash.com` | 0 code references | **dead — remove** (also drop the `remotePatterns` entry, `next.config.ts:77`) |
| `connect-src` | `'self'` | same-origin routes (`/api/search`, `/api/og`, `/api/feed`) | needed |
| | `*.supabase.co` | REST + auth reads | needed |
| | `googletagmanager.com`, `google-analytics.com` | GA4 measurement flow | needed when analytics is on |
| | (no `wss:`) | no realtime usage | correctly absent |
| `frame-src` | `googletagmanager.com` | consent-gated | needed when analytics is on |
| | `td.doubleclick.net` | AdSense, which cannot run | **dead today** |
| `frame-ancestors 'none'` | | clickjacking | keep; it is stricter than the `X-Frame-Options: SAMEORIGIN` also sent |
| `base-uri 'self'`, `form-action 'self'` | | | keep as they are |
| separate host line | `upgrade-insecure-requests` | not from this repo | reconcile — see Stage 0 |

---

## 3. Nonce versus hash on Next 15.5.28 — the mechanism, from the installed package

Next does support a nonce, and it reads it **out of the CSP header itself**.
`node_modules/next/dist/server/app-render/get-script-nonce-from-header.js`:

```js
const CSP_NONCE_SOURCE_REGEX = /^'nonce-([A-Za-z0-9+/_-]+={0,2})'$/;
function getScriptNonceFromHeader(cspHeaderValue) {
    const directives = cspHeaderValue.split(';').map((directive) => directive.trim());
    // First try to find the directive for the 'script-src', otherwise try to
    // fallback to the 'default-src'.
    const directive = directives.find((dir) => dir.startsWith('script-src'))
                   || directives.find((dir) => dir.startsWith('default-src'));
    if (!directive) return;
    // If no directive could be found, then we're done.
    for (const source of directive.split(/\s+/).slice(1)) {
        const match = source.trim().match(CSP_NONCE_SOURCE_REGEX);
        if (match) return match[1];
    }
}
```

So the framework will pick `'nonce-…'` from `script-src` (falling back to `default-src`), ignore a
malformed one rather than failing the request, and apply it to its own inline scripts.

**Why `next.config.ts headers()` cannot do it.** That function returns a *static* string baked at
build time. A nonce must be random per response, so the only in-app place that can produce one is
`middleware.ts` (which runs on every request and can set the header before rendering). That is a
real option, not a config tweak.

**The catch that decides the whole question.** This site is overwhelmingly **statically generated
or ISR-cached** — the build output marks pages `(Static)`/`(SSG)` with revalidate windows, and the
flight-payload scripts counted above are *inside that cached HTML*. A nonce is fixed when the page
is rendered, so a per-request nonce will not match the nonce baked into a cached document, and
hydration breaks on exactly the pages that matter most. Options that survive that constraint:

| option | works with cached HTML? | maintenance cost | note |
|---|---|---|---|
| keep `'unsafe-inline'` (status quo) | yes | none | what every Next ISR site ships with |
| nonce via middleware | **only for dynamically rendered pages** | high | would need the cache disabled or the policy varied per route |
| hashes of inline scripts | no | **impractical here** | 37-58 flight scripts per page, contents change with every data edit and every build; JSON-LD blocks are not executable so they need no hash at all |
| `'unsafe-inline'` + `'strict-dynamic'` | yes where a nonce/hash exists, otherwise ignored | medium | `strict-dynamic` only relaxes *loaded* scripts once a nonce/hash is present; with plain `'unsafe-inline'` it changes nothing |

**Recommendation:** do not chase a script nonce on this architecture. The honest, cheap wins are
deleting the three dead allowances (`fonts.googleapis.com`, `fonts.gstatic.com`,
`images.unsplash.com`) and deciding whether AdSense is a real feature — because right now the CSP
permits an ad stack the code cannot load.

---

## 4. The report-only proposal (no report endpoint, as instructed)

One header, added next to the existing one in `next.config.ts:87-95`. **Not applied in this batch.**

```
Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data: https://*.supabase.co; connect-src 'self' https://*.supabase.co https://www.googletagmanager.com https://www.google-analytics.com; frame-src https://www.googletagmanager.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

Differences from the enforced policy, all justified by §2: no `pagead2`/`partner.googleadservices`
(nothing loads them), no `td.doubleclick.net` (same), no `fonts.googleapis.com`/`fonts.gstatic.com`
(fonts are self-hosted since batch 5), no `images.unsplash.com` (0 code references).

**There is deliberately no `report-to` or `report-uri`.** Consequences, stated plainly:

* violations appear in the browser **console only**, for a person looking at a page;
* nothing is collected centrally, so there is no violation count and no background signal — the
  evidence for this stage is a recorded list of console observations, not a dashboard;
* a violation on a page nobody opens is invisible. That is why the verification list below is
  explicit, and why the stage is time-boxed rather than "watch and wait".

Verification list — open each with DevTools' Console visible, and record anything that mentions
`Content Security Policy`:

```
/                                        /results
/sarkari-naukri/ssc/ssc-cgl              /blog/exam-prep/clat-2026-preparation-strategy
/sarkari-naukri/banking/ibps-clerk       /board-exam/state/up-board/up-board-class-10
/admission/engineering/jee-main          /sarkari-naukri/state-government-jobs
/search (then run a search)              a page with a consent decision accepted (GA path)
```

The last two matter most: `/api/search` results are rendered client-side, and GA only loads after
consent, so a policy that is clean on nine pages can still break the tenth interaction.

---

## 5. Rollout plan

**Stage 0 — reconcile the host line (before anything else).** Establish where the second
`Content-Security-Policy: upgrade-insecure-requests` header is set (hosting layer, not this repo),
and either fold `upgrade-insecure-requests` into the app's single policy or remove the host's.
Until then the effective policy is an intersection that no file in this repository describes, and
any later "the CSP change did nothing" investigation will be chasing that.

**Stage 1 — report-only, time-boxed (2 weeks).** Ship the §4 header. Nothing is blocked; the
console observations for the ten URLs are recorded in this file. If a needed source shows up as a
violation, it goes into the policy before Stage 2 — that is the only purpose of this stage.

**Stage 2 — enforce, in one deliberate step.** Replace `Content-Security-Policy-Report-Only` with
`Content-Security-Policy` using the Stage-1-validated value. Keep `'unsafe-inline'` on
`script-src` and `style-src` for the reasons in §3. Roll back by deleting the header (the report
only line can stay if it is useful). Then verify with the same ten URLs plus
`node qa/parity/crawl-hygiene.mjs` for the site-wide check.

**Stage 3 — only if the architecture changes.** A nonce becomes worth building once the pages that
need it are dynamically rendered. Concretely: middleware generates a per-request nonce, the header
carries `'nonce-<value>'` in `script-src`, and the routes served from the static/ISR cache keep
`'unsafe-inline'`. That per-route policy split is the work; it is not a config flag, and it is not
worth doing while the site is ~all prerendered.

**Stage 4 — the ad question, separately.** If AdSense is meant to work, `AdSlot.tsx` needs the
loader (`https://pagead2.googlesyndication.com/tag/js/gpt.js`-style script or the classic
`adsbygoogle.js`) plus a real `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID`; the CSP allowances then stop
being dead and move from "permitted" to "used". If it is not meant to work, remove the allowances
*and* the placeholder path in `AdSlot.tsx:84` so the code stops implying a feature that is off.

---

## 6. What this plan does not touch

No enforcement. No header change. No middleware. No dependency. Nothing here alters
`next.config.ts`; the file still carries the policy quoted in §1 verbatim
(`next.config.ts:42-53`, attached at `:93`).
