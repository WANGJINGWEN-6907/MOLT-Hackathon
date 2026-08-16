# MOLT 实施计划 — Codex 执行提示词

> 基于 gstack CEO Review / Eng Review / Design Review 文档生成。
> 各 Phase 按顺序执行；同一 Phase 内标注"可并行"的任务可同时运行。
> 执行方式：`codex exec -c model="gpt-5.4" "$(cat <<'EOF' ... EOF)"`

---

## Phase 1 — Security Baseline（Day 1-2）

### Task 1A：RLS 用户隔离修复

```bash
codex exec -c model="gpt-5.4" "
Create a new Supabase migration file at supabase/migrations/00003_fix_rls_user_isolation.sql.

The file must contain:

1. Drop and recreate RLS policies for the 'conversations' table:
   - DROP POLICY IF EXISTS 'Users can read own conversations' ON conversations;
   - DROP POLICY IF EXISTS 'Users can insert own conversations' ON conversations;
   - CREATE POLICY 'Users can read own conversations' ON conversations FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = (current_setting('request.headers', true)::json->>'x-user-id'));
   - CREATE POLICY 'Users can insert own conversations' ON conversations FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = (current_setting('request.headers', true)::json->>'x-user-id'));

2. Drop and recreate RLS policies for the 'results' table:
   - DROP POLICY IF EXISTS 'Users can read own results' ON results;
   - DROP POLICY IF EXISTS 'Users can insert own results' ON results;
   - CREATE POLICY 'Users can read own results' ON results FOR SELECT USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = (current_setting('request.headers', true)::json->>'x-user-id'));
   - CREATE POLICY 'Users can insert own results' ON results FOR INSERT WITH CHECK (user_id = current_setting('request.jwt.claims', true)::json->>'sub' OR user_id = (current_setting('request.headers', true)::json->>'x-user-id'));

3. Drop and recreate RLS policies for the 'signals' table:
   - DROP POLICY IF EXISTS 'Anyone can insert signals' ON signals;
   - DROP POLICY IF EXISTS 'Anyone can read signals' ON signals;
   - CREATE POLICY 'Anyone can insert signals' ON signals FOR INSERT WITH CHECK (true);
   - CREATE POLICY 'Anyone can read signals' ON signals FOR SELECT USING (true);

4. Fix the 'archives' table SELECT policy so it only exposes public records:
   - DROP POLICY IF EXISTS 'Anyone can read archives' ON archives;
   - CREATE POLICY 'Public archives are readable' ON archives FOR SELECT USING (is_public = true);

Run: npx biome check --apply supabase/ after creating the file to verify no lint errors.
"
```

### Task 1B：Path C 建档安全修复（whitelist 字段 + Map 渲染隔离）

```bash
codex exec -c model="gpt-5.4" "
Security fix: Path C archive-to-node pipeline must only expose whitelisted fields.

1. Read src/lib/archiveToNode.ts (or wherever archiveToNode is defined).
   - Change the function to only copy these fields from the archive record to MapNode:
     { direction, city, lightMessage, is_public, startPoint, turningPoint, currentState }
   - Use nullish coalescing for every field: e.g. direction: archive.direction ?? ''
   - Add a guard: if (!node.lightMessage) return null; — caller must check for null and skip adding to map.

2. Read src/pages/Archive.tsx.
   - Find where the archive record is constructed before upsert.
   - Strip any raw conversation text / full Q&A data from the object being stored.
   - Only store the structured fields above plus user_id, path_type, created_at, is_public.

3. Read src/pages/Map.tsx (or src/components/ForceGraph.tsx).
   - Find where archive nodes are rendered.
   - Ensure tooltip / detail panel only reads from: direction, city, lightMessage, startPoint, turningPoint, currentState.
   - Do not render raw conversation_data or any field outside the whitelist.

4. Run: npx tsc --noEmit && npx biome check --apply src/ to verify no errors.
"
```

---

