-- Add confirmed flag to monthly_cost_entries
-- Unconfirmed rows: actual follows budget (auto-filled), variance hidden
-- Confirmed rows: user has reviewed/updated the actual, variance visible
ALTER TABLE monthly_cost_entries
  ADD COLUMN is_confirmed boolean NOT NULL DEFAULT false;
