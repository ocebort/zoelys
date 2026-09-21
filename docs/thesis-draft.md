# Evaluating and Designing a High-Trust Managed Platform for Premium Pet Care

**Océane Bort · Master in Business Analytics · Nova School of Business and Economics · 2026**

*Working draft v0.2 — empirical placeholders [DATA] to be completed from collected data (review mining, N=43 survey, interviews).*

---

## Chapter 1 — Introduction & Practical Motivation

### 1.1 Background & macro context

The U.S. pet industry has grown into an annual expenditure above USD 150 billion, with services representing the fastest-growing category. Expenditure on boarding, sitting, grooming, and specialized care has outpaced food and supplies for several consecutive years (American Pet Products Association, 2024). Driving this growth is a structural shift in ownership — the "pet humanization" trend. Surveys consistently report that the large majority of owners (97% in recent industry studies) regard their pets as family members rather than property. Companion animals now receive birthdays, dietary plans, and medical regimes once reserved for children.

This shift has two economic consequences relevant to this thesis. First, it elevates the *stakes* of pet care: an owner delegating the care of a family member is delegating emotional, medical, and legal responsibility, not just a chore. Second, it raises *willingness to pay*: consumers who treat pets as family are willing to spend substantially more on quality care — but only if they can believe the quality claim.

### 1.2 The problem statement

Digital pet care has, to date, failed to capture this willingness to pay. The legacy model — open gig platforms such as Rover and Wag — operates as an unvetted, open directory: any individual can list a profile, set a price, and accumulate reviews. The academic literature (Chapters 2 and 3) predicts and the empirical data confirms that this model produces, simultaneously:

- **Severe safety and reliability risk.** Without meaningful verification, quality claims are unverifiable and the downside is borne by the owner and the pet.
- **Information asymmetry.** Buyers cannot observe sitter quality before purchase; sellers cannot credibly prove it.
- **"Scroll fatigue" and choice overload.** A high-income owner seeking one trusted caregiver is instead presented with hundreds of undifferentiated profiles and asked to self-filter — a task that transfers the platform's curation burden to the consumer.

The practical symptom is paradoxical: demand for high-touch, personalized service (private house-sitting, overnight boarding, specialized drop-in care) is surging, yet no credible premium tier has formed.

### 1.3 Research void & main research question

**Main research question:** How can a managed digital platform govern service quality and mitigate information asymmetry to capture and sustain the premium pet care segment better than open gig marketplaces?

**Sub-research questions**

| Sub-RQ | Focus |
|---|---|
| SRQ1 | Which trust signals and vetting mechanisms most credibly communicate quality, and how much are they worth? |
| SRQ2 | What pricing model (tiered subscription, credit-based) captures willingness to pay for guaranteed peace of mind? |
| SRQ3 | What governance and retention mechanisms prevent quality decay and platform leakage at scale? |

### 1.4 Practical motivation: Zoélys as an applied case study

The thesis is not a purely observational study. **Zoélys**, a managed concierge for premium pet care in Miami, was designed, built, and deployed during this research as the applied embodiment of the theoretical argument. Zoélys operationalizes a lean, managed "zero-scroll" concierge model that replaces open peer-to-peer browsing with:

- a **granular behavioral intake profiling** journey (separation anxiety, leash reactivity, health routines, service needs);
- a **rigorous five-stage vetting protocol** (Chapter 4.2) governing who enters the roster;
- **institutional retention safeguards** (living pet dossiers, emergency backup protocol, zero-deductible liability insurance, 24/7 tele-vet) designed to mitigate moral hazard and make off-platform leakage financially irrational (Chapter 4.3).

The platform thereby functions as a *research instrument*: every design decision in Chapter 4 corresponds to a theoretical mechanism in Chapter 2, allowing the thesis to move from abstraction to a working artifact.

---

## Chapter 2 — Literature Review & Theoretical Framework

The theoretical framework is built from four pillars, each supplying a mechanism that the empirical chapters and the applied model draw upon.

### 2.1 Information asymmetry & adverse selection (Akerlof, 1970)

