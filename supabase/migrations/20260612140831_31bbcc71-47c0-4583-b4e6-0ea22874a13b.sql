
-- ============================================================
-- PETSITTERS table — admin-managed directory of approved sitters
-- ============================================================
CREATE TABLE public.petsitters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- identity
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  bio TEXT,
  -- coverage
  languages TEXT[] NOT NULL DEFAULT '{}',
  neighborhoods TEXT[] NOT NULL DEFAULT '{}',
  -- services: subset of ['Home visit','Overnight stay','Day care','Dog walking']
  services TEXT[] NOT NULL DEFAULT '{}',
  -- animals accepted: subset of ['Dog','Cat','Bird','Rabbit','Reptile','Fish','Other']
  animals TEXT[] NOT NULL DEFAULT '{}',
  -- size capacity: subset of ['small','medium','large','xl']
  size_capacity TEXT[] NOT NULL DEFAULT '{}',
  -- experience
  experience_level TEXT NOT NULL DEFAULT 'Some experience',
  years_experience INTEGER NOT NULL DEFAULT 0,
  -- environment & capabilities
  has_outdoor_space BOOLEAN NOT NULL DEFAULT false,
  accepts_other_pets BOOLEAN NOT NULL DEFAULT false,
  accepts_children BOOLEAN NOT NULL DEFAULT false,
  handles_medical BOOLEAN NOT NULL DEFAULT false,
  handles_aggressive BOOLEAN NOT NULL DEFAULT false,
  handles_anxious BOOLEAN NOT NULL DEFAULT false,
  -- demographics & pricing
  gender TEXT,
  hourly_rate NUMERIC(10,2),
  daily_rate NUMERIC(10,2),
  max_concurrent_bookings INTEGER NOT NULL DEFAULT 3,
  -- admin
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT petsitters_status_chk CHECK (status IN ('pending','approved','paused'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.petsitters TO authenticated;
GRANT ALL ON public.petsitters TO service_role;

ALTER TABLE public.petsitters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage petsitters" ON public.petsitters
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER petsitters_updated_at
  BEFORE UPDATE ON public.petsitters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX petsitters_status_idx ON public.petsitters(status);

-- ============================================================
-- MATCH_REQUESTS table — every Get Matched form submission
-- ============================================================
CREATE TABLE public.match_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- owner contact
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  area TEXT,
  -- pet
  animal TEXT,
  breed TEXT,
  pet_name TEXT,
  age TEXT,
  size TEXT,
  sex TEXT,
  temperament TEXT,
  house_trained TEXT,
  traits TEXT[] NOT NULL DEFAULT '{}',
  -- health & care
  has_medical TEXT,
  medical_desc TEXT,
  vaccines TEXT,
  parasite TEXT,
  diet TEXT,
  allergies TEXT,
  meals INTEGER,
  exercise TEXT,
  sleep TEXT,
  -- service
  services TEXT[] NOT NULL DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  recurring TEXT,
  frequency TEXT,
  hours INTEGER,
  -- preferences
  exp_level TEXT,
  outdoor TEXT,
  other_pets TEXT,
  children TEXT,
  gender_pref TEXT,
  language TEXT,
  updates TEXT,
  other_qualities TEXT,
  -- experience & final
  used_before TEXT,
  issues TEXT,
  referral TEXT,
  notes TEXT,
  -- catch-all
  raw JSONB NOT NULL DEFAULT '{}',
  -- workflow
  status TEXT NOT NULL DEFAULT 'new',
  matched_sitter_id UUID REFERENCES public.petsitters(id) ON DELETE SET NULL,
  admin_notes TEXT,
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT match_requests_status_chk CHECK (status IN ('new','matched','completed','cancelled'))
);

-- Anonymous submissions allowed (public form); admins see all; owners see their own
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_requests TO authenticated;
GRANT INSERT ON public.match_requests TO anon;
GRANT ALL ON public.match_requests TO service_role;

ALTER TABLE public.match_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (server fn will use admin client, but keep policy for safety)
CREATE POLICY "Anyone can submit a match request" ON public.match_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Owners can view their own requests" ON public.match_requests
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Admins manage all match requests" ON public.match_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER match_requests_updated_at
  BEFORE UPDATE ON public.match_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX match_requests_status_idx ON public.match_requests(status);
CREATE INDEX match_requests_deadline_idx ON public.match_requests(deadline_at);
CREATE INDEX match_requests_user_idx ON public.match_requests(user_id);
