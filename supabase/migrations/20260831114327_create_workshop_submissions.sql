/*
# Create workshop submissions tables (single-tenant, no auth)

1. New Tables
- `submissions`
  - `id` (uuid, primary key)
  - `delegate_name` (text, optional — the delegate's name for the facilitator's view)
  - `submitted_at` (timestamptz, defaults to now)
  - `payload` (jsonb, the full structured response: per-bridge, per-card tokens + narratives)
- `submission_cards`
  - `id` (uuid, primary key)
  - `submission_id` (uuid, foreign key to submissions, cascade on delete)
  - `bridge_index` (int, 0-7)
  - `card_key` (text, "A" | "B" | "C" | "D")
  - `celebration` (int, token count)
  - `improvement` (int, token count)
  - `transformation` (int, token count)
  - `connect` (int, token count)
  - `narrative` (text, the justification/suggestion)
  - `created_at` (timestamptz, defaults to now)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD — this is a shared workshop tool with no sign-in.
- `USING (true)` is acceptable because the data is intentionally public/shared across all delegates and the facilitator.

3. Notes
- The `submission_cards` table stores one row per bridge+card combination, making aggregate queries (totals by token type, by bridge, by card) straightforward.
- The `payload` jsonb column on `submissions` stores the complete response as a backup/full-fidelity copy.
*/

CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_name text,
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
CREATE POLICY "anon_select_submissions" ON submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
CREATE POLICY "anon_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_submissions" ON submissions;
CREATE POLICY "anon_update_submissions" ON submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_submissions" ON submissions;
CREATE POLICY "anon_delete_submissions" ON submissions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS submission_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  bridge_index int NOT NULL,
  card_key text NOT NULL,
  celebration int NOT NULL DEFAULT 0,
  improvement int NOT NULL DEFAULT 0,
  transformation int NOT NULL DEFAULT 0,
  connect int NOT NULL DEFAULT 0,
  narrative text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submission_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_submission_cards" ON submission_cards;
CREATE POLICY "anon_select_submission_cards" ON submission_cards FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submission_cards" ON submission_cards;
CREATE POLICY "anon_insert_submission_cards" ON submission_cards FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_submission_cards" ON submission_cards;
CREATE POLICY "anon_update_submission_cards" ON submission_cards FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_submission_cards" ON submission_cards;
CREATE POLICY "anon_delete_submission_cards" ON submission_cards FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_submission_cards_submission ON submission_cards(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_cards_bridge ON submission_cards(bridge_index);