Akerlof's "market for lemons" is the foundational model for this thesis. When buyers cannot observe the true quality of a good prior to purchase — here, the quality of a caregiver — the market price collapses toward the average quality level. High-quality sellers, unable to recoup the cost of being good, exit; only low-quality providers ("lemons") remain. Applied to digital pet care, the model predicts exactly the pathology observed: unobservable sitter quality drives top-tier professionals out of the open gig networks, and the surviving market is characterized by commoditized pricing and latent quality risk.

### 2.2 Signaling theory (Spence, 1973)

Spence resolves the lemons dilemma: in asymmetric markets, informed agents (sellers) can transmit costly signals that credibly separate them from low-quality actors. The signal is only effective if it is expensive or impossible for a low-quality actor to imitate. This thesis operationalizes Spence through mandatory certifications, background audits, and practical assessments — costly-to-fake credentials that allow elite caregivers to credibly differentiate. The empirical prediction (SRQ1) is that these institutional signals carry measurable willingness-to-pay, a prediction tested in Chapter 3.4.

### 2.3 Agency theory & moral hazard (Arrow, 1963; Eisenhardt, 1989)

In-home pet care is a textbook principal–agent problem. The principal (the owner) delegates care to an agent (the sitter) whose actions cannot be perfectly monitored, creating moral hazard: the agent may shirk or cut corners when oversight is absent. The platform's governance structure is, in agency terms, a monitoring and incentive-alignment device. Eisenhardt's integration of agency theory shows that outcome-based contracts and monitoring both mitigate moral hazard but have costs; the managed platform's design (Chapter 4.3) chooses monitoring-intensive mechanisms — dossiers, backups, institutional insurance — precisely because the service is a credence good where ex-post verification is weak.

### 2.4 Platform economics & disintermediation (Hagiu & Wright, 2015; Zervas et al., 2021)

Two related findings frame the platform-economics argument. First, **rating inflation**: empirical work on peer-to-peer marketplaces documents systematic inflation, where reviews cluster near the ceiling and cease to discriminate quality — the informational substrate of open directories decays over time. Second, the **two-sided platform governance** literature (Hagiu & Wright, 2015) establishes that platforms capture value only to the extent they can prevent *disintermediation*: users discovering one another and moving transactions off-platform to avoid fees. A platform that offers only matching invites leakage; a platform whose value bundle (matching *plus* institutional safety, insurance, dossiers, backups) exceeds the fee is leak-resistant. This is the theoretical basis for the "leakage prevention" design in Chapter 4.3.

**Synthesis of the framework:** adverse selection (2.1) explains *why* the market fails; signaling (2.2) explains *how quality can separate*; agency theory (2.3) explains *what governance must monitor*; platform economics (2.4) explains *why the platform must deliver more than matching to survive*. The four mechanisms jointly yield the managed-platform hypothesis tested across Chapters 3–4.

---

## Chapter 3 — Empirical Market Diagnostics & Mixed-Methods Analysis

### 3.1 Methodology overview

The empirical design is mixed-methods in three complementary layers:

| Layer | Level | Method | Sample |
|---|---|---|---|
| Macro | Computational review mining | Scraping of competitor platform reviews | [DATA n] reviews |
| Micro | Primary consumer survey | Structured online questionnaire | N = 43 |
| Deep | Qualitative interviews | Semi-structured owner/industry interviews | [DATA n] |

Layering allows triangulation: the macro layer establishes aggregate market behavior (rating inflation, complaint themes), the micro layer establishes individual preferences and willingness to pay, and the deep layer explains *why* behind both.

### 3.2 Computational review mining — macro diagnostics

**[METHOD.]** Reviews were collected from [competitor platforms — DATA]. Following pre-processing (deduplication, language filtering), the corpus was analyzed for (i) rating distribution and (ii) recurring complaint themes via [keyword/thematic coding approach].

**Rating inflation [DATA].** The distribution of ratings clusters at 4.5–5.0 stars [figure], consistent with Zervas et al.'s documented inflation dynamic and the theoretical prediction in 2.4. The near-ceiling distribution implies that *star ratings barely discriminate quality*, which is precisely the informational decay a managed platform must bypass.