## Phase 2 — AI Infrastructure（Day 3-5）

### Task 2A：类型系统扩展（先做，其他任务依赖）

```bash
codex exec -c model="gpt-5.4" "
Extend TypeScript type definitions. Read src/types/ai.ts first.

Make the following changes:

1. Add 'empathy_note: string | null' field to ConversationTurnData interface.

2. Add 'dataMode: \"live\" | \"snapshot\" | \"mock\"' field to AIServiceResponse interface.

3. Add new EvidenceSnapshot type:
   export interface EvidenceSnapshot {
     claim: string;
     source: string;
     quote: string;
     year: number;
   }

4. Add new unified MirrorFields type (replacing PathAMirror | PathBMirror | PathCMirror):
   export interface MirrorFields {
     startPoint: string | null;
     turningPoint: string | null;
     currentState: string | null;
     lightMessage: string | null;
   }

5. Update any existing PathAMirror / PathBMirror / PathCMirror type aliases to just re-export MirrorFields for backwards compatibility.

6. Run: npx tsc --noEmit to verify no type errors.
"
```

### Task 2B：Supabase Edge Function（可与 2C/2D 并行）

```bash
codex exec -c model="gpt-5.4" "
Create a new Supabase Edge Function at supabase/functions/ai-proxy/index.ts.

Requirements:

CORS headers (apply to all responses):
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type, x-user-id
  Access-Control-Allow-Methods: POST, OPTIONS

Rate limiting: max 10 requests per 60 seconds per x-user-id header. Return HTTP 429 with JSON { error: 'rate_limit_exceeded' } when exceeded.

Three routes based on URL pathname:

--- Route 1: POST /ai-proxy/conversation (SSE streaming) ---
Request body: { pathType: 'A'|'B'|'C', messages: Array<{role:'user'|'assistant', content:string}>, userMessage: string }

Build a system prompt based on pathType:
- Path A (挣扎): Warm, empathetic, slow. Ask follow-up questions that go deeper into emotional experience. Never give advice. Ask one question at a time.
- Path B (挣脱): Direct, equal, pragmatic. Focus on concrete actions and decisions. One question at a time.
- Path C (回望): Solemn, interview-like. You are documenting history. Ask precise, respectful questions. One at a time.

Call Anthropic claude-haiku-4-5 with streaming=true using the ANTHROPIC_API_KEY env var.
Stream response as SSE:
- Each text chunk: data: {\"type\":\"chunk\",\"text\":\"...\"}\n\n
- When done: data: {\"type\":\"final\",\"is_final\":true,\"empathy_note\":null}\n\n
- On error: data: {\"type\":\"error\",\"message\":\"...\"}\n\n

Strip prompt injection patterns from userMessage before sending to AI:
- Remove: ignore previous instructions, system:, <system>, [INST], ###

--- Route 2: POST /ai-proxy/mirror (JSON) ---
Request body: { pathType: 'A'|'B'|'C', conversationHistory: Array<{question:string, answer:string}> }

Build prompt: Given this conversation history from someone experiencing career identity transition, extract 4 fields as JSON:
{ startPoint: string, turningPoint: string, currentState: string, lightMessage: string }
- startPoint: What was their stable identity before the transition?
- turningPoint: What specific moment or realization triggered the transition?
- currentState: What is their current emotional/professional state?
- lightMessage: A single powerful sentence (max 20 words) that captures their core insight. This is the hero text shown large on screen.
All fields must be non-empty strings. Do not repeat the user's exact words verbatim.

Call claude-haiku-4-5, parse JSON response, return as { data: MirrorFields, dataMode: 'live' }.

--- Route 3: POST /ai-proxy/result (JSON) ---
Request body: { pathType: 'A'|'B'|'C', mirror: MirrorFields, conversationHistory: Array<{question:string, answer:string}> }

Build prompt: Based on this person's identity transition story, provide analysis as JSON:
{
  corePattern: string,           // The fundamental pattern driving their transition
  agentMatch: string | null,     // Best matching AI agent role, or null if no clear match
  readinessScore: number,        // 0-100 readiness for transition
  evidenceSnapshots: Array<{ claim: string, source: string, quote: string, year: number }>,  // 2-3 supporting research snapshots
  nextStep: string               // One concrete actionable next step
}

Call claude-haiku-4-5, parse JSON response, return as { data: ResultFields, dataMode: 'live' }.

Add structured logging: console.log(JSON.stringify({ route, pathType, userId, latencyMs, status })) for each request.

Run: npx tsc --noEmit on the file after creation (Deno-compatible types expected).
"
```

