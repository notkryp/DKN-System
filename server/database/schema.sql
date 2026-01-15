-- Digital Knowledge Network (DKN) schema aligned to the PDF Type Model
-- Uses Supabase auth.users as the identity source.

-- Extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Role types (lookup)
CREATE TABLE IF NOT EXISTS role_types (
  code TEXT PRIMARY KEY,
  description TEXT
);

INSERT INTO role_types (code, description) VALUES
  ('Consultant', 'Daily user searching and consuming content'),
  ('ExpertContributor', 'Creates and validates content'),
  ('KnowledgeSupervisor', 'Runs training and adoption'),
  ('SystemAdmin', 'Manages infrastructure and access'),
  ('GovernanceCouncilMember', 'Audits and curates content'),
  ('TopManager', 'Reviews KPIs')
ON CONFLICT (code) DO NOTHING;

-- Users
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  email TEXT,
  region_code TEXT DEFAULT 'GLOBAL',
  role_code TEXT REFERENCES role_types(code) DEFAULT 'Consultant',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Knowledge categories and tags
CREATE TABLE IF NOT EXISTS knowledge_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS tag_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  tag_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Duplicate clusters (forward declared for FK in knowledge_items)
CREATE TABLE IF NOT EXISTS duplicate_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detection_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Knowledge items
CREATE TABLE IF NOT EXISTS knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT,
  item_type TEXT,
  status TEXT DEFAULT 'draft', -- draft | in_review | published | rejected | needs_changes
  owner_id UUID NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  content_uri TEXT,
  version_number INTEGER DEFAULT 1,
  region_code TEXT DEFAULT 'GLOBAL',
  duplicate_cluster_id UUID REFERENCES duplicate_clusters(id),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ
);

-- Many-to-many relationships
CREATE TABLE IF NOT EXISTS item_categories (
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  category_id UUID REFERENCES knowledge_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, category_id)
);

CREATE TABLE IF NOT EXISTS item_tags (
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tag_values(id) ON DELETE CASCADE,
  PRIMARY KEY (item_id, tag_id)
);

-- Ratings, bookmarks, flags
CREATE TABLE IF NOT EXISTS item_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS flags_outdated (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  note TEXT,
  status TEXT DEFAULT 'open', -- open | resolved
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ
);

-- Governance audits
CREATE TABLE IF NOT EXISTS governance_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  decision TEXT NOT NULL, -- Approved | Rejected | NeedsChanges
  notes TEXT,
  audit_date TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Duplicate cluster items
CREATE TABLE IF NOT EXISTS duplicate_cluster_items (
  cluster_id UUID REFERENCES duplicate_clusters(id) ON DELETE CASCADE,
  item_id UUID REFERENCES knowledge_items(id) ON DELETE CASCADE,
  PRIMARY KEY (cluster_id, item_id)
);

-- Training and adoption
CREATE TABLE IF NOT EXISTS training_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL,
  mode TEXT,
  scheduled_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'requested', -- requested | scheduled | completed | canceled
  trainer_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS training_participants (
  event_id UUID REFERENCES training_events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  attendance_status TEXT DEFAULT 'invited', -- invited | attended | no_show
  PRIMARY KEY (event_id, user_id)
);

-- KPI snapshots
CREATE TABLE IF NOT EXISTS kpi_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE,
  period_end DATE,
  duplication_rate NUMERIC,
  average_onboarding_weeks NUMERIC,
  collaboration_index NUMERIC,
  created_by UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- User feedback
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
  feedback_type TEXT DEFAULT 'general', -- general | bug | feature
  message TEXT NOT NULL,
  status TEXT DEFAULT 'submitted', -- submitted | in_progress | under_review | acknowledged | resolved
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Triggers to keep updated_at in sync
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_accounts_updated_at
BEFORE UPDATE ON user_accounts
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_knowledge_items_updated_at
BEFORE UPDATE ON knowledge_items
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_training_events_updated_at
BEFORE UPDATE ON training_events
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

CREATE TRIGGER set_feedback_updated_at
BEFORE UPDATE ON feedback
FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Auto-create user_accounts on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_accounts (id, email, username, role_code, region_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Consultant'),
    COALESCE(NEW.raw_user_meta_data->>'region', 'GLOBAL')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flags_outdated ENABLE ROW LEVEL SECURITY;
ALTER TABLE governance_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE duplicate_cluster_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_report_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policies: Users manage themselves
CREATE POLICY "Users can view themselves" ON user_accounts FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update themselves" ON user_accounts FOR UPDATE USING (auth.uid() = id);

-- Knowledge items
CREATE POLICY "Published or owner can read" ON knowledge_items FOR SELECT
USING (status = 'published' OR owner_id = auth.uid());
CREATE POLICY "Owners insert" ON knowledge_items FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update" ON knowledge_items FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners delete" ON knowledge_items FOR DELETE USING (owner_id = auth.uid());

-- Supporting relations inherit owner perms via joins
CREATE POLICY "Owner manages item tags" ON item_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_tags.item_id AND ki.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_tags.item_id AND ki.owner_id = auth.uid())
);

