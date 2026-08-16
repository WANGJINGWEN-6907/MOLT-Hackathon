import { describe, expect, it } from 'vitest';
import type { Archive } from '@/types';
import { archiveToNode } from './archiveToNode';

const makeStructuredSummary = (fields: Record<string, string> = {}) =>
  JSON.stringify({
    lightMessage: '',
    direction: '',
    city: '',
    startPoint: '',
    turningPoint: '',
    currentState: '',
    ...fields,
  });

const makeArchive = (overrides: Partial<Archive> = {}): Archive => ({
  id: 'archive-1',
  user_id: 'user-1',
  trajectory_summary: makeStructuredSummary(),
  is_public: true,
  created_at: '2026-03-25T00:00:00Z',
  ...overrides,
});

describe('archiveToNode', () => {
  it('only returns whitelisted fields — no raw Q&A data leak', () => {
    const archive = makeArchive({
      trajectory_summary: makeStructuredSummary({
        lightMessage: '坚持',
        direction: '产品',
        city: '北京',
        startPoint: '起点',
        turningPoint: '转折',
        currentState: '现状',
      }),
    });
    const node = archiveToNode(archive);

    // Must NOT contain raw conversation data
    expect(node).not.toBeNull();
    expect(node!.summary).toBeUndefined();
    expect((node as any).trajectory_summary).toBeUndefined();

    // Whitelisted fields must exist
    expect(node!.type).toBe('lighthouse');
    expect(node!.pathType).toBe('C');
    expect(node!.direction).toBe('产品');
    expect(node!.city).toBe('北京');
    expect(node!.lightMessage).toBe('坚持');
    expect(node!.startPoint).toBe('起点');
    expect(node!.turningPoint).toBe('转折');
    expect(node!.currentState).toBe('现状');
  });

  it('returns null when lightMessage is empty string in JSON', () => {
    const archive = makeArchive({
      trajectory_summary: makeStructuredSummary({ lightMessage: '' }),
    });
    const node = archiveToNode(archive);
    expect(node).toBeNull();
  });

  it('returns null when trajectory_summary is plain text (old format)', () => {
    const archive = makeArchive({
      trajectory_summary: 'full conversation Q&A text that should NOT leak',
    });
    const node = archiveToNode(archive);
    expect(node).toBeNull();
  });

  it('returns null when trajectory_summary is invalid JSON', () => {
    const archive = makeArchive({ trajectory_summary: '{not valid json' });
    const node = archiveToNode(archive);
    expect(node).toBeNull();
  });

  it('uses nullish coalescing defaults — never returns undefined for whitelisted string fields', () => {
    const archive = makeArchive({
      trajectory_summary: makeStructuredSummary({ lightMessage: '加油' }),
    });
    const node = archiveToNode(archive);

    expect(node).not.toBeNull();
    expect(node!.direction).toBe('');
    expect(node!.city).toBe('');
    expect(node!.startPoint).toBe('');
    expect(node!.turningPoint).toBe('');
    expect(node!.currentState).toBe('');
  });
});
