
ALTER TABLE public.dispatches
  ADD COLUMN started_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN finished_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN total_programmed INTEGER DEFAULT 0,
  ADD COLUMN total_sent INTEGER DEFAULT 0,
  ADD COLUMN total_errors INTEGER DEFAULT 0;

-- Remove old sent_at column (replaced by started_at/finished_at)
ALTER TABLE public.dispatches DROP COLUMN sent_at;
