import { beforeEach, describe, expect, it } from 'vitest';
import {
  createOrGetLocalUser,
  deleteLocalConversationsByUserAndPath,
  getLocalConversationsByUser,
  getLocalPublicArchives,
  resetLocalDatabase,
  saveLocalArchive,
  saveLocalConversation,
  sendLocalSignal,
} from './localStore';

describe('db/localStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetLocalDatabase();
  });

  it('persists conversations in question order', async () => {
    const user = await createOrGetLocalUser('anon-local-user');

    await deleteLocalConversationsByUserAndPath(user!.id, 'A');
    await saveLocalConversation(user!.id, 'A', 1, 'Q2', '第二个回答');
    await saveLocalConversation(user!.id, 'A', 0, 'Q1', '第一个回答');

    const conversations = await getLocalConversationsByUser(user!.id, 'A');

    expect(conversations).toHaveLength(2);
    expect(conversations.map((item) => item.question_index)).toEqual([0, 1]);
    expect(conversations.map((item) => item.answer_text)).toEqual(['第一个回答', '第二个回答']);
  });

  it('persists public archives and signals for local demo mode', async () => {
    const sender = await createOrGetLocalUser('anon-sender');
    const receiver = await createOrGetLocalUser('anon-receiver');

    const archive = await saveLocalArchive(receiver!.id, '一段公开轨迹', true);
    const signal = await sendLocalSignal(sender!.id, receiver!.id, '谢谢你留下这段经验。');
    const archives = await getLocalPublicArchives();

    expect(archive).not.toBeNull();
    expect(signal).not.toBeNull();
    expect(archives).toHaveLength(1);
    expect(archives[0].trajectory_summary).toContain('公开轨迹');
  });
});