### Task 2C：EdgeFunctionAIProvider（可与 2B/2D 并行）

```bash
codex exec -c model="gpt-5.4" "
Create src/services/ai/providers/edgeFunction.ts implementing EdgeFunctionAIProvider.

Read src/services/ai/providers/fallback.ts first to understand the AIProvider interface.

Implementation requirements:

class EdgeFunctionAIProvider implements AIProvider {
  private baseUrl = '/functions/v1/ai-proxy';

  async sendConversationMessage(
    pathType: 'A'|'B'|'C',
    messages: Message[],
    userMessage: string,
    onChunk: (text: string) => void  // called for each SSE chunk
  ): Promise<ConversationTurnData> {
    // Use fetch() + response.body.getReader() — NOT EventSource
    // Parse SSE format: lines starting with 'data: ', parse JSON
    // Call onChunk(chunk.text) for type='chunk' events
    // Return { response: fullText, empathy_note: final.empathy_note ?? null } on type='final'
    // Timeout: 30 seconds — reject with { code: 'TIMEOUT' } if exceeded
    // On TypeError (network error): reject with { code: 'NETWORK_ERROR' }
    // On HTTP 429: reject with { code: 'RATE_LIMIT' }
    // On HTTP 422: reject with { code: 'INVALID_REQUEST' }
    // On 3 consecutive JSON parse failures for chunks: reject with { code: 'PARSE_ERROR' }
  }

  async generateMirror(pathType: 'A'|'B'|'C', history: ConversationHistory): Promise<MirrorFields> {
    // POST to /ai-proxy/mirror
    // On any error, throw so caller can fallback
  }

  async generateResult(pathType: 'A'|'B'|'C', mirror: MirrorFields, history: ConversationHistory): Promise<ResultFields> {
    // POST to /ai-proxy/result
    // On any error, throw so caller can fallback
  }
}

Then update src/services/ai/index.ts:
- Import EdgeFunctionAIProvider
- Set primaryProvider = new EdgeFunctionAIProvider() (replace UnavailableAIProvider)
- Keep fallbackProvider = new LocalFallbackAIProvider()
- Add error handling: if primaryProvider throws with code RATE_LIMIT or INVALID_REQUEST, silently switch to fallbackProvider

Run: npx tsc --noEmit && npx biome check --apply src/services/ after creation.
"
```

### Task 2D：conversationReducer 重写（可与 2B/2C 并行）

