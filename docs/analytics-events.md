# Analytics events (GA4) — naming plan

Owner batch 2, Phase C. Analytics is **consent-gated and default OFF**: nothing loads
until a real `NEXT_PUBLIC_GA_ID` is set **and** the reader grants consent
(`components/analytics/GATag.tsx`, `lib/analytics/consent.ts`). With
`NEXT_PUBLIC_CONSENT_BANNER` unset the banner never shows and no analytics fires.

## Rules
- Event names: `snake_case`, a `nav_`/`form_`/`page_` prefix by area, stable once shipped.
- Parameters are lowercase `snake_case`. Never send PII (no email/phone/name) — the
  contact/report forms send content only; analytics never reads those fields.
- `send_page_view: false` on config; `page_view` is emitted by the app on route change
  so the path is controlled (query strings are NOT sent).

## Events
| Event | Fires when | Params |
|---|---|---|
| `page_view` | route change (GATag) | `page_path` |
| `nav_open` | a mega-menu pillar panel opens | `nav_pillar`, `nav_source` (desktop/mobile) |
| `nav_category_hover` | a category in the panel is hovered | `nav_pillar`, `nav_category`, `nav_source` |
| `nav_exam_click` | an exam link in the panel is clicked | `nav_pillar`, `nav_category`, `nav_exam`, `nav_source` |
| `nav_search` | a search is submitted from the panel | `nav_pillar`, `nav_search_query`, `nav_source` |
| `nav_view_all` | "view all" in a panel section | `nav_pillar`, `nav_category`, `nav_source` |
| `nav_close` | a pillar panel closes | `nav_pillar`, `nav_source` |
| `consent_granted` / `consent_denied` | reader decides in the banner | — |
| `report_error_submit` | a report-an-error sheet is sent | `page_path` (no message text) |

The `nav_*` emitters already exist in `components/navigation/useNavAnalytics.ts`; they
call `window.gtag` only when it is present, so they are inert until analytics loads.

## Not collected
- No cookies are set for analytics (localStorage holds only the consent choice).
- No AdSense is enabled (publisher id is still a placeholder; no AdSense script loads).
- Free-text from forms/notices is never sent as an analytics parameter.
