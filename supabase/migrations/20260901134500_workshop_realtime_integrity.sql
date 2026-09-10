-- Ensure one response row exists for each submission + bridge + card.
CREATE UNIQUE INDEX IF NOT EXISTS uq_submission_cards_submission_bridge_card
  ON public.submission_cards (submission_id, bridge_index, card_key);

-- Make sure Supabase Realtime can publish row changes for the workshop tables.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'submissions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submissions;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'submission_cards'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.submission_cards;
  END IF;
END $$;

ALTER TABLE public.submissions REPLICA IDENTITY FULL;
ALTER TABLE public.submission_cards REPLICA IDENTITY FULL;
