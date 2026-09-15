# The Emergence of a Premium Segment in a Fragmented Service Market
### Evidence from the Miami Pet-Care Market — and a Live Platform Designed for It

**Océane Bort · Master in Business Analytics · Nova School of Business and Economics · 2026**

*Draft v0.1 — working document. Empirical sections contain placeholders to be completed from primary data collection.*

---

## 1. Topic

This thesis investigates a deceptively simple question: **what drives the emergence of a premium segment in a fragmented service market — and how can a digital platform support it?**

The empirical setting is pet care in Miami. Pet ownership has been rising for two decades, and a growing share of owners treat companion animals as family members rather than property — a demographic shift often called "pet humanization" (Blouin, 2013). In affluent cities, this has produced a visible premiumization of animal-related consumption: designer veterinary medicine, pet hotels, nutritional therapy, and specialist grooming. Yet the *core* service — the person who cares for the pet when the owner is away — remains stubbornly low-trust and commodity-like. Supply is fragmented across individual sitters, gig-marketplace listings, and small boarding facilities, with opaque quality, unverifiable credentials, and pricing that fails to reflect demonstrated quality.

The thesis argues that this asymmetry — **high willingness to pay coexisting with an absent credible premium offer** — is a market failure in the Akerlof (1970) sense, and that a carefully designed platform can resolve it. To test this claim empirically, the research is developed across three subtopics: (A) a *market failure diagnosis*, quantifying the premium void in the Miami supply structure; (B) an *empirical definition of premium and trust*, establishing what affluent owners actually value and which trust signals increase their willingness to pay; and (C) an *experiment in platform design*, testing whether digital design choices can credibly deliver perceived exclusivity at scale.

A distinctive feature of the thesis is that the platform under study is not hypothetical: **Zoélys**, a membership-based pet-care concierge, has been designed, built, and deployed as a live web platform during this research. The thesis therefore combines academic analysis with a working technological artefact that embodies and tests the findings.

---

## 2. Pertinence

**Why should the jury spend time on this?** The question matters on four levels: market level, industry level, academic level, and societal level.

**Market level.** The US pet industry has grown into an annual expenditure in excess of USD 150 billion, with services representing the fastest-growing category, outpacing food and supplies (American Pet Products Association, 2024). Within this, in-home pet care and sitting is occupied overwhelmingly by gig platforms such as Rover and Wag, whose model is volume and commission rather than curation. The result is a market with enormous aggregate spending but no credible premium tier: high-income owners are simultaneously over-served with low-price options and under-served with verified, high-quality ones. Understanding whether and how a premium segment can form is therefore not an academic curiosity — it is a live commercial question with billions of dollars at stake.

**Industry level.** The market failure this thesis diagnoses — deep information asymmetry between buyer and seller in a "credence service" — is not unique to pet care. It is structurally identical to the problems that online platforms have solved (or failed to solve) in childcare, eldercare, home services, and tutoring. The findings on trust signals and platform design therefore transfer directly to any high-trust service marketplace currently trying to escape the race-to-the-bottom dynamic of algorithmic reputation systems.

**Academic level.** The literature confronts a genuine void (Section 4): premiumization has been studied extensively in *physical goods* (Vigneron & Johnson, 2004) and *hospitality* (Kapferer & Bastien, 2012), and trust in *peer-to-peer platforms* has been studied extensively at mass-market price points (McKnight et al., 2002; Sundararajan, 2016). What has not been established is whether a premium — rather than merely expensive — segment can form in a *fragmented local service* where the product is inseparable from a human being's care, and where demand is highly affluent. This thesis is, to our knowledge, among the first to combine a supply-side market-failure diagnosis, a demand-side willingness-to-pay analysis, and a live platform experiment on the same question.

**Societal level.** Two of every three US households now include a pet. The care that a family delegates when traveling is not a luxury accessory: it is a core trust interaction, involving access to the family home, the health of a companion animal, and — in Florida specifically — legal exposure under strict dog-bite liability (Fla. Stat. § 767.04). A functioning premium tier in this market is not merely a business opportunity; it is a mechanism for making high-stakes local trust work better for everyone.

**Personal pertinence.** As the founder of Zoélys, I have had a front-row seat to the problem this thesis formalizes. The platform exists because the market failure described here is felt daily by owners and sitters. This research is not detached observation: the theories, measurements, and experiments in this thesis are the ones informing live product decisions — which makes the research instrument itself part of the contribution.

