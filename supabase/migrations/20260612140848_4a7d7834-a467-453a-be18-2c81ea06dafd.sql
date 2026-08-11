
DROP POLICY IF EXISTS "Anyone can submit a match request" ON public.match_requests;

CREATE POLICY "Anyone can submit a new match request" ON public.match_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    status = 'new'
    AND matched_sitter_id IS NULL
    AND admin_notes IS NULL
  );
