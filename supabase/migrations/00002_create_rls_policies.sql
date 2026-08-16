-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;

-- users 表策略：任何人都可以插入和查询自己的记录
CREATE POLICY "Anyone can insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select users" ON users
  FOR SELECT USING (true);

-- conversations 表策略：任何人都可以插入和查询
CREATE POLICY "Anyone can insert conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select conversations" ON conversations
  FOR SELECT USING (true);

-- results 表策略：任何人都可以插入和查询
CREATE POLICY "Anyone can insert results" ON results
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select results" ON results
  FOR SELECT USING (true);

-- archives 表策略：任何人都可以插入，公开的可以查询
CREATE POLICY "Anyone can insert archives" ON archives
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select public archives" ON archives
  FOR SELECT USING (is_public = true);

-- signals 表策略：任何人都可以插入和查询
CREATE POLICY "Anyone can insert signals" ON signals
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can select signals" ON signals
  FOR SELECT USING (true);