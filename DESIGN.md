# Design System — MOLT

## Product Context

- **What this is:** AI 时代"身份过渡期"叙事引擎。用户通过三条路径（挣扎/挣脱/回望）回答问题，获得 AI 生成的结构化镜像摘要与结果分析，并可公开建档在力导向地图上。
- **Who it's for:** 正在经历职业身份过渡期的用户（AI 浪潮冲击下的产品/技术/运营/设计从业者）
- **Space/industry:** 职业转型 + 心理叙事 + AI 工具；同类产品：传统生涯规划 App、疗愈社群
- **Project type:** Web app（React + Vite + Supabase），以 Hackathon 投资展示为交付目标

## Aesthetic Direction

- **Direction:** Cyber-Minimalism（赛博极简）——高对比度暗色线性美学，精密诊断引擎感，而非心理疗愈 App
- **Decoration level:** Intentional（有意味的装饰）——霓虹发光（Glow）+ 毛玻璃底（Glass）+ 发丝边框，每一处光都有意义，拒绝堆砌
- **Mood:** 专业硬核的黑色极简骨架下，通过细腻的微弱发光与弹性缓动提供人性化包容感。用户感受是：被精密诊断，而非被安慰。
- **Reference:** `docs/MOLT_UI_Design_Guide.md`（完整设计哲学原文）；`src/pages/Landing.tsx`（视觉标杆实现）

## Typography

- **Display/Hero:** JetBrains Mono 700 — 大标题、产品名称、力导向地图；强化"系统演算引擎"的硬核感
- **Heading:** JetBrains Mono 600 / body font 600 — 模块标题、lightMessage 主句（text-2xl sm:text-3xl + neon-glow）
- **Body ZH:** -apple-system → PingFang SC → Hiragino Sans GB → Microsoft YaHei → sans-serif — 对话题目、Mirror 字段、正文阅读；weight 400-500；line-height 1.6-1.8
- **UI/Labels:** JetBrains Mono 400-500 — 路径标签、时间戳、状态标识、进度文字；letter-spacing 0.1-0.15em
- **Code:** JetBrains Mono — 等同 UI/Labels 字体，无需额外字体
- **Loading:** Google Fonts CDN `https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap`
- **Scale:**
  - xs: 10-11px（caption、label、状态）
  - sm: 12-13px（次级说明、引用）
  - base: 14-16px（正文、对话内容）
  - lg: 18-20px（对话问题、重要说明）
  - xl: 24-26px（镜像字段 lightMessage）
  - 2xl: 28-32px（页面核心语句）
  - display: 48-120px（Landing hero、MOLT 品牌字）

## Color

- **Approach:** Restrained（克制）——1 个主色统治全局，颜色是稀缺资源，出现时意义完整
- **所有颜色必须引用 CSS token，禁止硬编码 hex 值**

### CSS Tokens（`src/index.css`）

| Token | HSL | Hex | 用途 |
|-------|-----|-----|------|
| `--background` | `0 0% 4%` | #0A0A0A | 全屏沉浸底层背景 |
| `--card` | `0 0% 8%` | #141414 | 卡片/面板底色，磨砂质感 |
| `--foreground` | `0 0% 98%` | #F5F5F5 | 主文字，核心内容 |
| `--muted-foreground` | `0 0% 60%` | #A3A3A3 | 次级说明、时间戳、状态 |
| `--primary` | `110 100% 72%` | #7CFF6B | 主强调色（荧光绿）：CTA、结论、Agent 确认 |
| `--primary-foreground` | `0 0% 4%` | #0A0A0A | 荧光绿背景上的深色文字 |
| `--accent-blue` | `188 100% 69%` | #5BE7FF | 次强调色（冰裂蓝）：系统连接中、逻辑重构、结构分形 |
| `--destructive` | `0 84% 60%` | #FF5C5C | 危险/高压警告，严格控制使用面积 |
| `--border` | `0 0% 20%` | — | 一般边框 |
| `--ring` | `110 100% 72%` | #7CFF6B | 焦点环（等同 primary） |

### 特殊语义色值（不在 token 中，直接用 rgba）

- 发丝边框：`rgba(255, 255, 255, 0.08)`
- 焦点晕染：`rgba(124, 255, 107, 0.4)`（Input terminal focus 时底边）
- 卡片顶边高光：`rgba(255, 255, 255, 0.15)`（Glass card 玻璃质感）

### 使用规范

```css
/* ✅ 正确 */
color: hsl(var(--primary));
background: hsl(var(--background));
border-color: rgba(124, 255, 107, 0.4);

/* ❌ 禁止 */
color: #7CFF6B;
background: #0a0a0a;
```

## Spacing

- **Base unit:** 8px
- **Density:** Comfortable（舒适）——保证信息密度的同时给呼吸感
- **Scale:**
  - 2xs: 4px
  - xs: 8px
  - sm: 12px
  - md: 16px
  - lg: 20-24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px
- **锁定规则：**
  - 卡片内边距：严格 `20px` 或 `24px`
  - 圆角（Glass card / 对话卡）：锁定 `16px`（`border-radius: var(--radius-card)`）
  - 按钮圆角：`8px`
  - 小圆角（chip、标签）：`4px` 或 `100px`（全圆）
- **移动端 touch target 最小 44×44px（DR-11）**

## Layout

- **Approach:** Hybrid（混合）
  - **Landing / 营销页：** 全幅沉浸式，页面即海报，单一聚焦视点，拒绝多列展示
  - **App 页（Conversation / Mirror / Result）：** 单列聚焦，`max-w-2xl` 居中，终端感
  - **Map 页：** 全屏 canvas，无任何分栏干扰
