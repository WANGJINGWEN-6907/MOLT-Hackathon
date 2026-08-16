# MOLT TODOs

## P3: 地图节点无障碍访问

**What:** D3.js 力导向图 aria-label + 键盘导航支持

**Why:** 当前地图节点无 aria-label，无法被读屏软件读取，键盘用户也无法导航到个别节点查看转型轨迹。

**Pros:** 无障碍用户（包括视力障碍者）可访问公开建档内容；符合基础 a11y 实践。

**Cons:** D3.js SVG 的 aria 实现需要额外测试，特别是动态生成节点时需要响应式更新 aria 属性。

**Context:** 地图是 MOLT 核心的"社会证明"功能（66 个节点展示转型故事）。目前完全依赖鼠标悬停交互，键盘用户体验为零。为每个节点添加 `aria-label="${direction}: ${lightMessage}"` + Tab 键导航是最小可行方案。

**Effort:** S (human ~4h / CC ~15min)
**Priority:** P3
**Depends on:** ForceGraph.tsx 中 D3 节点类型已在 Eng Review 中明确需要修复（去掉 `d: any`）——先做类型修复再加 aria，顺手。
**Filed:** 2026-03-25 via /plan-design-review