---

## 3. Literature Review

The review is organized into three streams corresponding to the three subtopics: (i) how markets form and fail under information asymmetry; (ii) what "premium" means and how consumers form willingness-to-pay; (iii) how digital platforms build trust. Each stream closes with what the existing literature firmly establishes, before Section 4 identifies what it leaves open.

### 3.1 Market failure, information asymmetry, and the emergence of markets

Akerlof's (1970) "market for lemons" established the foundational result: when quality is asymmetric between buyer and seller and cannot be verified at purchase, the price collapses toward the level of the worst-quality offer, and high-quality supply *exits* the market. The mechanism is not limited to used cars. Darby and Karni (1973) formalized the category of "credence goods," where quality cannot be evaluated even *after* purchase, and argued that such markets invite systematic fraud and require institutional remedies. Nelson (1970) distinguished "search" from "experience" goods; pet sitting, whose quality is only revealed in the owner's absence, is arguably worse than an experience good — closer to a credence good in the Darby-Karni sense.

Information economics is thus clear on *why* high-quality local services struggle: quality is unobservable (experience), possibly unverifiable even ex post (credence), and cheap to misrepresent. It is also clear on the generic remedy — **signaling** (Spence, 1973): if high-quality providers can purchase a costly, observable signal that low-quality providers cannot plausibly imitate, the two separate and the market can support quality tiers. Certifications, licenses, insurance, and third-party vetting are textbook Spence signals.

Klepper's (1997) work on industry life cycles adds the *emergence* dimension: industries do not simply "appear" at their eventual structure. They move from a fragmented, experimental state dominated by many small entrants toward shakeout and concentration — and the timing of that transition is governed by the dominant design and the efficiency frontier of production. Extending this logic, a "premium segment" is not necessarily a new product; it may be a *re-segmentation* of a mature fragmented industry along a quality dimension that was previously unpriceable. The interesting industrial question is therefore *when* a fragmented industry acquires the institutional infrastructure — standards, certification, insurance, credible intermediaries — needed to support a quality tier.

**What the stream establishes:** asymmetric information can suppress quality in local service markets; credible, costly-to-imitate signals are the mechanism that permits quality tiers; and fragmented industries can re-segment once institutional infrastructure emerges.

### 3.2 What "premium" means: luxury perception and willingness to pay

If a premium segment is to form, "premium" must be more than a synonym for "expensive." Vigneron and Johnson (2004) synthesized the psychological literature into the Brand Luxury Index, decomposing luxury perception into five dimensions: perceived conspicuousness, uniqueness, quality, hedonic value, and extended self. Their central insight — which this thesis adopts — is that **luxury is a consumer-perceived construct, not an objective property of a good**. Premium is in the eye of the beholder, and it is multi-dimensional: a product perceived as merely *expensive* without perceived uniqueness or quality outperforms in neither revenue nor loyalty.

Zeithaml (1988) supplies the value side of the price equation. Her means-end model decomposes perceived value into the trade-off between "what is received" (quality signals, benefits) and "what is given" (price, time, effort). Her review, still authoritative, shows that price operates as *both* a sacrifice and a signal: higher price raises perceived quality when quality is otherwise hard to judge — which is precisely the condition of a credence service. This dual role of price is central to the present thesis because it predicts that, in pet care, *price itself* may be doing signaling work that reviews cannot.

Lynn (1991) provides the mechanism connecting scarcity to value through commodity theory: when an item is scarce, inaccessible, or exclusively available, its perceived value rises, because the item is seen as limited in supply. This is the theoretical anchor for the prediction that **distributional scarcity — gated access, limited roster, invitation-only membership** — can itself be a premium cue in a digital service, independent of the underlying quality.

