import type { Archive, MapNode } from '@/types';

/**
 * 将 Archive 数据转换为安全的 MapNode 格式（白名单字段）
 * trajectory_summary 存储为 JSON，包含结构化字段（非原始对话内容）
 * 返回 null 表示该 archive 不适合在地图上展示
 */
export function archiveToNode(archive: Archive): MapNode | null {
  // 解析 trajectory_summary JSON（新格式）
  let structured: Record<string, string> = {}
  try {
    const parsed = JSON.parse(archive.trajectory_summary)
    if (typeof parsed === 'object' && parsed !== null) {
      structured = parsed as Record<string, string>
    }
  } catch {
    // 旧格式（纯文本摘要）— 无法安全提取结构化字段，跳过
    return null
  }

  const node: MapNode = {
    id: archive.id,
    user_id: archive.user_id,
    type: 'lighthouse',
    pathType: 'C',
    direction: structured.direction ?? '',
    city: structured.city ?? '',
    lightMessage: structured.lightMessage ?? '',
    is_public: archive.is_public,
    startPoint: structured.startPoint ?? '',
    turningPoint: structured.turningPoint ?? '',
    currentState: structured.currentState ?? '',
    createdAt: new Date(archive.created_at),
  };

  // Guard: nodes without a lightMessage are not display-worthy
  if (!node.lightMessage) return null;

  return node;
}
