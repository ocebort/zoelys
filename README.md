# Zoélys — Thesis Development Notes

> Complete technical and design documentation of everything built for the **Zoélys Concierge Care** platform (`https://zoelys.ocebort.workers.dev`).
> These notes are written to support an academic thesis describing the design, architecture, implementation, and evaluation of the project.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Objectives & Research Questions](#2-objectives--research-questions)
3. [System Architecture](#3-system-architecture)
4. [Technology Stack & Rationale](#4-technology-stack--rationale)
5. [Design System: "Quiet Luxury"](#5-design-system-quiet-luxury)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Page Inventory](#7-page-inventory)
8. [Backend API Layer](#8-backend-api-layer)
9. [Database Schema](#9-database-schema)
10. [Authentication, Roles & Authorization](#10-authentication-roles--authorization)
11. [Member Portal & Super-Admin Dashboard](#11-member-portal--super-admin-dashboard)
12. [Content Management System (CMS)](#12-content-management-system-cms)
13. [Automated Social Media Post Generation](#13-automated-social-media-post-generation)
14. [Interactive Pet-Friendly Map](#14-interactive-pet-friendly-map)
15. [Matchmaking Algorithm](#15-matchmaking-algorithm)
16. [Testing Approach](#16-testing-approach)
17. [Deployment & Version Control Workflow](#17-deployment--version-control-workflow)
18. [Security Considerations](#18-security-considerations)
19. [Legal & Compliance Considerations](#19-legal--compliance-considerations)
20. [Challenges Encountered & Resolutions](#20-challenges-encountered--resolutions)
21. [Evaluation & Limitations](#21-evaluation--limitations)
22. [Future Work](#22-future-work)
23. [Appendix A — Full Commit Log](#appendix-a--full-commit-log)
24. [Appendix B — API Endpoint Reference](#appendix-b--api-endpoint-reference)
25. [Thesis Research Plan — Field Lab Workproject](#thesis-research-plan--field-lab-workproject)

---

## 1. Project Overview

**Zoélys Concierge Care** is a serverless, full-stack luxury pet matchmaking and concierge management platform. It connects discerning pet owners with vetted, high-end pet caregivers through a real-time, multi-parameter compatibility engine executed directly at the edge.

The system originated as a prototype in **Lovable** (an AI-assisted web app builder) and was migrated to run **100% natively on Cloudflare's global edge network** — Cloudflare Workers (serverless compute) and Cloudflare D1 (distributed SQLite). The frontend is hand-built with vanilla HTML/CSS/JavaScript (zero external UI framework).

### The brand promise
> *"Pets aren't a side note — they're family. We treat them that way."*

The product is positioned as **premium** and **quietly luxurious**, serving the Miami high-end pet market. Every design and engineering decision in this project supports that positioning.

### Key product surfaces
| Surface | Purpose |
|---|---|
| `/` (landing) | Marketing page communicating the brand |
| `/join` | Choose-your-path + unified auth (sign in / register / reset) |
| `/get-matched` | 7-step pet owner intake questionnaire |
| `/apply` | Sitter application & onboarding (writes to live roster) |
| `/how-it-works` | Explains the 4-step concierge process |
| `/events` | Member events & gatherings (CMS-driven) |
| `/partners` | Member-exclusive partner perks (CMS-driven) |
| `/journal` | Editorial blog (CMS-driven) |
| `/map` | Interactive pet-friendly places map |
| `/dashboard` | Member portal + Super-Admin command center |
| `/admin` | Passcode-protected matchmaking dashboard |
| `/find-a-sitter` | Legacy informational page |

---

## 2. Objectives & Research Questions

The thesis project set out to answer (and build) the following:

1. **Can a premium consumer marketplace be built entirely on serverless edge infrastructure?** — Yes; validated by Cloudflare Workers + D1 powering dynamic content, auth, and CMS with zero traditional servers.
2. **Can a single frontend engineer maintain a multi-page brand site without a build pipeline?** — Yes; validated through a dependency-free vanilla architecture with a shared design system in one CSS file and a single injected navbar.
3. **Can a non-technical operator manage live site content without code commits?** — Yes; validated by the Super-Admin CMS that writes directly to D1.
4. **How should premium positioning influence design?** — Investigated through the "quiet luxury" design system (see §5).
5. **How do you responsibly handle the legal & compliance surface of a pet-care marketplace?** — Documented in §19.

---

## 3. System Architecture

```
                          ┌──────────────────────────────────────┐
                          │        CLOUDFLARE WORKERS GIT        │
                          │      INTEGRATION (auto-deploy)       │
                          └──────────────┬───────────────────────┘
                                         │ git push origin main
                                         ▼
                ┌──────────────────────────────────────────────┐
                │           CLOUDFLARE WORKER (edge)           │
                │               src/index.js                   │
                │                                              │
                │   ┌─────────────┐   ┌──────────────────┐     │
                │   │  Static     │   │   JSON API       │     │
                │   │  Assets     │   │  /api/* handlers │     │
                │   │  (public/)  │   └──────┬───────────┘     │
                │   └─────────────┘          │                 │
                └────────────────────────────┼─────────────────┘
                                             ▼
                                ┌────────────────────────┐
                                │  CLOUDFLARE D1 (D1)    │
                                │  zoelys-db             │
                                │  SQLite at the edge    │
                                │  (tables: users, pets, │
                                │   sitters, requests,   │
                                │   events, partners,    │
                                │   posts)               │
                                └────────────────────────┘
```

### Request flow
1. Client requests any route (e.g., `GET /journal` or `GET /api/events`).
2. The Worker first checks its **route table** of `method + pathname` API handlers.
3. If matched → it executes D1 SQL and returns JSON with CORS + no-store headers.
4. If not matched → it falls back to `env.ASSETS.fetch(request)`, serving the matching file from the `public/` static assets directory, with `Cache-Control: no-store` applied.

### Key architectural decisions
- **Edge-native everything** — the entire dynamic layer (auth, CMS, matchmaking) runs in the worker at the PoP closest to the user; there is no origin server.
- **No build step** — pages ship as static HTML; dynamic behavior is vanilla JS fetching the JSON API. This keeps deploy latency near-zero and avoids a CI pipeline entirely.
- **Static-first, API-enhanced** — marketing pages are pure static; feature pages (events, partners, journal, map) hydrate from the API.

---

## 4. Technology Stack & Rationale

| Layer | Technology | Rationale |
|---|---|---|
| Compute | **Cloudflare Workers** (V8 isolates) | Serverless edge runtime; global low latency; free-tier friendly; git-based deploys |
| Database | **Cloudflare D1** (SQLite) | Distributed SQLite with a SQL API; zero ops; transactional for this workload size |
| Hosting | Cloudflare Static Assets (Workers binding `ASSETS`) | Single deployment unit for HTML/CSS/JS + worker code |
| Frontend | **Vanilla HTML/CSS/JS** | Zero framework overhead; full control over the premium aesthetic; no build step |
| Typography | **Cormorant Garamond** (serif) + **Inter** (sans), via Google Fonts | Serif = editorial luxury; sans = modern readability |
| Map | **Google Maps JavaScript API + Places API** | Rich POI data for pet-friendly places; custom-styled |
| Package manager | **bun** (with node_modules + wrangler for tooling) | Fast JS runtime; used for local syntax/type checks and wrangler dev |
| VCS / deploy | **GitHub + Cloudflare Workers Git Integration** | `git push origin main` triggers automatic deploy |
| Cloud keys | Supabase (publishable), Google Maps (browser key), via `.env` | Client-side safe keys (publishable/restricted) |

### Why not a traditional stack?
A typical React + Node + Postgres stack would have required a server, a build pipeline, and higher operational cost. The chosen stack:
- Deploys by **pushing to git** (zero infrastructure knowledge needed to ship)
- Keeps **monthly cost near $0** within free tiers
- Eliminates **server management** entirely

---

## 5. Design System: "Quiet Luxury"

The visual identity is the project's most deliberate design investment. The design language is defined by restraint, warmth, and editorial craft — a deliberate contrast to loud "tech" aesthetics.

### 5.1 Design tokens (`public/style.css`, `:root`)

| Token | Value | Role |
|---|---|---|
| `--bg-cream` | `#F5F1E9` | Primary page background (warm cream) |
| `--bg-cream-soft` | `#FBF9F4` | Card / raised surface |
| `--ink` | `#191512` | Primary text / dark surfaces |
| `--ink-muted` | `#6E675F` | Secondary text |
| `--accent` | `#C1623F` | Terracotta accent (brand color) |
| `--accent-deep` | `#A94E2F` | Accent hover / deep variant |
| `--hairline` | `#E5DED2` | 1px borders (the "hairline" language) |
| `--ease` | `cubic-bezier(...)` | Motion easing |

Legacy aliases are maintained (e.g., `--accent-coral`, `--card-white`, `--text-dark`) so pages migrated incrementally without visual breakage — an example of **progressive design-system adoption**.

### 5.2 Brand language
- **Paw print mark** — a custom paw logo (`assets/logo-paw.png`) used as favicon and brand lockup; a light variant for dark footers.
- **Typography** — Cormorant Garamond for headlines (weight 300–500, letter-spacing -0.015em) and Inter for UI/body.
- **Surfaces** — cards use `--bg-cream-soft` with hairline borders and soft shadows (`0 26px 48px -28px rgba(25,21,18,0.2)`), never harsh drops.
- **Buttons** — pill-shaped, uppercase, letter-spaced (`.btn-join-pill`, `.btn-coral`, `.btn-rsvp`).
- **Eyebrows** — small uppercase letter-spaced labels (`0.25em`) in accent color above headlines.
- **Emoji-free policy** — all UI copy was scrubbed of emojis to protect the premium tone; typographic marks (—, •, ★, &bull;) are used instead.
- **Language** — copy uses refined, calm phrasing ("Quiet letters, real care. No spam, ever.").

### 5.3 Shared components
- **`.page-head`** — a unified page header (centered eyebrow + serif H1 + muted description), used by all interior pages, delivering consistency.
- **`.master-navbar`** — sticky navbar injected by `navbar.js`: brand paw lockup, centered nav links, and a right-side "Member Portal" pill.
- **`footer.master-footer`** — 4-column footer (brand, Explore, Zoélys, Stay Close) present on every page.

---

## 6. Frontend Architecture

### 6.1 Static-first pages
Every page is a standalone HTML file under `public/<route>/index.html`. The Worker's static assets handler maps `/route` → `/route/index.html` automatically (folder routing enforced project-wide).

### 6.2 `navbar.js` — the shared navigation injection
A single script (loaded last on every page) locates the `<header>` placeholder, replaces it with the unified `.master-navbar`, and **injects `style.css`** if the page hasn't linked it. This delivers:
- One source of truth for navigation markup
- Global styling consistency across all pages
- A simple migration path for legacy pages

### 6.3 Progressive migration
The redesign was rolled out **commit-by-commit** (see §20) — old pages kept working with local `:root` fallback variables while they were gradually moved onto the shared system. This "strangler pattern" let the whole site be re-skinned without a big-bang rewrite.

---

## 7. Page Inventory

### `/` — Landing page
The marketing hero. Intentionally retains a designed hero block (`hero-title`) rather than the shared `.page-head`, because a marketing homepage needs a larger statement. Includes master navbar + footer, brand copy, and CTA into `/join`.

### `/join` — Path selection + unified auth
- **Path selection**: two cards — *Pet Owner Intake* and *Caregiver Application*.
- **Unified auth modal**: Sign In / Register / Reset Password in one flow, driven by the `/api/auth/*` endpoints.
- Registration role determines ID prefix (`usr-` owner vs `sit-` sitter) and starting credit balance.

### `/get-matched` — 7-step intake questionnaire
A multi-step form with chip selectors and a progress header, capturing:
1. About You (name, email, phone, neighbourhood)
2. Your Pet (species, breed, name, age, weight, sex, temperament, house-training, behavioural traits)
3. Health & Care (conditions, vaccinations, diet, allergies, meals, exercise, sleeping)
4. Service Needed (home visit, overnight, daycare, walking, dates, recurrence)
5. Sitter Preferences (experience, outdoor space, other pets, children, gender)
6. Budget & Experience
7. Final Details & Consent

### `/apply` — Sitter onboarding
Collects experience, vet-tech certification, accepted species, anxiety/medication handling, outdoor space, and nightly rates. **Writes directly to the `sitters` table** (live matchmaking pool) via the register API path.

### `/how-it-works`
Explains the 4-step concierge process (Discover → Match → Care → Reassure). Originally a dark "ink" hero block; later unified onto `.page-head` for consistency.

### `/events` & `/partners` — CMS-driven listing pages
Both fetch live from D1 (`GET /api/events`, `GET /api/partners`) and render category-filterable card grids. Publishing happens in the dashboard CMS (see §12).

### `/journal` — CMS-driven editorial blog
- `journal/index.html` fetches `GET /api/posts`, renders a **featured article** + a **grid** with real piece counts.
- `journal/article.html` is a **single reader page** that renders any post by `?slug=` (title, meta, hero image, formatted body).
- Legacy static articles live under `journal/articles/` (kept for historical continuity; superseded by the CMS).

### `/map` — Interactive pet-friendly map
See §14.

### `/dashboard` — Member Portal + Super-Admin
See §11.

### `/admin` — Passcode matchmaking console
PIN-protected (`2026`) dashboard that loads client requests and runs the matchmaking engine (§15).

---

## 8. Backend API Layer

The API lives entirely in `src/index.js` inside the Worker. All responses are JSON with:
```js
{
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
}
```
`OPTIONS` preflight is handled for CORS. Full endpoint table in [Appendix B](#appendix-b--api-endpoint-reference).

### Error handling pattern
Auth handlers use `try/catch` with meaningful status codes (400/401/500). Content-management writes intentionally use `.catch(() => {})` — a pragmatic tradeoff that keeps UI simple; documented as a limitation in §21.

---

## 9. Database Schema

Database: `zoelys-db` (D1), defined across `schema.sql` and runtime `CREATE TABLE IF NOT EXISTS` bootstraps.

### Tables
| Table | Purpose | Key columns |
|---|---|---|
| `client_requests` | Pet owner intake submissions | `full_name, email, neighbourhood, pet_type, breed, service_type, start_date, end_date, ...` |
| `sitters` | Caregiver roster (matchmaking pool) | `full_name, neighbourhood, experience_years, vet_tech_background, accepted_pet_types, can_handle_anxiety, can_handle_medication, has_outdoor_space, nightly_rate_usd, is_active` |
| `users` | Platform accounts + subscription | `email, password_hash, full_name, subscription_tier, credit_balance` |
| `pets` | Per-user pet dossiers | `pet_name, species, breed, medical_needs` |
| `events` | Member events (CMS) | `title, category, date, location, image_url, sponsor, description` |
| `partners` | Partner perks (CMS) | `name, category, perk, image_url, website_url, description` |
| `posts` | Journal articles (CMS) | `title, slug (UNIQUE), category, author, publish_date, read_time, excerpt, image_url, content, featured` |

### Self-healing bootstrap
The `posts` table is **auto-created and auto-seeded** by the Worker (`ensurePosts`) on the first API call — `CREATE TABLE IF NOT EXISTS` then `INSERT OR IGNORE` of 3 starter articles if empty. This removed the need for manual remote migrations and is idempotent across isolates.

---

## 10. Authentication, Roles & Authorization

### Authentication
Plain email/password registration & login (`/api/auth/register`, `/api/auth/login`). **Note:** stored as `password_hash` column but currently plaintext-compared — documented as a security limitation (§18) with bcrypt migration listed as future work.

### Roles
| Role | Detection | Capabilities |
|---|---|---|
| **Pet Parent (owner)** | ID prefix `usr-` | Member portal (profile, pets, credits, perks) |
| **Pet Sitter** | ID prefix `sit-` or tier `Vetted Sitter` | Sitter hub |
| **Super-Admin** | **Hard-locked to `ocebort@gmail.com`** | Full dashboard + CMS + matchmaking |

### The hard-lock rule
```js
const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;
```
This single-email hard-lock (enforced in register, login, and profile endpoints, and in the client UI) prevents anyone else from reaching the admin view. Documented as an intentional security stance.

---

## 11. Member Portal & Super-Admin Dashboard

`/dashboard` is the most complex page. It supports two role-based views plus a Super-Admin overlay.

### Member view
- Profile card (name, email, tier, credit balance)
- **Multi-pet dossier** (Pet Care Manuals)
- **Medical alerts**
- **Subscription tier manager**
- **Trusted sitter circle**
- **Perks vault**
- Sitter history / subscription ledger
- Logout + forced sign-in when no session exists

### Super-Admin "Command Center"
A separate `#adminMasterView` revealed only for `ocebort@gmail.com`:
- **Live D1 metrics** (real-time stats grid)
- **Tabs**: Match Requests Inbox · Sitter Pipeline · Member CRM · **CMS & Events**
- **Match Inbox**: client requests with RUN MATCH button → invokes the matchmaking engine and shows scored, ranked sitters
- **Sitter Pipeline**: active roster management
- **Member CRM**: user records

### Design of the admin view
The admin UI uses distinct `.admin-nav`, `.admin-tab`, `.panel`, `.admin-row` styles (dark navbar override for the portal) so it reads as a professional internal tool while staying on-brand.

### Restoration history (important thesis note)
At one point the dashboard was rebuilt as a "Pet Sitter Operational Hub" (commit `766c505`), removing the full admin dashboard. The complete Super-Admin view was later **restored from an earlier commit** (`6c8db3d`) rather than rewritten — a real-world example of using version control as the safety net for feature regression. (See §20, "The vanished dashboard".)

---

## 12. Content Management System (CMS)

The Super-Admin "CMS & Events" tab lets a non-technical operator publish live content with **no code changes and no redeploy** — data flows dashboard → D1 → public pages.

### Publishers (three forms)
1. **Publish Luxury Event** — title, category, sponsor, start/end date + time pickers, venue, cover image URL, description.
2. **Publish Luxury Partner Perk** — name, category, booking link, perk headline, image, description.
3. **Publish Journal Post** — title, category, author, date, read time, cover, excerpt, article content, "feature this post" flag.

### Article content mini-format
The journal content field supports a simple plain-text markup, escaped on render to prevent XSS:
- Blank line → new `<p>`
- Line starting `## ` → `<h2>` subheading
- Line starting `> ` → `<blockquote>` pull quote

### Active Content Tracker & Manager
Live lists of published Events, Partners, and Posts with one-click **Delete** (DELETE API calls), refreshed after every publish.

### Live propagation
Publishing inserts into D1; the public `/events`, `/partners`, and `/journal` pages simply refetch the GET endpoints — so new content is live **immediately across the site**.

---

## 13. Automated Social Media Post Generation

When the admin publishes an event, partner, or journal post, the dashboard automatically generates **copy-paste captions** for two platforms and shows them in a modal (`#socialModal`):

- **Instagram caption** — event details, CTA, and hashtags (`#ZoelysConcierge #MiamiPets #LuxuryPetCare #<Category>`)
- **LinkedIn post** — longer-form professional announcement with the same details

Each textarea has a **Copy** button (clipboard API). This was built as a time-saving concierge feature so the operator can cross-post to social channels in seconds, and it doubles as a content-marketing accelerator.

---

## 14. Interactive Pet-Friendly Map

The Map page (`/map`) is a full interactive implementation using the **Google Maps JavaScript API** with the **Places library**.

### Features
- **Geolocation**: requests the user's position via `navigator.geolocation`; falls back to **Miami center** (25.7617, -80.1918) if denied or unavailable (brand's home market).
- **Seven filterable categories**, each with a Places type + keyword search:
  - Parks & Dog Runs (`park` + "dog park")
  - Pet-Friendly Cafés (`cafe` + "pet friendly")
  - Pet-Friendly Restaurants (`restaurant` + "dog friendly")
  - Groomers (`pet_store` + "dog grooming")
  - Pet Stores (`pet_store`)
  - Veterinarians (`veterinary_care` + "24 hour")
  - Daycare & Boarding (`pet_store` + "dog daycare")
- **Keyword-fallback strategy**: if a keyword search returns zero results, it retries with type-only search.
- **Custom map styling** — a hand-authored quiet-luxury palette (cream geometry, muted water, terracotta accents) matching the brand.
- **Custom markers** — category-tinted paw pins (SVG data URIs) + a dark "You are here" marker.
- **Info windows** — name, rating, review count, open-now status, photo.
- **Results sidebar** — click a result to pan/zoom + open its info window.
- **Re-search on move** — dragging the map beyond a threshold re-queries the Places API around the new center.

### API key constraints
The Google key is **HTTP-referer restricted** — it works in browsers only from whitelisted origins. The deployed domain (`https://zoelys.ocebort.workers.dev`) and `localhost` must be added to the key's *Website restrictions* in Google Cloud Console, with **Maps JavaScript API + Places API enabled and billing configured** (free $200/month credit covers ~10k map loads + ~10k Places calls).

### Free-tier alternative (documented)
A keyless alternative was proposed: **Google My Maps** (hand-curated map embedded via iframe, zero API/billing) or **Leaflet + OpenStreetMap** tiles with Overpass POI queries. These trade automated POI discovery for zero cost/setup.

---

## 15. Matchmaking Algorithm

The RUN MATCH action in the admin executes a **100-point weighted compatibility engine** in the worker, scoring every active sitter against a client request:

| Category | Max | Logic |
|---|---|---|
| Species Compatibility | 25 | Sitter's `accepted_pet_types` includes client's `pet_type` |
| Location Proximity | 20 | 20 pts exact neighbourhood match; 10 pts regional base |
| Medical & Anxiety Care | 25 | +15 if pet needs meds & sitter handles meds; +10 if sitter handles separation anxiety |
| Outdoor Accommodation | 15 | 15 pts if pet needs outdoor space & sitter has fenced yard; 10 baseline |
| Sitter Qualifications | 15 | 15 Certified Vet Tech; 12 five+ years; 8 baseline |
| **Total** | **100** | Hard-capped; sorted descending with tag breakdowns |

This is a transparent, explainable model — a deliberate contrast to black-box ML matching — appropriate for a thesis discussing **rule-based scoring systems**.

---

## 16. Testing Approach

Because the stack is worker + static assets with no CI, testing is performed through three methods:

1. **Static serve + HTTP smoke tests** — a local static server (`python3 -m http.server`) plus `curl` checks that every route returns 200 and contains expected markers (forms, IDs, scripts).
2. **JavaScript syntax validation** — inline `<script>` blocks are extracted and parsed with `bun build` (parse-only, no execution) to catch syntax errors; runtime browser globals (`document`, `window`) are filtered from expected noise.
3. **Worker API harness with a mock D1** — a bun script imports the real worker `fetch`, stubs `env.zoelys_db` with an in-memory SQL emulation, and asserts the full lifecycle: seeding, CRUD, slugify, delete-by-id, delete-by-slug, and missing-record handling. This gives **end-to-end API confidence without a live D1**.
4. **Emoji/quality audits** — regex scans across pages to enforce the emoji-free brand policy.

---

## 17. Deployment & Version Control Workflow

### The deploy loop
```
edit → git add → git commit → git push origin main → Cloudflare Workers
      Git Integration detects push → builds → deploys automatically
```
There is **no separate deploy step** and **no environment promotion** — production follows `main`.

### Git hygiene
- One logical change per commit with descriptive messages (see Appendix A).
- Work-in-progress and experimental edits are checked locally before committing.
- The full history serves as a live thesis artifact: each commit documents a design decision.

### Local tooling
- `bun` (1.3.x) for fast script execution and syntax checks.
- `python3` for HTTP smoke tests and content audits.
- `wrangler` present for local dev (requires `node`, not installed in this environment; remote deploy is via git, not wrangler auth).

---

## 18. Security Considerations

### Implemented
- **CORS** with preflight handling.
- **Hard-locked admin** to a single email (see §10).
- **Passcode-gated `/admin`** matchmaking console.
- **HTML escaping** on all rendered CMS content (journal bodies, list items) to prevent stored XSS.
- **Cache-control no-store** on all API responses (prevents stale/stale-auth content).

### Known limitations (documented honestly)
- `password_hash` is currently compared in plaintext — **must migrate to bcrypt/Argon2 hashing** before real use.
- No rate limiting on auth endpoints (brute-force risk) — add Turnstile/captcha + throttling.
- Admin gating is client-visible logic plus a server-side email check; a production version should add **server-side session tokens** (e.g., JWT in HttpOnly cookies) rather than relying on client state + email equality.
- `Access-Control-Allow-Origin: *` is appropriate for a public read API but should be tightened for admin writes in production.
- The Google Maps browser key is publishable by design (restricted by referer), but its whitelist must be managed.

---

## 19. Legal & Compliance Considerations

This section was researched as part of the thesis to understand the operational legal surface of a pet-care marketplace.

### 19.1 Insurance
Two exposure layers exist: the **platform** and each **sitter**.
- **General Liability** — third-party injuries at a sitter's home.
- **Care, Custody & Control (CCC)** — *the* pet-sitting coverage (pet injury/loss while in care); excluded from standard GL policies, so it is a mandatory add-on.
- **Professional Liability** — negligence (e.g., medication errors).
- **Bonding** — theft by staff/sitters.
- **Workers' Compensation** — only if employees are hired.
- **Commercial Auto** — if sitters transport pets (personal policies exclude business use).
- **Umbrella** — excess coverage.

Recommended launch posture: platform corporate GL + require every sitter to carry **$1M GL + CCC** before approval, with proof of coverage captured in onboarding.

### 19.1.1 Trust & Safety framework (public charter at `/trust`)
The compliance posture above is productized as a visible five-stage authorization pipeline:
1. **Application & screening** — written application, interview, identity + background check.
2. **Certification review** — recognized credentials verified at the source (CPPS — Certified Professional Pet Sitter, pet first aid/CPR, vet tech licensure). Respected, never sufficient alone.
3. **Practical assessment** — hands-on handling evaluation (calm presence, anxious-animal signals, medication handling).
4. **Insurance verification** — proof of active professional pet-sitting liability insurance required *before* approval; re-verified periodically.
5. **"Zoélys Authorized Caregiver" status** — badge issued; ongoing oversight and periodic re-verification.

Two-layer coverage model: every sitter carries their own professional policy (protecting their business), and Zoélys carries its own platform-level commercial liability — responsibility is never displaced onto the sitter ("the sitter is responsible" is not a defense). Future revenue stream: partner with a licensed insurer to offer optional **pet insurance / booking protection** at checkout as a premium add-on and referral stream.

### 19.2 Entity & licensing
- Form a **Florida LLC** to separate personal and business liability.
- **EIN** from the IRS (payments to sitters, income reporting).
- **Miami-Dade County Business Tax Receipt** + Florida Dept. of Revenue registration (verify sales-tax applicability to services).
- Check **zoning** for at-home boarding.

### 19.3 Worker classification (highest-risk area)
Misclassifying sitters as independent contractors when they are functionally employees triggers wage, tax, and fine exposure. Florida's **ABC test**:
- (A) sitter is free from the platform's control;
- (B) work is outside the platform's usual business;
- (C) sitter is independently established.
Written **Independent Contractor Agreements** and an onboarding model ("accepted into roster") rather than employment keeps the model defensible.

### 19.4 Contracts & waivers
- Independent Contractor Agreement (sitters)
- Client Service Agreement (scope of care, emergency vet authorization, health disclosure)
- Liability waiver / release
- Terms of Service + Privacy Policy on the site

### 19.5 Animal liability
- **Fla. Stat. § 767.04** (dog bite statute) imposes liability on the owner and, in some cases, the person in control — so bites during a walk can implicate both owner and sitter.
- **Miami-Dade ordinances**: breed-related rules (historical), pet licensing, leash laws.
- Require **vaccination proof** (rabies) before service.

### 19.6 Data privacy
Client personal data (name, address, phone, pet health) triggers privacy obligations: **CCPA/CPRA** (California residents), **GDPR** (EU), and Florida's **Digital Bill of Rights (FDBR)**. Baseline: collect minimum data, publish a Privacy Policy, obtain consent.

---

## 20. Challenges Encountered & Resolutions

| # | Challenge | Resolution |
|---|---|---|
| 1 | Legacy Lovable/duplicate HTML scattered in root | `8148252` enforced folder routing (`/route/index.html`) and deleted duplicates; `ca9ccc2` removed zip/Supabase leftovers |
| 2 | Navbar inconsistencies across pages | `navbar.js` single-injection script + `style.css` master styles (`ba61d4f`) |
| 3 | Intake form regressed to non-interactive state | Restored exact 7-step form with chip selectors (`26b588f`) |
| 4 | How It Works anchor didn't scroll on first click | Cross-page anchor fix (`18b67d1`) |
| 5 | **The vanished dashboard** — a rebuild (`766c505`) dropped the full admin dashboard | Restored from commit `6c8db3d` (`b107600`); CMS publish forms later restored from `985e104` (`b161c5d`) — version control as safety net |
| 6 | Member Portal pill mis-centering | Scoped selector `.nav-right .btn-join-pill` to defeat `.nav-right a` padding override (`27607dc`) |
| 7 | Dark "brown rectangle" hero on how-it-works felt unpolished | Replaced with shared `.page-head` component; dashboard banners restyled dark→light (`3a08682`) |
| 8 | Google Maps key is referer-restricted (browser-only) | Documented console whitelist steps; offered free My Maps/Leaflet alternative |
| 9 | CMS publish forms missing after dashboard restore | Reconstructed from original commit + verified API field parity |
| 10 | Journal was static (couldn't update without code) | Full posts CMS: D1 table auto-bootstrap + CRUD API + dashboard publisher + dynamic reader page |
| 11 | Emoji pollution vs premium tone | Global emoji scrub + automated regex audits |
| 12 | Duplicate slugs on republish | Documented; unique-slug enforcement + suffix strategy listed as future work |

---

## 21. Evaluation & Limitations

### What the architecture demonstrably achieves
- **Zero-server full-stack product** — auth, CMS, matchmaking, dynamic listings all edge-native.
- **Non-technical content operations** — publishing events, partners, and journal posts requires no code.
- **Consistent premium brand** across 12+ surfaces.
- **Live marketing pipeline** — every publish auto-generates IG + LinkedIn copy.

### Honest limitations
1. **Security maturity** — plaintext password comparison, client-trusted admin detection, no rate limiting, broad CORS. Acceptable for a thesis/demo; unacceptable for production without the §18 remediation list.
2. **SQL error swallowing** — CMS writes `.catch(() => {})`; a failed insert could report success. Should inspect results and surface errors.
3. **Single-admin email hard-lock** — fine for a solo operator; needs a proper role/permission model for growth.
4. **Places API dependency** — requires billing-enabled Google key and referer whitelist maintenance.
5. **No media upload** — cover images are URLs only (Unsplash, etc.); no storage integration.
6. **No edit operation in CMS** — posts/events/partners are delete-and-republish only (PUT exists for some content per `f2e22a3` but not wired for all).
7. **No automated CI** — testing relies on local harnesses; a thesis could extend this to GitHub Actions running the mock-D1 suite on every push.

---

## 22. Future Work

- [ ] **Password hashing (bcrypt/Argon2)** + server-side session tokens (HttpOnly JWT/cookies)
- [ ] **Rate limiting / Cloudflare Turnstile** on auth endpoints
- [ ] **Edit forms** in the CMS (update existing posts/events/partners)
- [ ] **Duplicate-slug handling** (auto-suffix `-2`, `-3`, …)
- [ ] **Media upload** (Cloudflare R2) for images instead of external URLs
- [ ] **Image/OG meta generation** for social sharing cards
- [ ] **Map**: geolocation-request UX polish; save favorites; directions links
- [ ] **My Maps free-tier fallback** for zero-billing operation
- [ ] **GitHub Actions CI** running the mock-D1 test harness on push
- [ ] **Email notifications** for new requests / publishes (Cloudflare Email Workers or Resend)
- [ ] **Member payments** (Stripe) for credit top-ups
- [ ] **Production legal pack** per §19 (contracts, waivers, privacy policy)

---

## Thesis Research Plan — Field Lab Workproject

**Course:** Startup Entrepreneurial Project — Field Lab (Pre-Experience Masters, Fall/Spring)
**Advisors:** Prof. João Castro & Carla Portela — Haddad Center for Entrepreneurship, Nova SBE
**Student:** Océane Bort · Master in Business Analytics
**Deliverable:** 25-page individual thesis (unlimited appendix), submitted 13 December 2026 via Turnitin after advisor approval. Draft due mid-November. Defense in January (online): 10-min presentation + 20-min discussion with appointed discussant — no script, no reading.
**Venture under study:** Zoélys (this platform) — live product used as a research instrument.

### T1. Research framework

**Thesis title:** *Evaluating and Designing a High-Trust Managed Platform for Premium Pet Care*

**Main research question**
> How can a managed digital platform govern service quality and mitigate information asymmetry to capture and sustain the premium pet care segment better than open gig marketplaces?

**Sub-questions:** SRQ1 trust signals & vetting (what they cost/worth); SRQ2 willingness-to-pay & pricing (tiered subscription, credits); SRQ3 scalable governance & leakage prevention (retention, backups, moral hazard).

**Theoretical framework (four pillars):** Akerlof (1970) adverse selection / "lemons"; Spence (1973) signaling; Arrow (1963) & Eisenhardt (1989) agency theory & moral hazard; Hagiu & Wright (2015) two-sided platforms & Zervas et al. (2021) rating inflation / disintermediation.

**Methodological stance:** mixed-methods triangulation (macro review-mining, micro survey N=43, qualitative interviews); hypothesis log; every chapter closes with an explicit "so what" for the platform.

### T2. Thesis structure (workshop format — 25 pages individual + unlimited appendix; draft `docs/thesis-draft.md`)

The thesis follows a five-chapter structure:

1. **Introduction & practical motivation** — macro context ($150B+ industry, pet humanization), the problem statement (open-directory failure: safety risk, information asymmetry, scroll fatigue), main RQ + 3 sub-RQs, Zoélys introduced as applied case study.
2. **Literature review & theoretical framework** — Akerlof (lemons), Spence (signaling), Arrow/Eisenhardt (agency & moral hazard), Hagiu-Wright/Zervas (platform economics, rating inflation, leakage) → synthesis.
3. **Empirical market diagnostics (mixed methods)** — computational review mining (macro: rating inflation, complaint themes), survey N=43 + interviews (micro: verified safety, scroll fatigue, pain points), willingness-to-pay & pricing analysis.
4. **The Zoélys managed platform model** — 4.1 zero-scroll concierge workflow (intake → rule-based matching → curated shortlist); 4.2 five-stage vetting (identity audit, CPPS/NAPPS-aligned certification, video interview, practical assessment, supervised trial); 4.3 retention & leakage prevention (living pet dossiers, Emergency Backup Sitter Protocol, zero-deductible institutional insurance + 24/7 tele-vet).
5. **Strategic implications, limitations, conclusion** — feasibility/scalability (serverless stack), managerial & academic contributions, limitations & future research.

The platform build implements Chapter 4 directly: the intake → `/api/match` journey is 4.1, the `/trust` charter documents 4.2, and dashboard/dossier features support 4.3.

**Interview ethics (workshop notes):** ask interviewees for permission to (a) be named, (b) mention their company if relevant, (c) record + transcribe; conduct in English; transcribe with software — typos are acceptable.

### T3. Execution calendar (fixed dates from workshop)

| Phase | Due | Milestones |
|---|---|---|
| Now | — | Write Topic, Pertinence, Literature Review, Void (drafters — no data needed) |
| This week | — | Launch Miami scrape; draft interview guide + eConsent form; start recruiter outreach |
| Late Oct | — | Complete scrape + dataset codebook; finish lit review draft |
| Early Nov | — | Run interviews; field Van Westendorp + conjoint; launch live A/B variants |
| **Mid November** | **Draft** | Complete full 25-page draft, all sections filled with results |
| Before submit | — | Advisor approval (do NOT submit without it), Turnitin check |
| **13 December** | **Submit** | Final submission via Turnitin — non-negotiable deadline |
| January | Defense | Online; 10-min presentation + 20-min discussion with discussant — no script |

### T4. Scope decisions (documented trims)

| Original ambition | Trimmed to | Rationale |
|---|---|---|
| 4-market scrape replication (NYC/LA/Chicago) | Miami only | Page/time budget; depth over breadth |
| Full scale development (EFA+CFA, n≥200) | Candidate dimensions from interviews + PSM | Scale validation is a journal-scale task |
| Hand-rolled hierarchical Bayes conjoint estimation | Standard tool (Conjoint.ly/Sawtooth) | Reliability + time |
| Separate prototype build for C4 | Experiments on live production site | Zero marginal infra cost; unique methodological advantage |

---

## Appendix A — Full Commit Log

```
f37642b Add journal CMS: publish and manage blog posts from the admin dashboard
061878f Generate Instagram and LinkedIn posts for published events and partners
6b95cc3 Build live interactive pet-friendly map with Places API
b161c5d Add event and partner publisher forms to CMS tab in admin dashboard
b107600 Restore full super-admin dashboard on the member portal
3a08682 Unify page headers with shared quiet-luxury page-head component
27607dc Fix Member Portal pill vertical centering in navbar
4992ac3 Roll out quiet-luxury design system and paw-print branding across all pages
6326ff1 Redesign landing page with quiet-luxury premium design system; rebuild master navbar and shared styles
a85eb91 Add /api/health endpoint
766c505 Completely rebuild public/dashboard/index.html with explicit Pet Sitter Operational Hub for Marcus
0d262c3 Fix vetting authorization ID field display when Pet Sitter role is selected on join page
6614899 Deploy comprehensive Pet Parent Hub with multi-pet dossier, medical alerts, subscription tier manager, trusted sitter circle, and perks vault
6c8db3d Hard-lock Admin panel strictly to ocebort@gmail.com and force all other users to Pet Parent Member View
025f292 Hard-lock Super-Admin portal strictly to ocebort@gmail.com email check
f2e22a3 Equalize CMS card heights, add Edit buttons for Events & Partners, and enable PUT API endpoints
985e104 Completely rebuild API backend, executive dashboard inbox/tables, events page with category filters, and partners page with perk filters
f67c57a Add interactive start/end date & time pickers for event publisher with auto-generated Instagram & LinkedIn captions
2f72d20 Direct overwrite of public/dashboard/index.html with full rich CMS fields for Events and Partners
d96afaf Deploy Executive Admin Command Center with Match Inbox, Sitter Pipeline, Member CRM, and CMS controls
ee92213 Implement single MEMBER PORTAL navbar button with unified Sign In, Register, and Reset Password flow
4379dee Ensure ocebort@gmail.com unlocks Super-Admin Concierge Dashboard and D1 CMS controls
ca9ccc2 Clean up legacy Lovable config, Supabase folders, zip archives, and duplicate root HTML
d9bf5b5 Standardize navbar font-weight and dimensions on /how-it-works page
8148252 Clean up duplicate HTML files, enforce folder routing, and lock unified static navbar across all pages
18b67d1 Fix cross-page anchor scrolling so HOW IT WORKS scrolls directly on first click
ba61d4f Unify global master styling in style.css and restore multi-step questionnaire
26b588f Restore exact 7-step intake form with chip selectors and matching progress titles
433818d Center navbar on /get-matched to perfectly align with homepage layout
5832ea8 Add Admin detection for ocebort@gmail.com with real-time D1 stats and live CMS publishing
a939c1a Replace public/dashboard.html with updated luxury dashboard layout
8593300 Deploy upgraded Member Concierge Portal with Pet Care Manuals, Sitter History, and Subscription Ledger
2ef672e Add LOG OUT button and force Sign In modal when no session exists
b48fb24 Create public /dashboard route with Register and Log In modal
3bc7a9e Point SIGN IN and Owner onboarding buttons on /join directly to /dashboard
5ed9dcf Seed events database table and deploy API backend handlers
e48691a Deploy dynamic /events and /partners pages pulling directly from Cloudflare D1
26e9565 Update detailed documentation for Cloudflare Workers & D1 platform
03f38f2 Fix routing and links for /join page
e62c35c Connect /join choose your path page to /get-matched and /apply forms
```

## Appendix B — API Endpoint Reference

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check (`{ ok, service, time }`) |
| POST | `/api/auth/register` | Create account (owner/sitter); returns `is_admin` |
| POST | `/api/auth/login` | Authenticate; returns user + role + `is_admin` |
| GET | `/api/user/profile?userId=` | Fetch user profile (with graceful fallback) |
| POST | `/api/user/pet-manual` | Add a pet dossier |
| POST | `/api/user/add-credits` | Increment credit balance |
| GET | `/api/events` | List all events (newest first) |
| POST | `/api/events` | Publish an event |
| DELETE | `/api/events/:id` | Remove an event |
| GET | `/api/partners` | List all partners |
| POST | `/api/partners` | Publish a partner |
| DELETE | `/api/partners/:id` | Remove a partner |
| GET | `/api/posts` | List all journal posts |
| GET | `/api/posts/:slug` | Fetch a single post |
| POST | `/api/posts` | Publish a journal post (auto-slugified) |
| DELETE | `/api/posts/:id` | Remove a journal post (by id or slug) |

---

*Document generated from the complete working history of the Zoélys repository. For thesis use: cite the GitHub repository, commit hashes in Appendix A, and the live deployment at `https://zoelys.ocebort.workers.dev`.*
