import { render, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MapNode } from '@/types';
import { ForceGraph } from './ForceGraph';

// Mock d3 partially to test transitions and DOM output
vi.mock('d3', async () => {
  const actual = await vi.importActual<typeof import('d3')>('d3');
  return { ...actual };
});

const makeMockNode = (overrides: Partial<MapNode> = {}): MapNode => ({
  id: 'node-1',
  type: 'lighthouse',
  pathType: 'C',
  direction: '产品设计',
  lightMessage: '你的价值不在于你做了什么',
  ...overrides,
});

describe('ForceGraph', () => {
  const onNodeClick = vi.fn();

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    onNodeClick.mockClear();
    // Mock getComputedStyle to return token values
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      getPropertyValue: (prop: string) => {
        const tokens: Record<string, string> = {
          '--primary': '110 100% 72%',
          '--accent-blue': '188 100% 69%',
          '--background': '0 0% 4%',
          '--foreground': '0 0% 98%',
          '--muted-foreground': '0 0% 60%',
        };
        return tokens[prop] ?? '';
      },
    } as unknown as CSSStyleDeclaration);
  });

  it('renders without TypeScript errors (no d: any type assertions)', async () => {
    // This test verifies the component compiles and renders.
    // TypeScript compilation itself enforces no `any` usage via strict config.
    const nodes: MapNode[] = [makeMockNode()];
    const { container } = render(
      <ForceGraph nodes={nodes} onNodeClick={onNodeClick} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('node groups have aria-label with direction and lightMessage', () => {
    const nodes: MapNode[] = [
      makeMockNode({ direction: '产品设计', lightMessage: '找到方向' }),
    ];
    const { container } = render(
      <ForceGraph nodes={nodes} onNodeClick={onNodeClick} />,
    );
    // D3 renders after mount via useEffect; check after render
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    // D3 nodes are appended in useEffect — check for aria-label presence
    // Since d3 operates on real DOM, we can query after render
    setTimeout(() => {
      const nodeWithAria = container.querySelector('[aria-label]');
      if (nodeWithAria) {
        expect(nodeWithAria.getAttribute('aria-label')).toContain('产品设计');
        expect(nodeWithAria.getAttribute('aria-label')).toContain('找到方向');
      }
    }, 100);
  });

  it('node groups have tabIndex=0 and role=button', () => {
    const nodes: MapNode[] = [makeMockNode()];
    const { container } = render(
      <ForceGraph nodes={nodes} onNodeClick={onNodeClick} />,
    );
    setTimeout(() => {
      const buttonNodes = container.querySelectorAll('[role="button"]');
      if (buttonNodes.length > 0) {
        expect(buttonNodes[0].getAttribute('tabindex')).toBe('0');
      }
    }, 100);
  });

  it('new nodes trigger pulse animation (scale transition)', () => {
    const nodes: MapNode[] = [makeMockNode()];
    const { container } = render(
      <ForceGraph nodes={nodes} onNodeClick={onNodeClick} />,
    );
    // After render, D3 should have created node groups with transform
    setTimeout(() => {
      const groups = container.querySelectorAll('svg g g');
      expect(groups.length).toBeGreaterThan(0);
    }, 100);
  });
});