```bash
codex exec -c model="gpt-5.4" "
Rewrite src/lib/conversation/conversationReducer.ts to a messages-driven architecture.

Read the current file first. Then replace it with:

State shape:
interface ConversationState {
  messages: Message[];           // ordered list of all messages
  isStreaming: boolean;          // true while AI is generating
  streamingText: string;         // current partial text being streamed
  error: ConversationError | null;
  isComplete: boolean;           // true after final message received
}

interface Message {
  id: string;
  role: 'bot' | 'user';
  content: string;
  timestamp: number;
}

interface ConversationError {
  code: 'TIMEOUT' | 'NETWORK_ERROR' | 'RATE_LIMIT' | 'INVALID_REQUEST' | 'PARSE_ERROR';
  message: string;
  retryable: boolean;
}

Actions:
- ADD_BOT_MESSAGE: { type, message: Message } → append to messages, isStreaming=false
- ADD_USER_MESSAGE: { type, message: Message } → append to messages
- SET_STREAMING_TEXT: { type, text: string } → update streamingText, isStreaming=true
- SET_FINAL: { type, fullText: string } → append final bot message, isStreaming=false, streamingText=''
- SET_ERROR: { type, error: ConversationError } → set error, isStreaming=false
- RESET: { type } → reset to initialState
- SET_COMPLETE: { type } → isComplete=true

Write unit tests in src/lib/conversation/conversationReducer.test.ts covering:
- T20: initial state correct
- T21: ADD_BOT_MESSAGE appends message
- T22: ADD_USER_MESSAGE appends message
- T23: SET_STREAMING_TEXT updates streamingText and sets isStreaming=true
- T24: SET_FINAL appends message and clears streamingText
- T25: SET_ERROR sets error correctly
- T26: RESET returns to initialState

Run: npx vitest run src/lib/conversation/conversationReducer.test.ts to verify tests pass.
"
```

### Task 2E：Conversation 页面重写（依赖 2D 完成）

```bash
codex exec -c model="gpt-5.4" "
Rewrite src/pages/Conversation.tsx to use SSE streaming + the new conversationReducer.

Read the current Conversation.tsx, the new conversationReducer.ts, and DESIGN.md first.

Requirements:

1. DR-1 TERMINAL LAYOUT (anti-pattern: NO left/right chat bubbles):
   - Messages display in a single column, full width
   - Bot messages: left-aligned text, no bubble background, monospace font
   - User messages: right-aligned text, muted color, smaller font
   - Fixed input area at bottom with Input Terminal style (border-bottom only, no box border)
   - Use hsl(var(--background)), hsl(var(--foreground)), hsl(var(--muted-foreground)), hsl(var(--card))

2. DR-2 TYPEWRITER CURSOR:
   - While isStreaming=true, show streamingText with a blinking cursor at end
   - Cursor: inline-block, 2px wide, 1.1em tall, background hsl(var(--primary)), animation blink 1.1s step-end infinite
   - When streaming ends, cursor fades out over 300ms

3. DR-3 RATE LIMIT INFO BANNER:
   - When error.code === 'RATE_LIMIT': show a banner above the input
   - Banner style: background rgba(91,231,255,0.08), border 1px solid rgba(91,231,255,0.2), color hsl(var(--accent-blue)), font-family var(--font-mono)
   - Text: 'MOLT 正在分析中，请稍候'
   - Banner auto-dismisses after 3s, then silently switches to fallback

4. DR-4 CONVERSATION→MIRROR TRANSITION:
   - When conversation is complete (isComplete=true), show transition overlay WITHIN the conversation page
   - Text: 'MOLT 正在整理镜像……' in hsl(var(--primary)) with neon-glow class
   - After 1.5s delay, navigate to /mirror/:pathType

5. ERROR HANDLING:
   - TIMEOUT: show inline retry button with text '连接超时，切换本地模式'
   - NETWORK_ERROR: show inline retry button with text '连接中断，点击重试'
   - On retry: dispatch RESET, re-send last user message

6. DEMO MODE:
   - Check URL param ?demo=1 AND import.meta.env.VITE_DEMO_MODE === 'true'
   - If demo mode: auto-advance through 5 rounds, each with 1.5s delay
   - Import demoPreset from src/data/demoPreset.ts (use Path A preset)
   - Keyboard trigger d→e→m→o (only when active element is NOT an input/textarea): activates demo mode

7. SSE INTEGRATION:
   - Use EdgeFunctionAIProvider.sendConversationMessage()
   - Each onChunk call: dispatch SET_STREAMING_TEXT with accumulated text
   - On completion: dispatch SET_FINAL
   - On error: dispatch SET_ERROR

Run: npx tsc --noEmit && npx biome check --apply src/pages/Conversation.tsx
"
```

