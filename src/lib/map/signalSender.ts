// 信号发送逻辑模块
import type { MapNode } from '@/types';

/**
 * 检查节点是否可以接收信号
 * @param node 目标节点
 * @param currentUserId 当前用户 ID
 * @returns 是否可接收信号
 */
export function canReceiveSignal(node: MapNode, currentUserId: string | null): boolean {
  // 节点必须有 user_id
  if (!node.user_id) {
    return false;
  }
  // 不能给自己发信号
  if (currentUserId && node.user_id === currentUserId) {
    return false;
  }
  return true;
}

/**
 * 验证信号内容
 * @param content 信号内容
 * @returns { valid: boolean, error?: string }
 */
export function validateSignalContent(content: string): { valid: boolean; error?: string } {
  const trimmed = content.trim();

  // v3.2: first contact is signal-only, so empty content is allowed.
  if (!trimmed) {
    return { valid: true };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: '信号内容不能超过 50 字' };
  }

  return { valid: true };
}

/**
 * 信号发送状态
 */
export type SignalSendStatus = 'idle' | 'sending' | 'sent' | 'error';

/**
 * 获取节点是否接受过当前用户的信号（需要从外部状态管理）
 * 这是一个纯函数，用于 UI 状态判断
 */
export function getSignalButtonState(
  node: MapNode,
  currentUserId: string | null,
  sentSignals: Set<string>
): { canSend: boolean; isSent: boolean; reason?: string } {
  if (!currentUserId) {
    return { canSend: false, isSent: false, reason: '请先登录' };
  }

  if (!node.user_id) {
    return { canSend: false, isSent: false, reason: '该用户未开放联系' };
  }

  if (node.user_id === currentUserId) {
    return { canSend: false, isSent: false, reason: '不能给自己发信号' };
  }

  if (sentSignals.has(node.user_id)) {
    return { canSend: false, isSent: true };
  }

  return { canSend: true, isSent: false };
}
