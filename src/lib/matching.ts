// Pure matching algorithm. Easy to unit test and tweak weights.

export type Petsitter = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  photo_url: string | null;
  bio: string | null;
  languages: string[];
  neighborhoods: string[];
  services: string[];
  animals: string[];
  size_capacity: string[];
  experience_level: string;
  years_experience: number;
  has_outdoor_space: boolean;
  accepts_other_pets: boolean;
  accepts_children: boolean;
  handles_medical: boolean;
  handles_aggressive: boolean;
  handles_anxious: boolean;
  gender: string | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  status: string;
};

export type MatchRequest = {
  id: string;
  area: string | null;
  animal: string | null;
  size: string | null;
  temperament: string | null;
  traits: string[];
  has_medical: string | null;
  services: string[];
  exp_level: string | null;
  outdoor: string | null;
  other_pets: string | null;
  children: string | null;
  gender_pref: string | null;
  language: string | null;
};

export type MatchScore = {
  sitter: Petsitter;
  score: number;
  max_score: number;
  reasons: string[];
  warnings: string[];
};

const EXPERIENCE_RANK: Record<string, number> = {
  "Some experience": 1,
  "Experienced": 2,
  "Highly experienced": 3,
};

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function sizeBucket(size: string | null): string | null {
  const s = norm(size);
  if (!s) return null;
  if (/x.?l|extra.?large|giant/.test(s)) return "xl";
  if (/large|big|heavy|>?\s*30/.test(s)) return "large";
  if (/medium|mid/.test(s)) return "medium";
  if (/small|tiny|toy|petite|<?\s*10/.test(s)) return "small";
  // Fallback by number if user typed weight
  const n = parseFloat(s);
  if (!isNaN(n)) {
    if (n < 10) return "small";
    if (n < 25) return "medium";
    if (n < 40) return "large";
    return "xl";
  }
  return null;
}

export function scoreSitter(
  sitter: Petsitter,
  req: MatchRequest,
): MatchScore | null {
  const reasons: string[] = [];
  const warnings: string[] = [];

  // ---------- HARD FILTERS ----------
  if (sitter.status !== "approved") return null;

  // Animal
  if (req.animal && sitter.animals.length > 0) {
    const accepts = sitter.animals.map(norm).includes(norm(req.animal));
    if (!accepts) return null;
  }

  // Services — sitter must offer at least one requested service
  if (req.services?.length) {
    const sitterServices = sitter.services.map(norm);
    const overlap = req.services
      .map(norm)
      .filter((s) => sitterServices.includes(s));
    if (overlap.length === 0) return null;
  }

  // Size capacity
  const reqBucket = sizeBucket(req.size);
  if (reqBucket && sitter.size_capacity.length > 0) {
    if (!sitter.size_capacity.map(norm).includes(reqBucket)) return null;
  }

  // ---------- SCORING ----------
  let score = 0;
  let max = 0;

  // Neighborhood — 25
  max += 25;
  if (req.area && sitter.neighborhoods.length > 0) {
    const reqArea = norm(req.area);
    const match = sitter.neighborhoods.some(
      (n) => norm(n) === reqArea || reqArea.includes(norm(n)) || norm(n).includes(reqArea),
    );
    if (match) {
      score += 25;
      reasons.push(`Covers ${req.area}`);
    } else {
      warnings.push(`Doesn't list ${req.area} as a covered area`);
    }
  } else if (!req.area) {
    score += 25;
  }

  // Services all-overlap — 15
  max += 15;
  if (req.services?.length) {
    const sitterServices = sitter.services.map(norm);
    const need = req.services.map(norm);
    const matched = need.filter((s) => sitterServices.includes(s));
    const pct = matched.length / need.length;
    const pts = Math.round(15 * pct);
    score += pts;
    if (pct === 1) reasons.push(`Offers all ${need.length} requested services`);
    else reasons.push(`Offers ${matched.length}/${need.length} requested services`);
  } else {
    score += 15;
  }

  // Experience — 15
  max += 15;
  if (req.exp_level) {
    const need = EXPERIENCE_RANK[req.exp_level] ?? 1;
    const has = EXPERIENCE_RANK[sitter.experience_level] ?? 1;
    if (has >= need) {
      score += 15;
      reasons.push(`${sitter.experience_level} (${sitter.years_experience}+ yrs)`);
    } else {
      score += Math.round(15 * (has / need));
      warnings.push(`Experience below requested level`);
    }
  } else {
    score += 10;
  }

  // Medical — 10
  max += 10;
  if (req.has_medical === "Yes") {
    if (sitter.handles_medical) {
      score += 10;
      reasons.push("Handles medical conditions");
    } else {
      warnings.push("Doesn't handle medical conditions");
    }
  } else {
    score += 10;
  }

  // Temperament — 10
  max += 10;
  const temp = norm(req.temperament);
  if (temp.includes("anxious") || (req.traits ?? []).some((t) => norm(t).includes("anxiety"))) {
    if (sitter.handles_anxious) {
      score += 10;
      reasons.push("Experienced with anxious pets");
    } else {
      warnings.push("Not specialized in anxious pets");
    }
  } else if (temp.includes("aggressive") || (req.traits ?? []).some((t) => norm(t).includes("aggressive"))) {
    if (sitter.handles_aggressive) {
      score += 10;
      reasons.push("Experienced with reactive pets");
    } else {
      warnings.push("Not specialized in reactive pets");
    }
  } else {
    score += 10;
  }

  // Outdoor — 5
  max += 5;
  if (req.outdoor === "Yes") {
    if (sitter.has_outdoor_space) {
      score += 5;
      reasons.push("Has outdoor space");
    } else {
      warnings.push("No outdoor space");
    }
  } else {
    score += 5;
  }

  // Gender — 5
  max += 5;
  if (req.gender_pref && req.gender_pref !== "No preference") {
    if (sitter.gender && norm(sitter.gender) === norm(req.gender_pref)) {
      score += 5;
      reasons.push(`Gender preference (${sitter.gender})`);
    }
  } else {
    score += 5;
  }

  // Language — 5
  max += 5;
  if (req.language) {
    const reqLang = norm(req.language);
    if (sitter.languages.some((l) => norm(l).includes(reqLang) || reqLang.includes(norm(l)))) {
      score += 5;
      reasons.push(`Speaks ${req.language}`);
    } else {
      warnings.push(`Doesn't list ${req.language}`);
    }
  } else {
    score += 5;
  }

  // Other pets / children — 5
  max += 5;
  let envOk = true;
  if (req.other_pets === "Yes" && !sitter.accepts_other_pets) envOk = false;
  if (req.children === "Yes" && !sitter.accepts_children) envOk = false;
  if (envOk) {
    score += 5;
    if (req.other_pets === "Yes" || req.children === "Yes") {
      reasons.push("Comfortable with your home environment");
    }
  } else {
    warnings.push("Home environment mismatch");
  }

  // Pricing transparency — 5 (just rewards sitters who have rates set)
  max += 5;
  if (sitter.hourly_rate != null || sitter.daily_rate != null) {
    score += 5;
  } else {
    score += 3;
  }

  return { sitter, score, max_score: max, reasons, warnings };
}

export function rankMatches(
  sitters: Petsitter[],
  req: MatchRequest,
  topN = 3,
): MatchScore[] {
  return sitters
    .map((s) => scoreSitter(s, req))
    .filter((r): r is MatchScore => r !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