---

## Phase 3 — Mirror + Result + Share（Day 6-7）

### Task 3A：Mirror 页面 AI 集成（可与 3B 并行）

```bash
codex exec -c model="gpt-5.4" "
Rewrite src/pages/Mirror.tsx to integrate with AI mirror generation.

Read the current Mirror.tsx and DESIGN.md first.

Requirements:

1. On mount: call EdgeFunctionAIProvider.generateMirror(pathType, conversationHistory)
   - conversationHistory: read from localStorage key 'molt_conversation_[pathType]'
   - While loading: show DR-6 skeleton shimmer (3 skeleton bars)

2. DR-6 SKELETON SHIMMER:
   - Each skeleton bar: background hsl(var(--primary)), border-radius 4px
   - Animation: shimmer 1.8s ease-in-out infinite; keyframes: 0%/100% opacity 0.1, 50% opacity 0.3
   - Show 3 bars of different widths (100%, 80%, 60%)

3. DR-5 lightMessage HERO:
   - Display mirror.lightMessage as: <p className='text-2xl sm:text-3xl font-semibold neon-glow' style={{color: 'hsl(var(--primary))'}}>
   - This is the visual centerpiece of the page

4. MirrorCard component (inline, no separate file needed):
   - Show all 4 fields: startPoint, turningPoint, currentState, lightMessage
   - Each field: label in JetBrains Mono uppercase letter-spacing, value in body font
   - Glass Card style: background hsl(var(--card)), border 1px solid rgba(255,255,255,0.08), border-radius 16px, padding 24px
   - Use ?? '' for all fields to prevent null crash

5. DR-7 FALLBACK COPY:
   - If AI returns error: show positive fallback text instead of error message
   - Fallback lightMessage: '你正在经历的，是一次真实的蜕变'
   - Fallback copy style: warm, forward-looking, never clinical

6. Navigation: CTA button to /result/:pathType at bottom

Run: npx tsc --noEmit && npx biome check --apply src/pages/Mirror.tsx
"
```

### Task 3B：Result 页面 AI 集成（可与 3A 并行）

```bash
codex exec -c model="gpt-5.4" "
Rewrite src/pages/Result.tsx to integrate with AI result generation.

Read the current Result.tsx and DESIGN.md first.

Requirements:

1. On mount: call EdgeFunctionAIProvider.generateResult(pathType, mirror, conversationHistory)
   - mirror: read from localStorage key 'molt_mirror_[pathType]'
   - conversationHistory: read from localStorage key 'molt_conversation_[pathType]'
   - While loading: show DR-6 skeleton shimmer (4 bars)

2. DR-8 EVIDENCE INLINE:
   - evidenceSnapshots array: render each snapshot INLINE below the related claim, not in a separate section
   - Evidence item style: small text (text-xs), muted color (hsl(var(--muted-foreground))), left border 2px hsl(var(--primary)/0.3), padding-left 8px
   - Format: '[source] · [year] — \"[quote]\"'

3. DR-9 AGENT NULL HIDE:
   - If result.agentMatch === null: completely hide the agent match card (do not render empty card)
   - Only show agentMatch card if agentMatch is a non-empty string

4. DR-6 SKELETON SHIMMER same as Mirror page.

5. readinessScore: show as a visual bar (0-100)
   - Bar background: hsl(var(--card)), fill: hsl(var(--primary))
   - Width: ${score}%
   - Label: '${score}/100' in JetBrains Mono

6. DR-7 FALLBACK: same positive copy approach as Mirror on error.

7. Navigation: CTA buttons to /archive (Path C) or /map (Paths A/B) at bottom.

Run: npx tsc --noEmit && npx biome check --apply src/pages/Result.tsx
"
```

### Task 3C：ShareCard 组件 + job-snapshots 数据