- **Grid:** 无固定列数，以 `max-width` + 居中为主，Map 页全屏
- **Max content width:** `max-w-2xl`（672px）for app pages；`max-w-4xl` for Landing
- **Border radius:**
  - Card / 对话容器：16px（锁定）
  - Button：8px
  - Chip / Badge：4px / full
  - Input terminal：0（无边框，只有底边）

## Motion

- **Approach:** Intentional（有意味的动效）——每一次动画都服务于"系统正在深思和重构"的隐喻
- **核心缓动：** `cubic-bezier(0.2, 0.8, 0.2, 1)`（弹簧阻尼，拒绝线性）
- **时长：**
  - micro: 50-100ms（光标闪烁、hover 状态）
  - short: 150-250ms（fade-in、状态切换）
  - medium: 250-400ms（页面转场、过渡动画 DR-4）
  - long: 400-700ms（Landing 首屏阶梯入场）
- **必备动效（P0）：**
  - `fade-in-up`：Landing 首屏标题与 CTA 阶梯式从下至上微浮淡入
  - Typewriter + 光标闪烁：SSE 打字速率 40 字/秒，光标 `|` 2px 宽，颜色 `hsl(var(--primary))`，消息完成后 300ms 渐隐（DR-2）
  - Skeleton shimmer：`hsl(var(--primary)/0.1)` → `hsl(var(--primary)/0.3)`，1.8s ease-in-out infinite（DR-6）
  - Conversation→Mirror 过渡动画：在对话页内展示"MOLT 正在整理镜像……"，Mirror AI 返回后自动跳转（DR-4）
- **节点律动：** 力导向图节点轻微呼吸动效（可降级为 CSS hover 高亮）

## Component Specifications

### Glass Card
```css
background: hsl(var(--card));
border: 1px solid rgba(255,255,255,0.08);
border-top-color: rgba(255,255,255,0.15); /* 顶边光泽高光 */
border-radius: 16px;
padding: 20px | 24px;
backdrop-filter: blur(12px); /* 移动端可降至 blur(8px) */
```

### Input Terminal（沉浸式输入）
```css
/* 无可见边框，只有底边 */
border: none;
border-bottom: 1px solid rgba(255,255,255,0.08);
background: transparent;
font-family: var(--font-mono);
caret-color: hsl(var(--primary));

/* Focus 状态 */
:focus {
  border-bottom-color: rgba(124,255,107,0.4);
  box-shadow: 0 2px 0 -1px rgba(124,255,107,0.3);
}
```

### 打字光标（Typewriter Cursor）
```css
display: inline-block;
width: 2px;
height: 1.1em;
background: hsl(var(--primary));
vertical-align: middle;
animation: blink 1.1s step-end infinite;
```

### lightMessage Hero（DR-5）
```tsx
<p className="text-2xl sm:text-3xl font-semibold neon-glow text-primary">
  {mirror.lightMessage}
</p>
```

### Skeleton Loading（DR-6）
```css
.skeleton-bar {
  background: hsl(var(--primary));
  border-radius: 4px;
  animation: shimmer 1.8s ease-in-out infinite;
}
@keyframes shimmer {
  0%, 100% { opacity: 0.1; }
  50%       { opacity: 0.3; }
}
```

### Info Banner（DR-3，429 Rate Limit 提示）
```css
background: rgba(91,231,255,0.08);
border: 1px solid rgba(91,231,255,0.2);
color: hsl(var(--accent-blue));
font-family: var(--font-mono);
```
显示文案："MOLT 正在分析中，请稍候"；3s 后淡出，然后 silent fallback。

## Anti-Patterns（坚决避免）

- ❌ 左/右气泡式聊天 UI（微信/iMessage 风格）
- ❌ 明亮渐变糖果色系（水彩风、治愈风）
- ❌ 3 列 icon grid 功能介绍卡
- ❌ 拥挤顶栏/持久侧边导航
- ❌ 首屏铺满大段阅读说明文字
- ❌ 硬编码颜色值（必须用 `hsl(var(--token))`）
- ❌ 紫/蓝系渐变背景
- ❌ 彩色实心圆图标

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-25 | Initial design system formalized | 基于 docs/MOLT_UI_Design_Guide.md 整合，通过 /design-consultation |
| 2026-03-25 | DR-1: Conversation terminal layout | 移除左右气泡，改为终端风格，符合设计指南第 6.3 节 |
| 2026-03-25 | DR-2: Typewriter 40字/秒 + neon cursor | SSE 打字速率与光标规格锁定 |
| 2026-03-25 | DR-3: 429 info banner before fallback | 用 accent-blue 资讯条替代 silent fallback，保护 demo 可信度 |
| 2026-03-25 | DR-4: Conversation→Mirror transition | 在对话页内展示过渡动画，消除双重等待的情感断层 |
| 2026-03-25 | DR-5: lightMessage hero promotion | lightMessage 升为页面视觉主角（text-2xl + neon-glow） |
| 2026-03-25 | DR-6: Skeleton neon shimmer | Skeleton 使用 primary token，而非灰色，保持设计语言一致 |
| 2026-03-25 | DR-7: Positive fallback copy | 将 fallback 提示从临床语气改为正面引导文案 |
| 2026-03-25 | DR-8: Evidence snapshots inline | 废弃独立证据区块，内联在对应判断下方（学术引用风格） |
| 2026-03-25 | DR-9: Agent null card hidden | agentMatch === null 时隐藏整张卡，消除空白区块 |
| 2026-03-25 | DR-10: Share card token compliance | 画布颜色通过 getComputedStyle 读取 token 值，禁止硬编码 |
| 2026-03-25 | DR-11: Mobile touch targets 44×44px | 按钮/可点击元素最小 44×44px；iOS 软键盘用 visual-viewport |