**Recurring complaints [DATA].** Thematic analysis surfaces recurring reliability and safety themes: cancellations at short notice, sitter no-shows, inconsistent care quality, and communication failures. [List top themes with representative example counts.] These themes reveal that the *residual risk* not captured by the rating system is exactly the category of risk a managed model with backups and monitoring (4.3) is designed to absorb.

### 3.3 Survey & interview insights — micro-level consumer demands

**[INSTRUMENT + RECRUITMENT.]** A structured survey (N = 43) and [n] interviews targeted premium pet owners in the Miami metro [sampling approach, screening criteria].

**What the premium owner wants [DATA].** Respondents prioritize *verified safety* over price and breadth of choice, and consistently report fatigue with open-list browsing. [Quote representative survey items and interview selections.]

**Pain points [DATA].** The dominant reported pain points: (i) distrust of unverifiable credentials; (ii) time cost of evaluating profiles; (iii) fear of last-minute breakdowns. [Results table.]

### 3.4 Willingness-to-pay & pricing analysis

**[METHOD: Van Westendorp / stated preference design — DATA.]**

**Premium fee tolerance [DATA].** Consumers' acceptable-, expensive-, and prohibitive-price thresholds by service type (house-sitting, overnight boarding, drop-in care) are reported in [table]. [Key takeaway.]

**Credit-based subscription acceptance [DATA].** Willingness-to-pay for a membership + credit structure (vs. per-transaction fees) is evaluated; results suggest [finding] — supporting the subscription economics of 4.1.

**Guaranteed peace of mind [DATA].** The price premium respondents assign to explicitly insured, backed-up, monitored care is [amount/finding] — the empirical anchor for the "institutional insurance + tele-vet" bundle in 4.3.

---

## Chapter 4 — The Zoélys Managed Platform Model (Applied Solution)

The platform operationalizes the theoretical framework. Each subsection ties a mechanism from Chapter 2 to a concrete product decision.

### 4.1 The zero-scroll concierge workflow

**The journey (replaces browsing with intake).** Instead of a search-and-filter directory, the owner completes a **granular behavioral and medical intake** covering separation anxiety, leash reactivity, medical routines, diet, service type, dates, and budget expectations. The intake produces a structured *client request*.

**The match (replaces search with curation).** A transparent, rule-based compatibility engine scores every active sitter against the request on species fit, neighbourhood proximity, medical & anxiety capability, outdoor accommodation, and qualifications, returning a short list of hand-picked matches **[LINK: /api/match]** — each with an explicit, legible explanation of *why this sitter fits*. Matches are delivered [within 24h], completing the "zero-scroll" promise: the owner receives curation instead of a catalogue.

**The technology.** The platform is built on a lightweight serverless stack (Cloudflare Workers + D1), illustrating 5.1's argument that a managed model does not require heavyweight infrastructure.

### 4.2 The five-stage vetting protocol

The protocol is the operational translation of Spence's signaling theory (2.2):

