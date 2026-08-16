import * as d3 from 'd3';
import React, { useCallback, useEffect, useRef } from 'react';
import type { MapNode } from '@/types';

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  type?: 'lighthouse' | 'explorer';
  pathType: 'A' | 'B' | 'C';
  user_id?: string;
  direction?: string;
  city?: string;
  lightMessage?: string;
  startPoint?: string;
  turningPoint?: string;
  currentState?: string;
  visibility?: 'full' | 'partial' | 'minimal';
}

interface ForceGraphProps {
  nodes: MapNode[];
  currentUserId?: string;
  onNodeClick: (node: MapNode) => void;
}

function resolveToken(token: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  return `hsl(${value})`;
}

function supportsSvgTransformTransitions(): boolean {
  if (typeof document === 'undefined') return false;

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement & {
    transform?: { baseVal?: { consolidate?: () => unknown } };
  };

  return typeof group.transform?.baseVal?.consolidate === 'function';
}

/**
 * D3.js 力导向图组件
 * 修复：节点初始位置散开（pre-warm + 嵌套 g 动画），添加 +/- 缩放按钮
 */
export const ForceGraph: React.FC<ForceGraphProps> = ({ nodes, currentUserId, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const canAnimateTransforms = supportsSvgTransformTransitions();
  // Store zoom behavior and svg selection for button handlers
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null);

  const handleZoomIn = useCallback(() => {
    if (!zoomRef.current || !svgSelRef.current) return;
    svgSelRef.current.transition().duration(250).call(zoomRef.current.scaleBy, 1.4);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!zoomRef.current || !svgSelRef.current) return;
    svgSelRef.current.transition().duration(250).call(zoomRef.current.scaleBy, 1 / 1.4);
  }, []);

  const handleZoomReset = useCallback(() => {
    if (!zoomRef.current || !svgSelRef.current) return;
    svgSelRef.current.transition().duration(400).call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const primaryColor = resolveToken('--primary');
    const accentBlue = resolveToken('--accent-blue');
    const destructiveColor = resolveToken('--destructive');
    const mutedFg = resolveToken('--muted-foreground');
    const borderColor = resolveToken('--border');

    const svg = d3.select(svgRef.current);
    svgSelRef.current = svg;
    const width = svgRef.current.clientWidth || 800;
    const height = svgRef.current.clientHeight || 600;

    svg.selectAll('*').remove();

    // Pre-scatter nodes so they don't all start at origin
    const simNodes: SimulationNode[] = nodes.map((n) => ({
      ...n,
      x: width / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.6,
      y: height / 2 + (Math.random() - 0.5) * Math.min(width, height) * 0.6,
    }));

    const simulation = d3.forceSimulation<SimulationNode>(simNodes)
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Pre-warm: run 100 ticks synchronously so nodes start spread out
    simulation.tick(100);
    simulation.alpha(0.3).restart();

    const g = svg.append('g');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Outer g: position controlled by tick
    // Inner g: scale animation (independent of position — no conflict with tick)
    const nodeGroup = g.append('g')
      .selectAll<SVGGElement, SimulationNode>('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('cursor', 'pointer')
      .attr('role', 'button')
      .attr('tabindex', '0')
      .attr('aria-label', (d: SimulationNode) =>
        `${d.direction ?? '探索中'}: ${d.lightMessage ?? ''}`.trim(),
      )
      // Position set immediately from pre-warmed coordinates
      .attr('transform', (d: SimulationNode) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      .on('click', (_event, d: SimulationNode) => onNodeClick(d as MapNode))
      .on('keydown', (_event: KeyboardEvent, d: SimulationNode) => {
        if (_event.key === 'Enter' || _event.key === ' ') {
          _event.preventDefault();
          onNodeClick(d as MapNode);
        }
      });

    // Inner g for scale entrance animation — does NOT touch translate
    const innerGroup = nodeGroup.append('g')
      .attr('transform', 'scale(0)');

    // Start scale animation independently (doesn't block appending circles)
    const runPulseRings = (group: d3.Selection<SVGGElement, SimulationNode, d3.BaseType, unknown>) => {
      for (let i = 0; i < 2; i++) {
        group.append('circle')
          .attr('r', 0)
          .attr('fill', 'none')
          .attr('stroke', primaryColor)
          .attr('stroke-width', 1.5)
          .attr('opacity', 1)
          .transition()
          .delay(i * 400)
          .duration(2000)
          .attr('r', 30)
          .attr('opacity', 0)
          .remove();
      }
    };

    if (canAnimateTransforms) {
      innerGroup
        .transition()
        .duration(600)
        .ease(d3.easeBackOut.overshoot(1.2))
        .attr('transform', 'scale(1)')
        .on('end', function () {
          runPulseRings(d3.select<SVGGElement, SimulationNode>(this as SVGGElement));
        });
    } else {
      innerGroup.attr('transform', 'scale(1)');
    }

    // Circles and labels go on innerGroup (the scale-animated layer)
    const getFillColor = (d: SimulationNode): string => {
      if (d.user_id === currentUserId) return primaryColor;
      if (d.type === 'lighthouse' || d.pathType === 'C') return primaryColor;
      if (d.type === 'explorer' || d.pathType === 'B') return accentBlue;
      return destructiveColor;
    };

    (innerGroup as unknown as d3.Selection<SVGGElement, SimulationNode, SVGGElement, unknown>)
      .append('circle')
      .attr('r', (d: SimulationNode) => (d.type === 'lighthouse' ? 16 : 12))
      .attr('fill', (d: SimulationNode) => getFillColor(d))
      .attr('stroke', (d: SimulationNode) =>
        d.user_id === currentUserId ? primaryColor : borderColor,
      )
      .attr('stroke-width', (d: SimulationNode) => (d.user_id === currentUserId ? 3 : 1))
      .attr('opacity', 0.9)
      .style('filter', (d: SimulationNode) =>
        d.user_id === currentUserId ? `drop-shadow(0 0 10px ${primaryColor})` : 'none',
      )
      .on('mouseover', function (this: SVGCircleElement) {
        const node = d3.select<SVGCircleElement, SimulationNode>(this).datum();
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', node.type === 'lighthouse' ? 20 : 16)
          .attr('opacity', 1);
      })
      .on('mouseout', function (this: SVGCircleElement) {
        const node = d3.select<SVGCircleElement, SimulationNode>(this).datum();
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', node.type === 'lighthouse' ? 16 : 12)
          .attr('opacity', 0.9);
      });

    nodeGroup
      .filter((d: SimulationNode) => !!(d.type === 'lighthouse' && d.direction))
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 30)
      .attr('fill', mutedFg)
      .attr('font-family', 'sans-serif')
      .attr('font-size', '11px')
      .style('pointer-events', 'none')
      .text((d: SimulationNode) => d.direction || '');

    // Tick updates outer g position only — no conflict with inner scale animation
    simulation.on('tick', () => {
      nodeGroup.attr('transform', (d: SimulationNode) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [canAnimateTransforms, currentUserId, nodes, onNodeClick]);

  const btnStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(10,10,10,0.8)',
    color: 'hsl(var(--foreground))',
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '600px' }}>
      <svg
        ref={svgRef}
        style={{ width: '100%', height: '100%', touchAction: 'none', minHeight: '600px' }}
      />
      {/* Zoom controls */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" onClick={handleZoomIn} style={btnStyle} title="放大">＋</button>
        <button type="button" onClick={handleZoomOut} style={btnStyle} title="缩小">－</button>
        <button type="button" onClick={handleZoomReset} style={{ ...btnStyle, fontSize: 13 }} title="重置">⟲</button>
      </div>
    </div>
  );
};
