-- Add the Foundation stage responses without changing existing bridge/card data.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS foundation_card_a boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS foundation_card_b text NOT NULL DEFAULT '';