Kapferer and Bastien (2012), in *The Luxury Strategy*, formalize the apparent paradox at the heart of Subtopic C: luxury brands prosper by rejecting the classical marketing playbook of reach, ubiquity, and delighting the masses. Their "anti-laws of marketing" include: do not be easily accessible (*difficulté d'accès*); do not price to demand; do not grow by adding average customers. The critical question they raise — and the one a digital platform must answer — is whether these principles survive **scale**. A luxury brand can limit production; a platform's entire economics are built on network growth. Whether the scarcity cues of luxury can coexist with the scale economics of a platform is the tension Subtopic C tests empirically.

**What the stream establishes:** premium is a multi-dimensional perception (uniqueness, quality, hedonic value, extended self), price is a dual signal (sacrifice and quality cue), scarcity raises perceived value, and luxury positioning traditionally trades growth against exclusivity — a tension that platforms have not resolved.

### 3.3 Trust in digital and peer-to-peer markets

If signaling is the generic remedy to information asymmetry, the platform-specific question is *which signals work in a digital marketplace*. McKnight, Choudhury, and Kacmar (2002) developed the foundational typology of e-commerce trust, decomposing initial trust into trusting beliefs — benevolence, competence, integrity — and showing that web-based trust-building mechanisms (seals, privacy policies, third-party assurances) increase willingness to engage. Their integrative typology remains the standard lens for categorizing platform trust signals.

Petty and Cacioppo's (1986) elaboration likelihood model (ELM) provides the processing mechanism: when consumers are uncertain and involved, they engage the *central route* (careful scrutiny of arguments and evidence); when they are unmotivated or unable to evaluate, they fall back on the *peripheral route* (heuristic cues such as certifications, endorsements, and aesthetics). This is the theoretical bridge of the thesis: **an affluent owner deciding on a person to enter their home is maximally involved, hence maximally central-route, hence maximally sensitive to evidence-strong signals (verifiable credentials, insurance, vetting) rather than peripheral volume cues (number of reviews)** — even though platforms overwhelmingly privilege the latter.

This stream must confront a tension in the literature. The dominant academic position privileges **algorithmic reputation** — the volume and valence of user reviews — as the scalable trust mechanism of two-sided markets (Tadelis, 2016; Sundararajan, 2016). Yet a parallel and growing body of evidence documents its limits: review herding and strategic manipulation (Luca & Zervas, 2016), the wallet-participation problem where low base rates of feedback make volume a poor signal, and the finding that extreme ratings are more informative than average scores. Institutional signals — certification, insurance, background checks, human vetting — have been comparatively under-studied as platform trust mechanisms, precisely because they are expensive and therefore scale poorly. This thesis treats that expense not as a limitation but as an independent variable: it is the cost that makes the signal credible in the Spence sense.

**What the stream establishes:** trust decomposes into competence, benevolence, and integrity beliefs; highly-involved consumers process trust evidence centrally; algorithmic reputation is the dominant but arguably fragile platform mechanism; certification-based institutional signals are theoretically superior for high-involvement, high-stakes purchases but empirically under-tested — particularly at premium price points.

### 3.4 Synthesis

The three streams lock together into a single argument. Information economics (3.1) explains why no premium pet-care segment exists: it is a credence market suffering the lemon problem, needing credible signals. Perception theory (3.2) explains what a premium offer must feel like — unique, scarcity-consistent, quality-signaling — and why price itself will be doing double duty. Trust research (3.3) explains the mechanism by which an owner decides to trust a stranger with home and pet, and raises the untested empirical proposition at the heart of this thesis: that for affluent, high-involvement buyers, *institutional signals outperform algorithmic ones*, and that platform design can encode scarcity credibly. Section 4 formalizes the void this synthesis exposes.

---

## 4. The Void

The literature as surveyed leaves three specific questions open, each mapping to a subtopic:

**Void A (Subtopic A):** *The existence of the premium void itself is asserted, not measured.* Akerlofian lemon logic predicts that high-quality supply struggles in fragmented markets, but no published work, to our knowledge, quantifies the phenomenon in a specific local service market using real provider data. We do not have a measure of how *without-premium* a market such as Miami pet care actually is — how pricing disperses, how thin the certified/insured supply layer is, how compressed quality signals are. Subtopic A fills this by building and analyzing a provider-level dataset.

**Void B (Subtopic B):** *The premium construct has never been operationalized for a human-delivered local service, and institutional trust signals have never been valued for owners willing to pay.* Luxury scales exist for goods; trust typologies exist for general e-commerce. What is missing is a measurement of (i) what affluent families mean when they call a caregiver "premium" and (ii) how much a verifiable credential (insurance, certification, vetting depth) is actually worth to them relative to a high review score. Subtopic B fills this with laddering interviews and a conjoint valuation.

**Void C (Subtopic C):** *The luxury-versus-scale tension is asserted but untested experimentally.* Kapferer and Bastien's anti-laws predict that scarcity cues should raise perceived exclusivity, but the claim has not been tested on an actual platform with real design variations — and never with a product that combines the scarcity of a gated concierge with the economics of a two-sided marketplace. Subtopic C fills this with a controlled experiment on the live Zoélys stack.

The overarching research question this thesis answers is therefore: **What drives the emergence of a premium segment in a fragmented service market, and can a digital platform credibly support it?** — with the null hypothesis implied by the market failure literature (A), the construct hypotheses from perception theory (B), and the design hypotheses from luxury strategy (C) each tested in turn.

---

## 5. Methodology

### 5.1 Research design

The thesis adopts a **sequential mixed-methods design** with a causal core. It proceeds in the order A→B→C, mirroring the logic of the causal chain: diagnose the supply-side void, establish the demand-side construct, then test whether a digital design can bridge the two. The design is grounded in the evidence-based-experimentation tradition advocated for entrepreneurial research: hypotheses are registered in a running **hypothesis log** (hypothesis → test → metric → result → decision), and the platform under study is scored on Technology Readiness Level (TRL) and Innovation Readiness Level (IRL) to make explicit what is proven versus assumed at each stage.

The research sets out from four registered hypotheses:

| # | Hypothesis | Source | Test |
|---|---|---|---|
| H1 | Premium supply density in Miami pet care is structurally thin; high-quality tier is absent | Akerlof 1970; Klepper 1997 | Subtopic A (scrape analysis) |
| H2 | Affluent owners hold a coherent, multi-dimensional "premium" construct, distinct from mere price | Vigneron & Johnson 2004 | Subtopic B (interviews + PSM) |
| H3 | Institutional signals (insurance, certification, vetting) dominate algorithmic signals (reviews) in driving WTP among affluent owners | Spence 1973; McKnight et al. 2002; ELM | Subtopic B (conjoint) |
| H4 | Gated-access / higher-friction platform design raises perceived exclusivity and intent without harming usability | Kapferer & Bastien 2012; Lynn 1991 | Subtopic C (A/B experiment) |

### 5.2 Data sources

**Secondary data (Subtopic A).** A provider-level dataset is constructed by systematically scraping public listings on the dominant gig platform (Rover) and review platforms (Yelp, Google Maps) across the Miami-Dade metropolitan area. [METHOD DETAIL: include scope criteria, sample size, fields collected — pricing, review counts/scores, certification mentions, response indicators, neighbourhood.]

**Primary data (Subtopics B and C).** Three instruments:

1. **Laddering interviews** (n = 12–15) with affluent Miami pet owners (household income > $150k), recruited via pet-community channels. Semi-structured interview guide elicits attribute → consequence → value chains; transcribed and thematically coded. *Ethics (Section 5.4).*
2. **Survey battery** (n ≥ 150) combining the Van Westendorp Price Sensitivity Meter — to map acceptable/expensive/prohibitive price thresholds per service type — with pet-humanization and sociodemographic items (Blouin's pet humanization orientation; Vigneron-Johnson luxury perception items adapted to services).
3. **Discrete-choice conjoint experiment** (n ≈ 200): respondents choose between caregiver profiles varying on review score, review volume, insurance type, certification level, vetting depth, and concierge access; part-worth utilities estimated via standard hierarchical Bayes software. Income and pet-humanization are tested as moderators.

**Artifact (Subtopic C).** The platform under study, Zoélys, is a deployed production system (Cloudflare Workers + D1, custom design system). Four landing-page variants operationalizing access model (open vs. gated) × friction (high vs. low) are built as experimental conditions on this stack and shown between-subjects, with perceived-exclusivity (Vigneron-Johnson items), brand-prestige, and sign-up-intent/WTP-proxy measures collected post-exposure. ANOVA with post-hoc tests and moderation analysis estimate the design effects.

### 5.3 Justification

The *reasoning* for the mixed-methods sequence is theoretical (Sections 3–4), but three *methodological* justifications should be explicit. First, each subsequent stage depends on the previous one, so the sequence is not merely additive — it is a designed causal chain, and the hypothesis log ensures the dependency is documented rather than implicit. Second, the use of stated-preference methods (conjoint, PSM) compensates for the fact that *revealed* transactions in a premium tier do not yet exist — the market is too young for observational data, and demanding it would be to demand the phenomenon under study. Third, the live-platform experiment provides a degree of behavioral grounding (actual exposure to a working system) absent from purely survey-based platform research.

### 5.4 Interview ethics

In line with the program's instructions: every interviewee is asked in advance for (i) permission to be named, (ii) permission to mention their company or affiliation where relevant, and (iii) permission to record and transcribe the interview. Interviews are conducted in English; transcription uses automated software, with typographical imperfections accepted as inherent to verbatim transcription. No interview proceeds without explicit recorded consent, and consent is documented in the Appendix (eConsent form). All data is stored pseudonymized by default, with named attribution only where expressly granted.

### 5.5 Methodological limitations (preview)

The design's chief limitations are (i) the single-city scope, which confines external validity to markets with similar affluence and fragmented supply; (ii) the reliance on stated rather than revealed preferences for the premium tier, which cannot yet exist observationally; (iii) the modest interview sample and the self-selection of volunteer interviewees; and (iv) the controlled-laboratory nature of the platform experiment, traded against the practical impossibility of randomizing real customers between product configurations. Section 10 elaborates these and their mitigations.

---

## 6. Subtopic A — The Premium Void

*Structural diagnosis of the supply side.*

### 6.1 Research question
**RQA:** Is the Miami pet-care market structurally without a premium tier, and what is the binding constraint on its emergence?

### 6.2 Approach
Scraped provider dataset → descriptive market structure (pricing distribution, review variance, certification/insurance penetration, neighbourhood density) → interpretation against the Akerlof/Klepper framework. The "premium supply density" metric quantifies the share of providers exhibiting credible-credential and price-signaling characteristics consistent with a premium tier.

### 6.3 Hypotheses tested
H1 (thin premium supply density). Expected: low density of credentialed, high-price, low-review-volume providers; wide price dispersion at the low end; compression at the top.

### 6.4 Results
[TO BE COMPLETED — tables/figures from scrape analysis. Intended figures: (1) price distribution by service type; (2) scatter of review volume vs. price with credential markers; (3) neighbourhood density map.]

### 6.5 Findings and so-what for Zoélys
[TO BE COMPLETED — confirms/corrects the market-failure diagnosis; identifies whether the void is a *supply* gap (no one attempts premium), a *signal* gap (attempts exist but are unverifiable), or both.]

---

## 7. Subtopic B — Defining Premium and Valuing Trust

*Demand-side construct and signal valuation.*

### 7.1 Research questions
**RQB1:** What attributes constitute "premium" in pet care for affluent Miami owners?
**RQB2:** Which trust signals — institutional or algorithmic — most strongly drive willingness to pay, and is the effect moderated by income and pet humanization?

### 7.2 Approach
Laddering interviews → thematic coding → candidate premium dimensions (Table [X]). Van Westendorp PSM → price corridors per service type. Conjoint → part-worth utilities per trust attribute, with moderation analysis.

### 7.3 Hypotheses tested
H2 (coherent multi-dimensional premium construct: uniqueness, quality, hedonic value, extended self — not price alone).
H3 (institutional signals dominate algorithmic signals for affluent owners; a ceiling on reviews' marginal value).

### 7.4 Results
[TO BE COMPLETED. Intended: (1) interview theme table with representative quotes; (2) Van Westendorp "acceptable-priced" range per service; (3) conjoint importance scores + part-worth charts; (4) moderation plots.]

### 7.5 Findings and so-what for Zoélys
[TO BE COMPLETED — maps directly onto Zoélys' tier structure and Trust & Safety charter: which charter elements to lead with, which to de-emphasize.]

---

## 8. Subtopic C — Can a Digital Platform Deliver Premium?

*Design experiment for perceived exclusivity.*

### 8.1 Research question
**RQC:** To what extent do digital design choices — access model and friction — moderate perceived exclusivity and intent among affluent consumers?

### 8.2 Approach
Four live-platform landing variants (open/low-friction; open/high-friction; gated/low-friction; gated/high-friction) in a between-subjects design with quantitative post-exposure measures; ANOVA + post-hoc tests; moderation by income and pet-humanization.

### 8.3 Hypotheses tested
H4 (gated access and higher friction raise perceived exclusivity without destroying intent).

### 8.4 Results
[TO BE COMPLETED. Intended: (1) means table per condition; (2) ANOVA results with effect sizes; (3) moderation figures.]

### 8.5 Findings and so-what for Zoélys
[TO BE COMPLETED — the answer to whether Zoélys should operate open or gated is a product decision, and the thesis supplies the evidence for it.]

---

## 9. Conclusion

[TO BE COMPLETED. Should restate the overarching RQ, summarize the finding of each subtopic, and state the novel insights in plain sentences — e.g. whether and how a premium segment can emerge, which signals carry it, and whether a platform can encode it. Ends by answering the thesis title's question directly.]

---

## 10. Limitations

Full list in development. Core limitations to be elaborated: single-city scope and external validity; stated vs. revealed preference; interview self-selection and small n; contrived-experiment costs of the platform test; scrape coverage caveats (platform policies, updates, sample coverage of informal/unlisted providers); seasonality of demand (holiday peaks); and the author's dual role as researcher and platform founder, with the mitigations for each.

---

## 11. Future Work

Directions to be itemized: replication across markets (NYC, LA, London); revealed-preference follow-up once the premium tier realises real transactions; longitudinal trust research; development roadmap derived from findings — including mapping each Subtopic C result to an actual Zoélys product decision; and extension of the trust-signal valuation to other high-involvement local services (childcare, eldercare).

---

## 12. Appendix (unlimited)

- Hypothesis log (full register, maintained from draft date 0)
- Interview guide (laddering protocol, English)
- eConsent form
- Survey instrument (PSM + pet humanization + demographics)
- Conjoint design and stimuli
- Experiment conditions (four landing variants) and measurement instrument
- Dataset codebook (Miami provider scrape)
- Full legal & compliance annex (drawn from repo §19: two-layer insurance, contractor classification/ABC test, Florida animal liability, contracts & waivers)

---

## References

*(Working list — full bibliographic details to be completed and formatted per school style.)*

- Akerlof, G. A. (1970). The market for "lemons": Quality uncertainty and the market mechanism. *Quarterly Journal of Economics*, 84(3), 488–500.
- Blouin, D. D. (2013). Are dogs children, companions, or just animals? Understanding variations in people's orientations toward animals. *Anthrozoös*, 26(2), 279–294.
- Darby, M. R., & Karni, E. (1973). Free competition and the optimal amount of fraud. *Journal of Law and Economics*, 16(1), 67–88.
- Kapferer, J.-N., & Bastien, V. (2012). *The Luxury Strategy: Break the Rules of Marketing to Build Luxury Brands* (2nd ed.). Kogan Page.
- Klepper, S. (1997). Industry life cycles. *Industrial and Corporate Change*, 6(1), 145–182.
- Luca, M., & Zervas, G. (2016). Fake it till you make it: Reputation, competition, and Yelp review fraud. *Management Science*, 62(12), 3412–3427.
- Lynn, M. (1991). Scarcity effects on value: A quantitative review of the commodity theory literature. *Psychology & Marketing*, 8(1), 43–57.
- McKnight, D. H., Choudhury, V., & Kacmar, C. (2002). Developing and validating trust measures for e-commerce. *Information Systems Research*, 13(3), 334–359.
- Nelson, P. (1970). Information and consumer behavior. *Journal of Political Economy*, 78(2), 311–329.
- Petty, R. E., & Cacioppo, J. T. (1986). *Communication and Persuasion: Central and Peripheral Routes to Attitude Change*. Springer-Verlag.
- Spence, M. (1973). Job market signaling. *Quarterly Journal of Economics*, 87(3), 355–374.
- Sundararajan, A. (2016). *The Sharing Economy: The End of Employment and the Rise of Crowd-Based Capitalism*. MIT Press.
- Tadelis, S. (2016). Reputation and feedback systems in online platform markets. *Annual Review of Economics*, 8, 321–340.
- Vigneron, F., & Johnson, L. W. (2004). Measuring perceptions of brand luxury. *Journal of Brand Management*, 11(6), 484–506.
- Zeithaml, V. A. (1988). Consumer perceptions of price, quality, and value. *Journal of Marketing*, 52(3), 2–22.