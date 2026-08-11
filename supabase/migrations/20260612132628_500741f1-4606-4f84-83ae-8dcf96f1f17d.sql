
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  bio text,
  city text DEFAULT 'Miami',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Dogs
CREATE TYPE public.dog_size AS ENUM ('small', 'medium', 'large', 'xlarge');

CREATE TABLE public.dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  breed text,
  size public.dog_size,
  age_years numeric(3,1),
  bio text,
  photo_url text,
  show_on_map boolean NOT NULL DEFAULT false,
  lat double precision,
  lng double precision,
  neighborhood text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.dogs TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dogs TO authenticated;
GRANT ALL ON public.dogs TO service_role;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
-- Only signed-in users can see dogs (privacy)
CREATE POLICY "Authenticated users can view published dogs"
  ON public.dogs FOR SELECT TO authenticated
  USING (is_published = true OR owner_id = auth.uid());
CREATE POLICY "Owners can insert their dogs"
  ON public.dogs FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update their dogs"
  ON public.dogs FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can delete their dogs"
  ON public.dogs FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER dogs_updated_at BEFORE UPDATE ON public.dogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Playdate requests
CREATE TYPE public.playdate_status AS ENUM ('pending', 'accepted', 'declined', 'cancelled');

CREATE TABLE public.playdate_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_dog_id uuid REFERENCES public.dogs(id) ON DELETE SET NULL,
  to_dog_id uuid NOT NULL REFERENCES public.dogs(id) ON DELETE CASCADE,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  park_name text,
  park_lat double precision,
  park_lng double precision,
  proposed_at timestamptz,
  message text,
  status public.playdate_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.playdate_requests TO authenticated;
GRANT ALL ON public.playdate_requests TO service_role;
ALTER TABLE public.playdate_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view requests they sent or received"
  ON public.playdate_requests FOR SELECT TO authenticated
  USING (from_user_id = auth.uid() OR to_user_id = auth.uid());
CREATE POLICY "Users can create requests as themselves"
  ON public.playdate_requests FOR INSERT TO authenticated
  WITH CHECK (from_user_id = auth.uid());
CREATE POLICY "Recipient can update status; sender can cancel"
  ON public.playdate_requests FOR UPDATE TO authenticated
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());
CREATE TRIGGER playdate_requests_updated_at BEFORE UPDATE ON public.playdate_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
