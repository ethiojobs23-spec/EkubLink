-- ============================================================
-- EkubLink Database Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL DEFAULT '',
  phone_number  TEXT,
  role          TEXT NOT NULL DEFAULT 'giver' CHECK (role IN ('giver', 'collector')),
  cbe_account_number TEXT,
  cbe_account_name   TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- EKUB GROUPS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ekub_groups (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collector_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  contribution_amount NUMERIC(12,2) NOT NULL CHECK (contribution_amount > 0),
  frequency         TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  max_members       INT NOT NULL CHECK (max_members >= 2),
  start_date        DATE NOT NULL,
  draw_mode         TEXT NOT NULL DEFAULT 'random' CHECK (draw_mode IN ('random', 'scheduled')),
  invite_code       TEXT NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8)),
  status            TEXT NOT NULL DEFAULT 'forming' CHECK (status IN ('forming', 'active', 'completed', 'cancelled')),
  cbe_account_number TEXT NOT NULL,
  cbe_account_name   TEXT NOT NULL,
  current_round_number INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ekub_groups ENABLE ROW LEVEL SECURITY;

-- Members can read groups they belong to
CREATE POLICY "Members can view their groups"
  ON public.ekub_groups FOR SELECT
  USING (
    auth.uid() = collector_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = ekub_groups.id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can create groups"
  ON public.ekub_groups FOR INSERT WITH CHECK (auth.uid() = collector_id);

CREATE POLICY "Collectors can update their groups"
  ON public.ekub_groups FOR UPDATE USING (auth.uid() = collector_id);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.group_members (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id    UUID NOT NULL REFERENCES public.ekub_groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  slot_number INT,
  has_won     BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id),
  UNIQUE(group_id, slot_number)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = group_members.group_id AND g.collector_id = auth.uid()
    )
  );

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Collectors can manage membership"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = group_members.group_id AND g.collector_id = auth.uid()
    )
  );

-- ============================================================
-- ROUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rounds (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id        UUID NOT NULL REFERENCES public.ekub_groups(id) ON DELETE CASCADE,
  round_number    INT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'contribution_window'
                  CHECK (status IN ('contribution_window','draw_ready','drawing','payout_pending','completed')),
  winner_id       UUID REFERENCES public.profiles(id),
  payout_receipt_url TEXT,
  total_pool      NUMERIC(12,2),
  due_date        DATE,
  draw_date       TIMESTAMPTZ,
  payout_date     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, round_number)
);

ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group members can view rounds"
  ON public.rounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      LEFT JOIN public.group_members gm ON gm.group_id = g.id
      WHERE g.id = rounds.group_id
        AND (g.collector_id = auth.uid() OR gm.user_id = auth.uid())
    )
  );

CREATE POLICY "Collectors can manage rounds"
  ON public.rounds FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = rounds.group_id AND g.collector_id = auth.uid()
    )
  );

CREATE POLICY "Collectors can update rounds"
  ON public.rounds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = rounds.group_id AND g.collector_id = auth.uid()
    )
  );

-- ============================================================
-- TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id             UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  group_id             UUID NOT NULL REFERENCES public.ekub_groups(id) ON DELETE CASCADE,
  member_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_reference TEXT NOT NULL UNIQUE,  -- CBE FT... reference — GLOBALLY UNIQUE
  receipt_url          TEXT,
  amount               NUMERIC(12,2) NOT NULL,
  payment_date         TIMESTAMPTZ,
  status               TEXT NOT NULL DEFAULT 'pending_verification'
                       CHECK (status IN ('pending_verification','verified_paid','rejected')),
  collector_notes      TEXT,
  verified_at          TIMESTAMPTZ,
  verified_by          UUID REFERENCES public.profiles(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, member_id)   -- one submission per member per round
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view their transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = member_id OR
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = transactions.group_id AND g.collector_id = auth.uid()
    )
  );

CREATE POLICY "Members can submit transactions"
  ON public.transactions FOR INSERT WITH CHECK (auth.uid() = member_id);

CREATE POLICY "Collectors can verify transactions"
  ON public.transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.ekub_groups g
      WHERE g.id = transactions.group_id AND g.collector_id = auth.uid()
    )
  );

-- ============================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.ekub_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rounds_updated_at BEFORE UPDATE ON public.rounds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STORAGE BUCKETS (run separately if needed)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage RLS for receipts bucket
-- CREATE POLICY "Authenticated users can upload receipts"
--   ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'receipts');
-- CREATE POLICY "Members can view receipts in their groups"
--   ON storage.objects FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'receipts');

-- ============================================================
-- FUNCTION: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
