# 🐾 Zoélys Concierge Care — Edge-Powered Luxury Pet Matchmaking Platform

**Zoélys Concierge Care** is a serverless, full-stack luxury pet matchmaking and concierge management platform. Originally conceptualized and prototyped in Lovable, the entire backend infrastructure, API layer, and database architecture have been migrated to run **100% natively on Cloudflare’s global edge network (Cloudflare Workers & Cloudflare D1)**.

The system connects discerning pet owners with vetted, high-end pet caregivers through a real-time, multi-parameter, 100-point compatibility engine executed directly at the edge.

---

## 🌟 Key Capabilities & User Flows

1. **Path Selection Portal (`/join`)**
   * Luxury dual-card landing experience allowing users to choose their path: **Pet Owner Intake** or **Caregiver Application**.
2. **7-Step Interactive Pet Intake Form (`/get-matched`)**
   * Multi-step questionnaire collecting detailed client specifications:
     * **Step 1: About You** (Full Name, Email, Phone, Primary Neighbourhood)
     * **Step 2: Your Pet** (Species, Breed, Pet Name, Age, Weight, Sex, Temperament, House-training, Multi-select Behavioral Traits)
     * **Step 3: Health & Care** (Medical Conditions, Vaccination Status, Parasite Prevention, Diet Type, Allergies, Meals/Day, Exercise Needs, Sleeping Arrangements)
     * **Step 4: Service Needed** (Home Visit, Overnight Stay, Day Care, Dog Walking, Dates, Recurring Need, Hours/Day)
     * **Step 5: Sitter Preferences** (Experience Level, Outdoor Space Requirements, Other Pets Allowed, Children, Sitter Gender Preference)
     * **Step 6: Budget & Experience** (Previous Pet Sitter Experience, Quote Transparency Notice)
     * **Step 7: Final Details & Consent** (Referral Source, Custom Care Notes, Consent Agreement)
3. **Sitter Application & Onboarding Portal (`/apply`)**
   * Onboarding interface for new prospective sitters to apply and register on the Zoélys roster.
   * Collects experience duration, certified vet tech qualifications, accepted pet species, behavioral anxiety handling, medication capabilities, private outdoor space availability, and custom nightly rates.
   * Direct write access to Cloudflare D1 database (`sitters` table), instantly adding new applicants to the live matchmaking pool.
4. **Secured Concierge Admin Dashboard (`/admin`)**
   * Passcode-protected interface (`PIN: 2026`) with session persistence.
   * Fetches incoming client requests from D1, converting UTC storage timestamps into browser-local time format.
   * Single-click **`RUN MATCH`** button triggering real-time weighted scoring for any selected client request against all active sitters in D1.

---

## 🏛️ System Architecture

* **Frontend:** HTML5, CSS3 Custom Properties, Vanilla JavaScript (Zero external UI framework overhead).
* **Edge Runtime:** Cloudflare Workers (V8 Serverless Environment).
* **Database:** Cloudflare D1 (Distributed Serverless SQLite at the Edge).
* **Routing & Assets:** `wrangler.jsonc` configured with Cloudflare Static Assets (`env.ASSETS`).

---

## 📐 Matchmaking Algorithm (100-Point Weighted Matrix)

When **`RUN MATCH`** is invoked on the Admin Dashboard, the Worker script loads the target client request alongside all active sitters from Cloudflare D1, evaluating each sitter against a **100-point scoring model**:

| Category | Max Score | Condition / Evaluation Logic |
| :--- | :---: | :--- |
| **1. Species Compatibility** | **25 pts** | Sitter's `accepted_pet_types` includes client's requested `pet_type`. |
| **2. Location Proximity** | **20 pts** | **20 pts** if exact neighbourhood match (e.g., Brickell); **10 pts** regional base credit. |
| **3. Medical & Anxiety Care** | **25 pts** | **+15 pts** if pet requires medication and sitter handles meds; **+10 pts** if sitter handles separation anxiety. |
| **4. Outdoor Accommodation** | **15 pts** | **15 pts** if pet requires private outdoor space and sitter has fenced yard; **10 pts** baseline. |
| **5. Sitter Qualifications** | **15 pts** | **15 pts** for Certified Vet Tech background; **12 pts** for 5+ years experience; **8 pts** baseline. |
| **Total Max Score** | **100%** | Hard capped at 100%. Scores are sorted descending with natural language tag breakdowns. |

---

## 🗄️ Database Schema (`schema.sql`)

### 1. `client_requests` Table
```sql
CREATE TABLE IF NOT EXISTS client_requests (
  id TEXT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  neighbourhood TEXT,
  pet_type TEXT,
  pet_name TEXT,
  breed TEXT,
  behavioral_traits TEXT,
  medical_conditions TEXT,
  exercise_needs TEXT,
  service_type TEXT,
  start_date TEXT,
  end_date TEXT,
  outdoor_space TEXT,
  experience_level TEXT
);