1. **Identity & credential auditing** — verified identity, background screening, credential validation.
2. **Certification requirement** — mandatory industry certification (PSI's **CPPS** — Certified Professional Pet Sitter) aligned with NAPPS member standards, ensuring a standardized national baseline.
3. **Live structured behavioral video interview** — the "calm-presence" assessment; evaluates temperament, communication, and values fit.
4. **Practical scenario assessments** — specialized care tested concretely (medication administration, anxiety handling, emergency response).
5. **Supervised trial introductory meeting** — a mandatory first meet-and-greet under structured supervision before any solo booking.

Costly, observable, and hard to fake, this protocol separates elite caregivers from the open-market population — the mechanism by which adverse selection (2.1) is reversed.

### 4.3 Retention mechanics, backups & leakage prevention

If 4.2 governs *who enters*, 4.3 governs *why they stay and why nobody leaves*. Three mechanisms:

- **Living pet dossiers.** After every booking, a structured dossier accumulates medical notes, routines, behavioural observations, and preferences. This institutional memory makes the *platform* the keeper of the most valuable asset — the pet's history — creating switching costs that anchor both the owner and the sitter to the platform.
- **Emergency Backup Sitter Protocol.** Every booking carries a standing, vetted backup; if a sitter cancels, a pre-qualified backup is re-assigned automatically. This directly absorbs the dominant complaint theme found in 3.2 (last-minute cancellations).
- **Institutional insurance + 24/7 tele-vet support.** Comprehensive, zero-deductible liability coverage accompanies every booking, plus round-the-clock veterinary tele-support. This bundle is designed to make *taking transactions off-platform financially irrational* — the disintermediation remedy called for by 2.4 — by making the platform's protection strictly better than a private arrangement.

The three mechanisms jointly target the moral hazard identified in 2.3: monitoring (dossiers), redundancy (backups), and aligned incentives (insurance that rewards staying in the system).

---

## Chapter 5 — Strategic Implications, Limitations, and Conclusion

### 5.1 Feasibility & scalability

The managed model's viability turns on unit economics and operational cost. Because the stack is serverless and lean (Cloudflare Workers, D1, no physical footprint), the marginal cost of *managing* (vs. merely listing) is primarily human: vetting throughput, concierge response, backup logistics. The thesis assesses whether intake-to-match automation can compress that cost to a level compatible with premium margins — and whether city-by-city expansion is feasible under a concierge-to-owner ratio constraint. [Feasibility model — DATA/assumptions.]

### 5.2 Managerial & academic contributions

- **Academic:** the thesis extends platform economics into high-touch service markets, providing evidence that managed curation can reverse the adverse-selection dynamic open directories exhibit.
- **Managerial:** a transferable playbook for founder-managers: how to price institutional trust (3.4), how to verify rather than aggregate reputation (4.2), and how to engineer retention through value-stack rather than lock-in (4.3).

### 5.3 Limitations & future research

- **Sample constraints** — N = 43 survey, single-city scope; external validity bounded to markets with similar affluence. [Others: scrape coverage, stated vs. revealed preference for premiums.]
- **Future research** — longitudinal tracking of dossier value and leakage behavior; replication across cities; revealed-preference follow-up as the premium tier generates real transactions; application of the managed-model architecture to adjacent high-trust services (childcare, eldercare).

---

## References

*(Working list — full bibliographic details to be completed.)*

- Akerlof, G. A. (1970). The market for "lemons": Quality uncertainty and the market mechanism. *Quarterly Journal of Economics*, 84(3), 488–500.
- Arrow, K. J. (1963). Uncertainty and the welfare economics of medical care. *American Economic Review*, 53(5), 941–973.
- Eisenhardt, K. M. (1989). Agency theory: An assessment and review. *Academy of Management Review*, 14(1), 57–74.
- Hagiu, A., & Wright, J. (2015). Multi-sided platforms. *International Journal of Industrial Organization*, 43, 162–174.
- Spence, M. (1973). Job market signaling. *Quarterly Journal of Economics*, 87(3), 355–374.
- Zervas, G., Proserpio, D., & Byers, J. W. (2021). A first look at online reputation on Airbnb, where every stay is above average. *Journal of Marketing Research*, 58(2), 247–264.
- American Pet Products Association (2024). *National Pet Owners Survey* (industry report).
- Kapferer, J.-N., & Bastien, V. (2012). *The Luxury Strategy* (2nd ed.). Kogan Page. *(supplementary — premium perception)*
- Vigneron, F., & Johnson, L. W. (2004). Measuring perceptions of brand luxury. *Journal of Brand Management*, 11(6), 484–506. *(supplementary)*

## Appendix (unlimited)

- Interview guide (semi-structured owner/interview protocol) + eConsent form
- Survey instrument (N = 43) with response distributions
- Review-mining corpus details: sources, cleaning, codebook
- Willingness-to-pay instrument and thresholds (full tables)
- Platform appendix: matchmaking engine scoring rules, vetting protocol documentation, five-stage charter (linked to `/trust`), hypothesis log