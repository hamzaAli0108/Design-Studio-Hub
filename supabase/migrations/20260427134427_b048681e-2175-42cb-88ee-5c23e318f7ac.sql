
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS likes_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_portfolio_view(_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.portfolio_items
    SET views_count = views_count + 1
    WHERE id = _id
  RETURNING views_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_portfolio_like(_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE public.portfolio_items
    SET likes_count = likes_count + 1
    WHERE id = _id
  RETURNING likes_count INTO new_count;
  RETURN COALESCE(new_count, 0);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_portfolio_view(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_portfolio_like(uuid) TO anon, authenticated;
