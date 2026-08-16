/**
 * 匿名用户 ID 管理
 * 使用 localStorage 存储和获取匿名用户 ID
 */

const ANONYMOUS_ID_KEY = 'molt_anonymous_id';

/**
 * 生成匿名用户 ID
 */
function generateAnonymousId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 获取或创建匿名用户 ID
 */
export function getOrCreateAnonymousId(): string {
  try {
    const existingId = localStorage.getItem(ANONYMOUS_ID_KEY);
    if (existingId) {
      return existingId;
    }

    const newId = generateAnonymousId();
    localStorage.setItem(ANONYMOUS_ID_KEY, newId);
    return newId;
  } catch (error) {
    console.error('localStorage 操作失败:', error);
    // 如果 localStorage 不可用，返回临时 ID
    return generateAnonymousId();
  }
}

/**
 * 清除匿名用户 ID（用于测试）
 */
export function clearAnonymousId(): void {
  try {
    localStorage.removeItem(ANONYMOUS_ID_KEY);
  } catch (error) {
    console.error('清除匿名 ID 失败:', error);
  }
}
