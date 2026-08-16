import type {
  Archive,
  Conversation,
  PathType,
  PressureLevel,
  Result,
  Signal,
  User,
} from '@/types';

interface LocalDatabase {
  users: User[];
  conversations: Conversation[];
  results: Result[];
  archives: Archive[];
  signals: Signal[];
}

const STORAGE_KEY = 'molt_local_database';

function createEmptyDatabase(): LocalDatabase {
  return {
    users: [],
    conversations: [],
    results: [],
    archives: [],
    signals: [],
  };
}

function readDatabase(): LocalDatabase {
  if (typeof window === 'undefined') {
    return createEmptyDatabase();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyDatabase();
    }

    const parsed = JSON.parse(raw) as Partial<LocalDatabase>;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      conversations: Array.isArray(parsed.conversations) ? parsed.conversations : [],
      results: Array.isArray(parsed.results) ? parsed.results : [],
      archives: Array.isArray(parsed.archives) ? parsed.archives : [],
      signals: Array.isArray(parsed.signals) ? parsed.signals : [],
    };
  } catch (error) {
    console.error('读取本地数据库失败:', error);
    return createEmptyDatabase();
  }
}

function writeDatabase(database: LocalDatabase): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(database));
  } catch (error) {
    console.error('写入本地数据库失败:', error);
  }
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function now(): string {
  return new Date().toISOString();
}

export function isLocalDatabaseAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function resetLocalDatabase(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export async function createOrGetLocalUser(anonymousId: string): Promise<User | null> {
  const database = readDatabase();
  const existing = database.users.find((user) => user.anonymous_id === anonymousId);

  if (existing) {
    return existing;
  }

  const user: User = {
    id: generateId('user'),
    anonymous_id: anonymousId,
    created_at: now(),
  };
  database.users.push(user);
  writeDatabase(database);
  return user;
}

export async function getLocalUserById(userId: string): Promise<User | null> {
  const database = readDatabase();
  return database.users.find((user) => user.id === userId) ?? null;
}

export async function deleteLocalConversationsByUserAndPath(userId: string, pathType: PathType): Promise<boolean> {
  const database = readDatabase();
  database.conversations = database.conversations.filter(
    (conversation) => !(conversation.user_id === userId && conversation.path_type === pathType)
  );
  writeDatabase(database);
  return true;
}

export async function deleteLocalConversationsFromQuestionIndex(
  userId: string,
  pathType: PathType,
  fromIndex: number
): Promise<boolean> {
  const database = readDatabase();
  database.conversations = database.conversations.filter(
    (conversation) =>
      !(
        conversation.user_id === userId &&
        conversation.path_type === pathType &&
        conversation.question_index >= fromIndex
      )
  );
  writeDatabase(database);
  return true;
}

export async function saveLocalConversation(
  userId: string,
  pathType: PathType,
  questionIndex: number,
  questionText: string,
  answerText: string
): Promise<Conversation | null> {
  const database = readDatabase();
  const conversation: Conversation = {
    id: generateId('conversation'),
    user_id: userId,
    path_type: pathType,
    question_index: questionIndex,
    question_text: questionText,
    answer_text: answerText,
    created_at: now(),
  };

  database.conversations.push(conversation);
  writeDatabase(database);
  return conversation;
}

export async function getLocalConversationsByUser(userId: string, pathType: PathType): Promise<Conversation[]> {
  const database = readDatabase();
  return database.conversations
    .filter((conversation) => conversation.user_id === userId && conversation.path_type === pathType)
    .sort((left, right) => left.question_index - right.question_index);
}

export async function saveLocalResult(
  userId: string,
  pathType: 'A' | 'B',
  pressureLevel: PressureLevel,
  pressureDescription: string,
  abilities: string[],
  marketSignals: string,
  actionSuggestions: string[]
): Promise<Result | null> {
  const database = readDatabase();
  const result: Result = {
    id: generateId('result'),
    user_id: userId,
    path_type: pathType,
    pressure_level: pressureLevel,
    pressure_description: pressureDescription,
    abilities,
    market_signals: marketSignals,
    action_suggestions: actionSuggestions,
    created_at: now(),
  };

  database.results = database.results.filter(
    (item) => !(item.user_id === userId && item.path_type === pathType)
  );
  database.results.unshift(result);
  writeDatabase(database);
  return result;
}

export async function getLocalResultByUser(userId: string, pathType: 'A' | 'B'): Promise<Result | null> {
  const database = readDatabase();
  return (
    database.results.find((result) => result.user_id === userId && result.path_type === pathType) ?? null
  );
}

export async function saveLocalArchive(
  userId: string,
  trajectorySummary: string,
  isPublic: boolean
): Promise<Archive | null> {
  const database = readDatabase();
  const archive: Archive = {
    id: generateId('archive'),
    user_id: userId,
    trajectory_summary: trajectorySummary,
    is_public: isPublic,
    created_at: now(),
  };

  database.archives.unshift(archive);
  writeDatabase(database);
  return archive;
}

export async function getLocalPublicArchives(): Promise<Archive[]> {
  const database = readDatabase();
  return database.archives.filter((archive) => archive.is_public);
}

export async function getLocalArchiveByUser(userId: string): Promise<Archive | null> {
  const database = readDatabase();
  return database.archives.find((archive) => archive.user_id === userId) ?? null;
}

export async function sendLocalSignal(
  senderId: string,
  receiverId: string,
  signalContent: string
): Promise<Signal | null> {
  if (signalContent.length > 50) {
    return null;
  }

  const database = readDatabase();
  const signal: Signal = {
    id: generateId('signal'),
    sender_id: senderId,
    receiver_id: receiverId,
    signal_content: signalContent,
    created_at: now(),
  };
  database.signals.unshift(signal);
  writeDatabase(database);
  return signal;
}

export async function getLocalSignalsByReceiver(receiverId: string): Promise<Signal[]> {
  const database = readDatabase();
  return database.signals.filter((signal) => signal.receiver_id === receiverId);
}
