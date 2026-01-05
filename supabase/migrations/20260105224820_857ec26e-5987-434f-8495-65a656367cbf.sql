-- Create actions table
CREATE TABLE public.actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  customer TEXT NOT NULL,
  action_type TEXT NOT NULL,
  category TEXT,
  action_date DATE NOT NULL,
  responsibles TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view all actions"
ON public.actions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert actions"
ON public.actions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update actions"
ON public.actions
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete actions"
ON public.actions
FOR DELETE
TO authenticated
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_actions_updated_at
  BEFORE UPDATE ON public.actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for actions
ALTER PUBLICATION supabase_realtime ADD TABLE public.actions;