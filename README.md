# 🐾 Zoélys — Luxury Pet Concierge & Algorithmic Matchmaking Platform
> **Thesis Project & Technical Artifact** | *MSc / Undergraduate Thesis Project (2026)*  
> **Author:** Océane Bort-Aponte  
> **Live Production Environment:** [zoelys.ocebort.workers.dev](https://zoelys.ocebort.workers.dev)  
> **Repository:** [github.com/ocebort/zoelys](https://github.com/ocebort/zoelys)

---

## 📖 Executive Summary
Zoélys is a high-touch, data-driven pet concierge platform designed to bridge pet owners with vetted, specialized pet sitters. The project addresses friction in traditional peer-to-peer pet care platforms by introducing a **7-stage quantitative matchmaking algorithm** that ranks sitters based on medical requirements, behavioral traits, geographical proximity, and accommodation compatibility.

---

## 📌 Master Execution Checklist & Progress Tracker

### Phase 1: Client Intake & Frontend Infrastructure
- [x] High-impact static routes (`/`, `/how-it-works`, `/journal`, `/map`, `/events`, `/partners`, `/join`)
- [x] Multi-step interactive client intake form (`/get-matched`)
- [x] Dynamic tag pills & behavioral trait selection
- [x] Auto-redirect handler for legacy paths (`/find-a-sitter` → `/get-matched`)

### Phase 2: Database Architecture & Match Engine
- [x] PostgreSQL database schema setup on Supabase (`client_requests`, `sitters`)
- [x] Row Level Security (RLS) configuration for public insert policies
- [x] Real-time client intake pipeline via Supabase JS SDK
- [x] Weighted scoring function `match_sitters_for_request(request_id)`

### Phase 3: Concierge Operations & Administrative Portal *(CURRENT)*
- [x] Real-time Concierge Admin Dashboard (`/admin`)
- [x] One-click matchmaking trigger interface
- [x] Dynamic candidate ranking cards with contextual justification tags
- [ ] Route authentication lock / PIN protection on `/admin`
- [ ] Automated email notification trigger via Resend API when requests arrive

### Phase 4: Network Expansion & Platform Integrations
- [ ] Sitter onboarding intake form (`/apply`)
- [ ] Connect **The Map** (`/map`) to dynamic database locations
- [ ] Connect **Events** (`/events`) to dynamic meetup tables in Supabase
- [ ] Client proposal generator (emailing top 3 matched sitter cards)

---

## 🛠️ System Architecture & Stack
* **Frontend & Edge Hosting:** HTML5, CSS3 Custom Variables, Vanilla JS on **Cloudflare Workers/Pages** (Zero cold-start edge distribution).
* **Database & Persistence Layer:** **Supabase (PostgreSQL)** utilizing Row Level Security (RLS) for data privacy.
* **Matchmaking Engine:** Custom PL/pgSQL function (`match_sitters_for_request`) executing multi-criteria weighted scoring inside the database engine.
* **CI/CD Pipeline:** Automated deployment via GitHub Webhooks with custom build flags (`SKIP_DEPENDENCY_INSTALL=true`).

---

## 🔬 Algorithmic Matchmaking Specification

The core matchmaking logic evaluates incoming client requests against active sitter profiles on a 100-point weighted scale:

$$\text{Match Score} = S_{\text{type}} + S_{\text{geo}} + S_{\text{medical}} + S_{\text{space}} + S_{\text{exp}}$$

| Dimension | Max Points | Evaluation Criteria |
| :--- | :---: | :--- |
| **Pet Type Fit ($S_{\text{type}}$)** | 25 pts | Verifies sitter accepts species (Dog, Cat, etc.) |
| **Geographical Proximity ($S_{\text{geo}}$)** | 25 pts | Exact neighbourhood match vs. regional proximity |
| **Special Care / Medical ($S_{\text{medical}}$)** | 20 pts | Evaluates vet tech certification, anxiety handling, medication |
| **Outdoor Accommodation ($S_{\text{space}}$)** | 15 pts | Matches backyard requirements against sitter property traits |
| **Experience Level ($S_{\text{exp}}$)** | 15 pts | Aligns client preference (Senior Sitter, Vet Tech) |

---

## 📄 Database Schema Reference

```sql
-- Client Intake Schema
CREATE TABLE client_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  neighbourhood TEXT,
  pet_type TEXT,
  pet_name TEXT,
  behavioral_traits TEXT[],
  medical_conditions TEXT,
  exercise_needs TEXT,
  service_type TEXT,
  start_date DATE,
  end_date DATE
);

-- Sitter Profile Schema
CREATE TABLE sitters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  neighbourhood TEXT,
  experience_years INT DEFAULT 1,
  vet_tech_background BOOLEAN DEFAULT false,
  accepted_pet_types TEXT[],
  can_handle_anxiety BOOLEAN DEFAULT true,
  can_handle_medication BOOLEAN DEFAULT false,
  has_outdoor_space BOOLEAN DEFAULT false,
  nightly_rate_usd NUMERIC(6,2),
  is_active BOOLEAN DEFAULT true
);
