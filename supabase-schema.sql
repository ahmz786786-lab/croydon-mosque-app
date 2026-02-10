-- ================================================
-- CROYDON MOSQUE APP - SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- ADMINS TABLE (CREATE FIRST - referenced by other policies)
-- ================================================
CREATE TABLE admins (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can check if they're admin
CREATE POLICY "Users can check their own admin status"
  ON admins FOR SELECT
  USING (auth.uid() = user_id);

-- ================================================
-- ANNOUNCEMENTS TABLE
-- ================================================
CREATE TABLE announcements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'event', 'article')),
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can read announcements
CREATE POLICY "Announcements are viewable by everyone"
  ON announcements FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert announcements"
  ON announcements FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update announcements"
  ON announcements FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete announcements"
  ON announcements FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- ================================================
-- EVENTS TABLE
-- ================================================
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  type TEXT NOT NULL CHECK (type IN ('class', 'lecture', 'special', 'community')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Anyone can read events
CREATE POLICY "Events are viewable by everyone"
  ON events FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert events"
  ON events FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update events"
  ON events FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete events"
  ON events FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- ================================================
-- PRAYER TIMES TABLE (for admin updates)
-- ================================================
CREATE TABLE prayer_times (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prayer_name TEXT UNIQUE NOT NULL,
  azaan_time TEXT,
  salah_time TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prayer_times ENABLE ROW LEVEL SECURITY;

-- Anyone can read prayer times
CREATE POLICY "Prayer times are viewable by everyone"
  ON prayer_times FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update prayer times"
  ON prayer_times FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert prayer times"
  ON prayer_times FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Insert default prayer times
INSERT INTO prayer_times (prayer_name, azaan_time, salah_time) VALUES
  ('Fajr', '5:30 AM', '6:30 AM'),
  ('Zohr', '12:30 PM', '1:15 PM'),
  ('Asr', '3:00 PM', '3:30 PM'),
  ('Maghrib', '4:50 PM', '4:58 PM'),
  ('Isha', '7:30 PM', '8:00 PM'),
  ('Juma1', '12:15 PM', '12:25 PM'),
  ('Juma2', '1:15 PM', '1:25 PM');

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX idx_events_date ON events(date ASC);
CREATE INDEX idx_admins_user_id ON admins(user_id);

-- ================================================
-- DONATION CAMPAIGNS TABLE
-- ================================================
CREATE TABLE donation_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  raised DECIMAL(10,2) DEFAULT 0,
  goal DECIMAL(10,2) NOT NULL,
  color TEXT DEFAULT '#27AE60',
  is_active BOOLEAN DEFAULT true,
  donate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE donation_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can read campaigns
CREATE POLICY "Donation campaigns are viewable by everyone"
  ON donation_campaigns FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage donation campaigns"
  ON donation_campaigns FOR ALL
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Insert default campaigns
INSERT INTO donation_campaigns (name, raised, goal, color) VALUES
  ('General Donation', 15000, 50000, '#27AE60'),
  ('Madrasah Fund', 8500, 20000, '#F39C12'),
  ('Building Maintenance', 12000, 30000, '#3498DB'),
  ('Utilities & Bills', 5000, 15000, '#9B59B6');

CREATE INDEX idx_donation_campaigns_active ON donation_campaigns(is_active);

-- ================================================
-- PUSH NOTIFICATION TOKENS TABLE
-- ================================================
CREATE TABLE push_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT UNIQUE NOT NULL,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Anyone can insert their token
CREATE POLICY "Anyone can register push token"
  ON push_tokens FOR INSERT
  WITH CHECK (true);

-- Anyone can read their own token
CREATE POLICY "Tokens are viewable"
  ON push_tokens FOR SELECT
  USING (true);

-- ================================================
-- JANAZAH (FUNERAL) ANNOUNCEMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS janazah (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  deceased_name TEXT NOT NULL,
  body TEXT,
  description TEXT,
  prayer_date DATE,
  date DATE,
  prayer_time TEXT,
  time TEXT,
  burial_location TEXT,
  location TEXT,
  type TEXT DEFAULT 'janazah',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE janazah ENABLE ROW LEVEL SECURITY;

-- Anyone can read janazah announcements
CREATE POLICY "Janazah announcements are viewable by everyone"
  ON janazah FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert janazah"
  ON janazah FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update janazah"
  ON janazah FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete janazah"
  ON janazah FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE INDEX idx_janazah_created_at ON janazah(created_at DESC);
CREATE INDEX idx_janazah_prayer_date ON janazah(prayer_date DESC);

-- ================================================
-- NEWS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT DEFAULT 'news',
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE news ENABLE ROW LEVEL SECURITY;

-- Anyone can read news
CREATE POLICY "News are viewable by everyone"
  ON news FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert news"
  ON news FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update news"
  ON news FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can delete news"
  ON news FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE INDEX idx_news_created_at ON news(created_at DESC);

-- ================================================
-- ISLAMIC DATE SETTINGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS islamic_date_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  day_adjustment INTEGER DEFAULT 0, -- Days to add/subtract from calculated Hijri date (-2 to +2)
  manual_date_enabled BOOLEAN DEFAULT false, -- Whether to use manual date override
  manual_day INTEGER, -- Manual Hijri day (1-30)
  manual_month INTEGER, -- Manual Hijri month (1-12)
  manual_year INTEGER, -- Manual Hijri year
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE islamic_date_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read Islamic date settings
CREATE POLICY "Islamic date settings are viewable by everyone"
  ON islamic_date_settings FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update islamic date settings"
  ON islamic_date_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert islamic date settings"
  ON islamic_date_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Insert default settings (single row configuration)
INSERT INTO islamic_date_settings (day_adjustment, manual_date_enabled)
VALUES (0, false);

-- ================================================
-- MONTHLY CALENDAR TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS monthly_calendar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE monthly_calendar ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Monthly calendar is viewable by everyone"
  ON monthly_calendar FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update monthly calendar"
  ON monthly_calendar FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert monthly calendar"
  ON monthly_calendar FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Insert default row
INSERT INTO monthly_calendar (title, url, is_active)
VALUES ('Ramadan Calendar 2026', '', false);

-- ================================================
-- STATUS BAR (TICKER) TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS status_bar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message TEXT NOT NULL DEFAULT '',
  message_2 TEXT NOT NULL DEFAULT '',
  message_3 TEXT NOT NULL DEFAULT '',
  message_4 TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE status_bar ENABLE ROW LEVEL SECURITY;

-- Anyone can read status bar
CREATE POLICY "Status bar is viewable by everyone"
  ON status_bar FOR SELECT
  USING (true);

-- Only admins can update
CREATE POLICY "Admins can update status bar"
  ON status_bar FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert status bar"
  ON status_bar FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- Insert default row (single-row config like islamic_date_settings)
INSERT INTO status_bar (message, message_2, message_3, message_4, is_active)
VALUES ('', '', '', '', false);

-- ================================================
-- SETUP INSTRUCTIONS
-- ================================================
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Create an admin user in Authentication > Users
-- 3. Add the user to admins table:
--    INSERT INTO admins (user_id, email, name)
--    VALUES ('USER_UUID_HERE', 'admin@croydonmosque.com', 'Admin');

-- ================================================
-- ADD ADMIN USERS
-- ================================================
-- Run these statements to add admin access for the specified users:

INSERT INTO admins (user_id, email, name)
VALUES ('3d6ca6b6-338d-400d-b1e9-0e7fe0ae2c62', 'k0209312saqib@hotmail.co.uk', 'Saqib')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO admins (user_id, email, name)
VALUES ('cf969d77-ec39-4145-a600-661f6c7b8d8e', 'afzalhussen@gmail.com', 'Afzal Hussen')
ON CONFLICT (user_id) DO NOTHING;
