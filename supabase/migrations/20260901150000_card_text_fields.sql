-- Add the two mandatory participant text fields for every bridge/card response.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS payload jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.submission_cards
  ADD COLUMN IF NOT EXISTS allocation_reference text NOT NULL DEFAULT '';

ALTER TABLE public.submission_cards
  ALTER COLUMN narrative SET DEFAULT '';

-- Ensure existing workshop rows remain compatible with the new two-part response model.
CREATE INDEX IF NOT EXISTS idx_submission_cards_allocation_reference
  ON public.submission_cards (allocation_reference);
