
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Restrict listing: replace broad public read with direct-URL only access pattern
DROP POLICY IF EXISTS "Media public read" ON storage.objects;
CREATE POLICY "Media admin list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'media' AND public.has_role(auth.uid(), 'admin'));
-- Public can still GET individual files via the public URL (bucket is public),
-- but cannot LIST the bucket without admin role.