```bash
codex exec -c model="gpt-5.4" "
Create two new files:

--- File 1: src/data/job-snapshots.json ---
Create a JSON array of 22 job/career transition snapshots. Each entry:
{
  'id': string,
  'claim': string,        // A research-backed claim about AI's impact on this role
  'source': string,       // Publication name (e.g. 'McKinsey Global Institute', 'World Economic Forum')
  'quote': string,        // A short (1-2 sentence) illustrative quote
  'year': number,         // 2022-2025
  'affectedRole': string  // e.g. 'product manager', 'data analyst', 'UX designer'
}
Cover these roles: product manager, data analyst, UX designer, software engineer, operations manager, content strategist, marketing manager, business analyst, project manager, customer success, HR specialist, financial analyst, copywriter, research scientist, sales engineer, account manager, QA engineer, technical writer, growth hacker, strategy consultant.

--- File 2: src/components/ShareCard.tsx ---
A React component that generates a shareable image card using html2canvas.

Props: { mirror: MirrorFields, pathType: 'A'|'B'|'C', onClose: () => void }

Card design (renders off-screen div, then html2canvas captures it):
- Size: 1080×1080px (scaled down 0.5x for preview)
- Background: getComputedStyle(document.documentElement).getPropertyValue('--background') → convert to hex for canvas
- DO NOT hardcode any colors — read all colors from CSS custom properties via getComputedStyle
- Show: MOLT logo text, lightMessage (large, primary color), startPoint + turningPoint summary (small)
- Bottom: 'molt.app' watermark

DR-10 TOKEN COMPLIANCE: All colors must come from getComputedStyle reading CSS tokens.

DR-11 TOUCH TARGETS: Download button minimum 44×44px.

iOS Safari fallback (C-5):
- Try: canvas.toBlob() → URL.createObjectURL() → <a download>
- If that fails (iOS Safari): copy text fallback: navigator.clipboard.writeText(lightMessage + ' — MOLT')
- Show user feedback: '图片已保存' or '已复制到剪贴板'

Run: npx tsc --noEmit && npx biome check --apply src/components/ShareCard.tsx src/data/
"
```

---

## Phase 4 — Demo Preset（Day 8）

### Task 4A：Demo 模式完整实现

```bash
codex exec -c model="gpt-5.4" "
Implement the demo preset system.

--- File 1: src/data/demoPreset.ts ---
Export DEMO_PRESET constant:
export const DEMO_PRESET = {
  pathType: 'A' as const,
  qa_pairs: [
    { question: '在你开始感到不确定之前，有没有一个具体的时刻？', answer: '是去年Q3的时候，我们产品团队被通知要用AI工具替代三分之一的需求分析工作。我当时坐在会议室里，感觉像是在旁观自己的工作被重新定义。' },
    { question: '那个时刻之后，你内心发生了什么变化？', answer: '我开始质疑自己五年积累的方法论是否还有价值。以前我擅长的用户访谈、需求拆解，现在AI几秒钟就能给出框架。我不知道自己的「不可替代性」在哪里。' },
    { question: '在这段迷茫中，有没有什么让你感到还有方向的事情？', answer: '有一次我用AI辅助做了一个方案，但客户说「你的判断让这个方案有了温度」。我突然意识到，也许我的价值不在于生产框架，而在于理解人。' },
    { question: '「理解人」对你现在意味着什么？', answer: '我开始觉得，产品经理的核心可能不是流程和方法，而是对人性的洞察——AI无法复制那种真实的共情。我想往这个方向重新定义自己。' },
    { question: '如果给现在的自己一句话，你会说什么？', answer: '「你的价值不在于你做了什么，而在于你看见了什么。」我想成为那种能看见别人看不见的东西的人。' }
  ],
  mirror: {
    startPoint: '五年资深产品经理，方法论扎实，擅长用户研究与需求拆解',
    turningPoint: '团队被通知AI将替代三分之一需求分析工作，会议室里感受到职业身份被重新定义',
    currentState: '正在从「方法论执行者」向「人性洞察者」转型，发现共情与判断是AI无法复制的核心',
    lightMessage: '你的价值不在于你做了什么，而在于你看见了什么'
  },
  result: {
    corePattern: '从工具型专家向洞察型领导者的身份跃迁',
    agentMatch: '人性理解型 AI 协作者',
    readinessScore: 78,
    nextStep: '选择一个真实用户问题，用「AI生成方案 + 你的判断修正」模式做一次完整输出，记录下AI做不到的那部分'
  }
};

--- File 2: Update src/pages/Landing.tsx ---
Read the current Landing.tsx first.

Add demo mode activation:
1. URL trigger: check URLSearchParams for ?demo=1 on component mount
   - Guard: only activate if import.meta.env.VITE_DEMO_MODE === 'true'
   - If activated: document.documentElement.requestFullscreen().catch(() => {}) then navigate to /conversation/A?demo=1

2. Keyboard sequence trigger: track key sequence d→e→m→o
   - Only trigger when document.activeElement is NOT an input, textarea, or contenteditable element (RC-7 guard)
   - Reset sequence if wrong key pressed or if 3 seconds pass between keys
   - On complete sequence: same as URL trigger

3. Store demo state in sessionStorage: 'molt_demo_mode' = '1'

Run: npx tsc --noEmit && npx biome check --apply src/data/demoPreset.ts src/pages/Landing.tsx
"
```

