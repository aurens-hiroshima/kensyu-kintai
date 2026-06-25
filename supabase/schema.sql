-- ============================================================
-- オーレンス勤怠管理システム　Supabase スキーマ
-- Supabase > SQL Editor に貼り付けて実行してください
-- ============================================================

-- 1. プロフィールテーブル（Supabase Auth の users を拡張）
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   text,
  department  text,
  role        text DEFAULT 'employee' CHECK (role IN ('employee', 'manager', 'admin')),
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 2. 勤怠打刻テーブル
CREATE TABLE IF NOT EXISTS public.kintai_records (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          text NOT NULL CHECK (type IN ('出勤', '退勤', '外出', '戻り')),
  stamped_at    timestamptz NOT NULL DEFAULT now(),
  latitude      float8,
  longitude     float8,
  location_name text,
  note          text,
  created_at    timestamptz DEFAULT now()
);

-- インデックス（検索高速化）
CREATE INDEX IF NOT EXISTS idx_kintai_user_stamped ON public.kintai_records (user_id, stamped_at DESC);

-- ============================================================
-- Row Level Security（RLS）設定
-- ============================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kintai_records ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールのみ読み書き可能
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- kintai_records: 自分のレコードのみ読み書き可能
CREATE POLICY "kintai_select_own" ON public.kintai_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "kintai_insert_own" ON public.kintai_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 新規ユーザー登録時にプロフィールを自動作成するトリガー
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
