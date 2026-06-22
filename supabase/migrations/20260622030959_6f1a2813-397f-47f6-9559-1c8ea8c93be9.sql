
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  severity TEXT NOT NULL DEFAULT 'Low',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read reports" ON public.reports FOR SELECT USING (true);
CREATE POLICY "Public can create reports" ON public.reports FOR INSERT WITH CHECK (true);
