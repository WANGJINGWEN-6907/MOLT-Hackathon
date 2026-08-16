import type { Archive, Conversation, PathType, PressureLevel, Result, Signal, User } from '@/types';
import {
  createOrGetLocalUser,
  deleteLocalConversationsByUserAndPath,
  deleteLocalConversationsFromQuestionIndex,
  getLocalArchiveByUser,
  getLocalConversationsByUser,
  getLocalPublicArchives,
  getLocalResultByUser,
  getLocalSignalsByReceiver,
  getLocalUserById,
  saveLocalArchive,
  saveLocalConversation,
  saveLocalResult,
  sendLocalSignal,
} from './localStore';
import { isSupabaseConfigured } from './runtime';
import { supabase } from './supabase';

// ==================== 用户相关 ====================

/**
 * 创建或获取匿名用户
 */
export async function createOrGetUser(anonymousId: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    return createOrGetLocalUser(anonymousId);
  }

  // 先尝试查询是否存在
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('anonymous_id', anonymousId)
    .maybeSingle();

  if (existingUser) {
    return existingUser;
  }

  // 不存在则创建
  const { data, error } = await supabase
    .from('users')
    .insert({ anonymous_id: anonymousId })
    .select()
    .maybeSingle();

  if (error) {
    console.error('创建用户失败:', error);
    return null;
  }

  return data;
}

/**
 * 根据用户 ID 获取用户信息
 */
export async function getUserById(userId: string): Promise<User | null> {
  if (!isSupabaseConfigured) {
    return getLocalUserById(userId);
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('获取用户失败:', error);
    return null;
  }

  return data;
}

// ==================== 对话相关 ====================

/**
 * 删除用户指定路径的所有对话记录
 */
export async function deleteConversationsByUserAndPath(userId: string, pathType: PathType): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return deleteLocalConversationsByUserAndPath(userId, pathType);
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId)
    .eq('path_type', pathType);

  if (error) {
    console.error('删除对话记录失败:', error);
    return false;
  }

  return true;
}

/**
 * 删除用户指定路径从某问题序号开始的对话记录（用于回退重新编辑）
 */
export async function deleteConversationsFromQuestionIndex(
  userId: string,
  pathType: PathType,
  fromIndex: number
): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return deleteLocalConversationsFromQuestionIndex(userId, pathType, fromIndex);
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId)
    .eq('path_type', pathType)
    .gte('question_index', fromIndex);

  if (error) {
    console.error('删除对话记录失败:', error);
    return false;
  }

  return true;
}

/**
 * 保存对话记录
 */
export async function saveConversation(
  userId: string,
  pathType: PathType,
  questionIndex: number,
  questionText: string,
  answerText: string
): Promise<Conversation | null> {
  if (!isSupabaseConfigured) {
    return saveLocalConversation(userId, pathType, questionIndex, questionText, answerText);
  }

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      path_type: pathType,
      question_index: questionIndex,
      question_text: questionText,
      answer_text: answerText
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('保存对话失败:', error);
    return null;
  }

  return data;
}

/**
 * 获取用户的对话记录
 */
export async function getConversationsByUser(userId: string, pathType: PathType): Promise<Conversation[]> {
  if (!isSupabaseConfigured) {
    return getLocalConversationsByUser(userId, pathType);
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('path_type', pathType)
    .order('question_index', { ascending: true });

  if (error) {
    console.error('获取对话记录失败:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

// ==================== 结果相关 ====================

/**
 * 保存结果（Path A/B）
 */
export async function saveResult(
  userId: string,
  pathType: 'A' | 'B',
  pressureLevel: PressureLevel,
  pressureDescription: string,
  abilities: string[],
  marketSignals: string,
  actionSuggestions: string[]
): Promise<Result | null> {
  if (!isSupabaseConfigured) {
    return saveLocalResult(
      userId,
      pathType,
      pressureLevel,
      pressureDescription,
      abilities,
      marketSignals,
      actionSuggestions
    );
  }

  const { data, error } = await supabase
    .from('results')
    .insert({
      user_id: userId,
      path_type: pathType,
      pressure_level: pressureLevel,
      pressure_description: pressureDescription,
      abilities: abilities,
      market_signals: marketSignals,
      action_suggestions: actionSuggestions
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('保存结果失败:', error);
    return null;
  }

  return data;
}

/**
 * 获取用户的结果
 */
export async function getResultByUser(userId: string, pathType: 'A' | 'B'): Promise<Result | null> {
  if (!isSupabaseConfigured) {
    return getLocalResultByUser(userId, pathType);
  }

  const { data, error } = await supabase
    .from('results')
    .select('*')
    .eq('user_id', userId)
    .eq('path_type', pathType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('获取结果失败:', error);
    return null;
  }

  return data;
}

// ==================== 灯塔建档相关 ====================

/**
 * 保存灯塔建档（Path C）
 */
export async function saveArchive(
  userId: string,
  trajectorySummary: string,
  isPublic: boolean
): Promise<Archive | null> {
  if (!isSupabaseConfigured) {
    return saveLocalArchive(userId, trajectorySummary, isPublic);
  }

  const { data, error } = await supabase
    .from('archives')
    .insert({
      user_id: userId,
      trajectory_summary: trajectorySummary,
      is_public: isPublic
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('保存建档失败:', error);
    return null;
  }

  return data;
}

/**
 * 获取所有公开的建档
 */
export async function getPublicArchives(): Promise<Archive[]> {
  if (!isSupabaseConfigured) {
    return getLocalPublicArchives();
  }

  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取公开建档失败:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}

/**
 * 获取用户的建档
 */
export async function getArchiveByUser(userId: string): Promise<Archive | null> {
  if (!isSupabaseConfigured) {
    return getLocalArchiveByUser(userId);
  }

  const { data, error } = await supabase
    .from('archives')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('获取用户建档失败:', error);
    return null;
  }

  return data;
}

// ==================== 信号相关 ====================

/**
 * 发送信号
 */
export async function sendSignal(
  senderId: string,
  receiverId: string,
  signalContent: string
): Promise<Signal | null> {
  if (!isSupabaseConfigured) {
    return sendLocalSignal(senderId, receiverId, signalContent);
  }

  if (signalContent.length > 50) {
    console.error('信号内容超出字数限制');
    return null;
  }

  const { data, error } = await supabase
    .from('signals')
    .insert({
      sender_id: senderId,
      receiver_id: receiverId,
      signal_content: signalContent
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('发送信号失败:', error);
    return null;
  }

  return data;
}

/**
 * 获取发送给某用户的信号
 */
export async function getSignalsByReceiver(receiverId: string): Promise<Signal[]> {
  if (!isSupabaseConfigured) {
    return getLocalSignalsByReceiver(receiverId);
  }

  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .eq('receiver_id', receiverId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('获取信号失败:', error);
    return [];
  }

  return Array.isArray(data) ? data : [];
}
