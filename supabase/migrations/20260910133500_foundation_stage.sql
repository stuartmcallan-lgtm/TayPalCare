-- Foundation stage uses bridge_index = -1 so existing eight journey stages keep their indexes.
-- Card A is informational; Card B stores the delegate's public-health reflection.
CREATE INDEX IF NOT EXISTS idx_submission_cards_foundation
  ON public.submission_cards (submission_id, bridge_index, card_key);
