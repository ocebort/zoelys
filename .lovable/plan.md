## Goal

1. You (admin) maintain a list of **Zoélys-approved petsitters**.
2. When a pet owner submits the **Get Matched** form, it's saved as a request.
3. An **algorithm scores every approved sitter** against the request and proposes the top 3 matches — so you can review and confirm in under 24h.

---

## 1. Database

Two new tables in Lovable Cloud.

**`petsitters`** — your approved sitter directory (admin-managed)
- name, email, phone, photo
- bio, languages, neighborhoods (array)
- services offered (home visit / overnight / daycare / walking)
- animals accepted (dog / cat / etc.)
- size capacity (small / medium / large / xl)
- experience level, years experience
- has outdoor space, accepts other pets, accepts children
- handles medical needs, handles aggressive pets, handles anxious pets
- gender, hourly rate, daily rate
- max simultaneous bookings
- status: `pending` / `approved` / `paused`
- internal admin notes

**`match_requests`** — every Get Matched submission
- owner contact info + everything from the 7-step form (stored as structured columns + a `raw` JSONB for anything extra)
- status: `new` / `matched` / `completed` / `cancelled`
- matched_sitter_id (once confirmed)
- admin notes
- `submitted_at` + 24h deadline timestamp

RLS: owners can see only their own request; admins can see all. Petsitters table is admin-only.

---

## 2. Matching algorithm

Server function `scoreMatches(requestId)` returns top sitters with a score 0–100 and reasons.

**Hard filters** (sitter is excluded if it fails):
- Not `approved`
- Doesn't service the animal type
- Doesn't offer the requested service
- Can't handle the pet's size

**Scoring** (weighted, 100 total):
- Neighborhood match: **25 pts**
- Service offered matches all requested services: **15 pts**
- Experience level meets/exceeds requested: **15 pts**
- Handles medical conditions (if pet has them): **10 pts**
- Handles temperament (anxious / aggressive): **10 pts**
- Has outdoor space if requested: **5 pts**
- Gender preference match: **5 pts**
- Language match: **5 pts**
- Accepts other pets / children if relevant: **5 pts**
- Within budget hint (if provided): **5 pts**

Returns the top 3 with breakdown of why each scored what it did.

---

## 3. Wire the Get Matched form

Currently the form just shows "Thank you" — nothing is saved. After this:
- Submit calls a server function that validates with Zod and inserts a `match_request` row
- 24h deadline is auto-set
- Confirmation page shows real request ID

Form stays public (no signup required) but if the user is logged in we link the request to their profile.

---

## 4. Admin pages

Two new pages under `/admin/`:

**`/admin/petsitters`** — directory management
- Table of all sitters with status filter
- "Add sitter" form with every field above
- Edit / pause / approve / delete
- Photo upload

**`/admin/requests`** — incoming match requests
- List of all requests, sorted by deadline (soonest first), with a colored badge if deadline is near
- Click a request → detail page showing:
  - Full pet owner submission
  - **"Find matches" button** → runs the algorithm, shows top 3 sitters side-by-side with scores and reason breakdown
  - "Confirm match" button on each → marks request as `matched`, records the sitter

---

## 5. Out of scope (ask before adding)
- Automatic email to the owner with the proposed sitter (would need email setup)
- Sitter-facing portal (sitters logging in themselves)
- Payments / booking flow

Want me to add either of those after the core is working?

---

## Technical Details

- Tables created via migration with proper grants + RLS scoped to `auth.uid()` for owners, and `has_role(_, 'admin')` for admin access
- `match_requests` table fed by a new `submitMatchRequest` server function (public — no auth required, RLS allows anon insert)
- `scoreMatches` server function: admin-gated, uses `supabaseAdmin` to read all sitters, runs scoring in JS, returns ranked list
- Matching logic in `src/lib/matching.ts` (pure function, easy to test/tweak weights later)
- Admin pages under `src/routes/_authenticated/admin.petsitters.tsx` and `admin.requests.tsx` (already protected by your admin gate pattern)
- Form submission keeps the multi-step UI; only the final "Send My Request" button changes to call the server fn
