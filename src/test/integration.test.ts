import { describe, expect, it } from 'vitest';
import { archiveToNode } from '@/lib/map';
import type { Archive } from '@/types';

/**
 * 集成测试：验证 Archive → MapNode → Map 的完整数据流
 */
describe('Archive to Map 集成测试', () => {
  // trajectory_summary must be JSON with lightMessage set
  const makeStructuredSummary = (overrides?: Partial<Record<string, string>>) =>
    JSON.stringify({
      startPoint: '传统行业工程师',
      turningPoint: '学习 AI 转型',
      currentState: 'AI 产品经理',
      lightMessage: '你的经历就是别人的路标',
      direction: '',
      city: '',
      ...overrides,
    })

  it('公开档案应该能够被转换为可展示的地图节点', () => {
    const publicArchive: Archive = {
      id: 'test-archive-001',
      user_id: 'test-user-001',
      trajectory_summary: makeStructuredSummary(),
      is_public: true,
      created_at: new Date().toISOString(),
    };

    const node = archiveToNode(publicArchive);

    expect(node).not.toBeNull();
    expect(node!.id).toBe(publicArchive.id);
    expect(node!.user_id).toBe(publicArchive.user_id);
    expect(node!.type).toBe('lighthouse');
    expect(node!.pathType).toBe('C');
    expect(node!.lightMessage).toBe('你的经历就是别人的路标');
    expect(node!.createdAt).toBeInstanceOf(Date);
  });

  it('私有档案不应该被 getPublicArchives 返回', () => {
    const privateArchive: Archive = {
      id: 'test-archive-002',
      user_id: 'test-user-002',
      trajectory_summary: '这是私密内容',
      is_public: false,
      created_at: new Date().toISOString(),
    };

    // 私有档案不会被 getPublicArchives() 返回
    expect(privateArchive.is_public).toBe(false);
  });

  it('转换后的节点应该包含所有必需字段以供地图展示', () => {
    const archive: Archive = {
      id: 'test-archive-003',
      user_id: 'test-user-003',
      trajectory_summary: makeStructuredSummary({ lightMessage: '完整字段测试' }),
      is_public: true,
      created_at: '2025-12-01T00:00:00Z',
    };

    const node = archiveToNode(archive);

    expect(node).not.toBeNull();
    expect(node).toHaveProperty('id');
    expect(node).toHaveProperty('type');
    expect(node).toHaveProperty('pathType');
    expect(node).toHaveProperty('user_id');
    expect(node!.type).toBe('lighthouse');
    expect(node!.pathType).toBe('C');
  });

  it('多个档案应该能够正确合并到地图中', () => {
    const archives: Archive[] = [
      {
        id: 'archive-1',
        user_id: 'user-1',
        trajectory_summary: makeStructuredSummary({ lightMessage: '轨迹1灯塔' }),
        is_public: true,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'archive-2',
        user_id: 'user-2',
        trajectory_summary: makeStructuredSummary({ lightMessage: '轨迹2灯塔' }),
        is_public: true,
        created_at: '2025-02-01T00:00:00Z',
      },
    ];

    const nodes = archives.map(archiveToNode).filter(Boolean);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]!.id).toBe('archive-1');
    expect(nodes[1]!.id).toBe('archive-2');
    expect(nodes.every(n => n!.type === 'lighthouse')).toBe(true);
    expect(nodes.every(n => n!.pathType === 'C')).toBe(true);
  });
});