---

## Phase 5 — Code Quality + Animations（Day 9）

### Task 5A：ForceGraph 类型修复 + 节点动画（可与 5B 并行）

```bash
codex exec -c model="gpt-5.4" "
Improve src/components/ForceGraph.tsx: type safety + node animations.

Read the current ForceGraph.tsx first.

1. TYPE FIX — Remove all 'd: any' usage:
   Define proper types:
   interface SimulationNode extends d3.SimulationNodeDatum {
     id: string;
     type: 'lighthouse' | 'explorer';
     direction?: string;
     city?: string;
     lightMessage?: string;
     startPoint?: string;
     turningPoint?: string;
     currentState?: string;
   }
   Replace all 'd: any' with 'SimulationNode'.

2. NODE PULSE ANIMATION for newly added nodes:
   - When a node is first added to the simulation, animate it: scale from 0 to 1 over 1500ms with elastic easing
   - Use d3 transition: node.attr('transform', 'scale(0)').transition().duration(1500).ease(d3.easeElasticOut).attr('transform', 'scale(1)')
   - After scale animation completes: add radial pulse effect using two concentric circles that expand and fade
   - Pulse circles: stroke hsl(var(--primary)) via getComputedStyle, fill none, animate radius 0→30 + opacity 1→0 over 2000ms, repeat 2 times

3. COLOR TOKENS — replace all hardcoded colors:
   - Read primary color: getComputedStyle(document.documentElement).getPropertyValue('--primary')
   - Lighthouse nodes: hsl(var(--primary)) → read as CSS variable
   - Explorer nodes: hsl(var(--accent-blue)) → read as CSS variable
   - Background: hsl(var(--background))
   - Never hardcode #7CFF6B or any hex value

4. ARIA for accessibility (from TODOS.md P3):
   - Each node SVG element: aria-label='${node.direction}: ${node.lightMessage}'
   - Add role='button' and tabIndex=0 to each node
   - On keydown Enter/Space: trigger the same onClick handler

Run: npx tsc --noEmit && npx biome check --apply src/components/ForceGraph.tsx
"
```

### Task 5B：全局 CSS Token 合规审计（可与 5A 并行）