CREATE POLICY "Owner manages item categories" ON item_categories FOR ALL USING (
  EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_categories.item_id AND ki.owner_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = item_categories.item_id AND ki.owner_id = auth.uid())
);

CREATE POLICY "Authenticated can read categories" ON knowledge_categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can read tags" ON tag_values FOR SELECT USING (true);

-- Ratings/bookmarks/flags by authenticated users
CREATE POLICY "Authenticated insert ratings" ON item_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or self read ratings" ON item_ratings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self read bookmarks" ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Self delete bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated insert flags" ON flags_outdated FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or flagger read flags" ON flags_outdated FOR SELECT USING (
  auth.uid() = user_id OR EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = flags_outdated.item_id AND ki.owner_id = auth.uid())
);

-- Governance audits (simplified: reviewer must be authenticated)
CREATE POLICY "Authenticated insert audits" ON governance_audits FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Owner or reviewer read audits" ON governance_audits FOR SELECT USING (
  auth.uid() = reviewer_id OR EXISTS (SELECT 1 FROM knowledge_items ki WHERE ki.id = governance_audits.item_id AND ki.owner_id = auth.uid())
);

-- Duplicate clusters (read-only to authenticated)
CREATE POLICY "Auth select duplicate clusters" ON duplicate_clusters FOR SELECT USING (true);
CREATE POLICY "Auth select duplicate cluster items" ON duplicate_cluster_items FOR SELECT USING (true);

-- Training events/participants (simplified: any authenticated can read/insert)
CREATE POLICY "Auth select training events" ON training_events FOR SELECT USING (true);
CREATE POLICY "Auth insert training events" ON training_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update training events" ON training_events FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Auth select training participants" ON training_participants FOR SELECT USING (true);
CREATE POLICY "Auth insert training participants" ON training_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Auth update training participants" ON training_participants FOR UPDATE USING (auth.uid() IS NOT NULL);

-- KPI snapshots (TopManager role ideally; simplified to authenticated read and creator insert)
CREATE POLICY "Auth select kpi" ON kpi_report_snapshots FOR SELECT USING (true);
CREATE POLICY "Creator insert kpi" ON kpi_report_snapshots FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Feedback
CREATE POLICY "Auth insert feedback" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Self or admin read feedback" ON feedback FOR SELECT USING (
  auth.uid() = user_id OR 
  EXISTS (SELECT 1 FROM user_accounts WHERE id = auth.uid() AND role_code IN ('SystemAdmin', 'TopManager'))
);
CREATE POLICY "Admin update feedback" ON feedback FOR UPDATE USING (
  EXISTS (SELECT 1 FROM user_accounts WHERE id = auth.uid() AND role_code IN ('SystemAdmin', 'TopManager'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS knowledge_items_owner_idx ON knowledge_items(owner_id);
CREATE INDEX IF NOT EXISTS knowledge_items_status_idx ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS knowledge_items_region_idx ON knowledge_items(region_code);
CREATE INDEX IF NOT EXISTS item_tags_item_idx ON item_tags(item_id);
CREATE INDEX IF NOT EXISTS item_tags_tag_idx ON item_tags(tag_id);
CREATE INDEX IF NOT EXISTS item_categories_item_idx ON item_categories(item_id);
CREATE INDEX IF NOT EXISTS item_categories_category_idx ON item_categories(category_id);
CREATE INDEX IF NOT EXISTS item_ratings_item_idx ON item_ratings(item_id);
CREATE INDEX IF NOT EXISTS flags_outdated_item_idx ON flags_outdated(item_id);
CREATE INDEX IF NOT EXISTS governance_audits_item_idx ON governance_audits(item_id);
CREATE INDEX IF NOT EXISTS duplicate_cluster_items_cluster_idx ON duplicate_cluster_items(cluster_id);
CREATE INDEX IF NOT EXISTS training_events_status_idx ON training_events(status);
CREATE INDEX IF NOT EXISTS training_participants_event_idx ON training_participants(event_id);
CREATE INDEX IF NOT EXISTS kpi_report_snapshots_period_idx ON kpi_report_snapshots(period_start, period_end);
