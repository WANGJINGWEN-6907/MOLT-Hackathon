-- 创建用户表（匿名用户）
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建对话记录表
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  path_type TEXT NOT NULL CHECK (path_type IN ('A', 'B', 'C')),
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建结果表（Path A/B）
CREATE TABLE IF NOT EXISTS results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  path_type TEXT NOT NULL CHECK (path_type IN ('A', 'B')),
  pressure_level TEXT NOT NULL CHECK (pressure_level IN ('low', 'medium', 'high')),
  pressure_description TEXT,
  abilities JSONB DEFAULT '[]'::jsonb,
  market_signals TEXT,
  action_suggestions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建灯塔建档表（Path C）
CREATE TABLE IF NOT EXISTS archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  trajectory_summary TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建信号表
CREATE TABLE IF NOT EXISTS signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  signal_content TEXT NOT NULL CHECK (char_length(signal_content) <= 50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_path_type ON conversations(path_type);
CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_archives_user_id ON archives(user_id);
CREATE INDEX IF NOT EXISTS idx_archives_is_public ON archives(is_public);
CREATE INDEX IF NOT EXISTS idx_signals_sender_id ON signals(sender_id);
CREATE INDEX IF NOT EXISTS idx_signals_receiver_id ON signals(receiver_id);