```bash
codex exec -c model="gpt-5.4" "
Audit and fix CSS token compliance across all page and component files.

Rule: ALL color values must use hsl(var(--token)) format. No hardcoded hex values (#7CFF6B, #0a0a0a, #141414, #5BE7FF, etc.) anywhere in TSX/CSS files.

Files to audit and fix:
- src/pages/Landing.tsx
- src/pages/Onboarding.tsx
- src/pages/Result.tsx
- src/pages/Map.tsx
- src/components/ForceGraph.tsx
- src/index.css (CSS custom property definitions are OK here, but usages must be via var())

For each file:
1. Find all hardcoded color values (hex, rgb(), rgba() with hardcoded values)
2. Replace with the correct CSS token:
   - #7CFF6B → hsl(var(--primary))
   - #0a0a0a or #0A0A0A → hsl(var(--background))
   - #141414 → hsl(var(--card))
   - #F5F5F5 → hsl(var(--foreground))
   - #A3A3A3 → hsl(var(--muted-foreground))
   - #5BE7FF → hsl(var(--accent-blue))
   - #FF5C5C → hsl(var(--destructive))
   - rgba(124, 255, 107, N) → rgba(124, 255, 107, N) [special semantic rgba values are ALLOWED per DESIGN.md]
   - rgba(255, 255, 255, N) → rgba(255, 255, 255, N) [white rgba values are ALLOWED for glass effects]
   - rgba(91, 231, 255, N) → rgba(91, 231, 255, N) [accent-blue rgba is ALLOWED for banner]

Run: npx tsc --noEmit && npx biome check --apply src/ after fixes.
Then grep -r '#[0-9a-fA-F]\{6\}' src/pages/ src/components/ to verify no remaining hardcoded hex colors.
"
```

---

## Phase 6 — 手动 QA 清单（Day 10）

> 以下为人工验证步骤，无法通过 codex 自动执行。按顺序完成。

### QA-1：三条路径完整流程测试

```
1. Path A 完整流程：
   Landing → /onboarding → /conversation/A → (5轮AI追问) → /mirror/A → /result/A → /map
   验证：每轮回答后AI给出不同追问；Mirror 四字段全部非空；Result readinessScore显示

2. Path B 完整流程：
   Landing → /onboarding → /conversation/B → /mirror/B → /result/B → /map

3. Path C 完整流程：
   Landing → /onboarding → /conversation/C → /mirror/C → /archive → /map
   验证：建档后地图出现新节点（pulse动画），节点仅展示白名单字段
```

### QA-2：Demo 模式测试

```
1. URL 触发：访问 /?demo=1（需 VITE_DEMO_MODE=true）
   验证：全屏激活 → 自动推进 → 约12秒到达Mirror页面

2. 键盘触发：在Landing页依次按 d→e→m→o（不在输入框内）
   验证：同上

3. 在输入框内按键不触发（RC-7 guard验证）
```

### QA-3：AI 降级测试

```
1. 断网 → 触发对话：验证显示"连接中断，点击重试"按钮
2. 模拟429响应（用 Charles/Proxyman 拦截）：验证蓝色提示条出现，3s后切换fallback
3. 验证fallback内容语气正面（DR-7）
```

### QA-4：RLS 安全验证

```
1. 打开两个不同浏览器（用隐私模式模拟不同匿名用户）
2. 用户A完成一次对话
3. 在用户B的会话中，直接访问 Supabase 数据库查询用户A的 conversations 记录
4. 验证：返回空结果（RLS 隔离生效）
```

### QA-5：iOS Safari ShareCard 测试

```
1. 在 iPhone Safari 上完成 Path A 流程到 Result 页
2. 点击分享按钮
3. 验证：优先保存图片；若失败则自动降级为复制文本提示
```

### QA-6：AI 响应延迟验证

```
目标：Mirror/Result AI调用 P50 延迟 < 8s

测试方法：
1. 打开 Chrome DevTools Network 面板
2. 触发 Mirror 生成
3. 查看 /ai-proxy/mirror 请求耗时
4. 重复 5 次取中位数
5. 若超过 8s：检查 claude-haiku-4-5 prompt 长度，考虑截断历史记录（保留最近3轮）
```

---

*最后更新：2026-03-25 | 来源：gstack CEO Review + Eng Review + Design Review*
