import { describe, expect, it } from 'vitest';
import type { Conversation, PathType } from '@/types';
import {
  generateMirrorSummary,
  generatePathAMirror,
  generatePathBMirror,
  generatePathCMirror,
} from './mirrorGenerator';

describe('mirrorGenerator', () => {
  describe('generatePathAMirror', () => {
    it('应该生成 Path A 的三行情绪式复述', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'A',
          question_index: 0,
          question_text: '在你开始感到不确定之前，有没有一个具体的时刻？',
          answer_text: '大概是去年年底，公司开始裁员的时候，我发现自己学的东西好像在缩水。',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          path_type: 'A',
          question_index: 1,
          question_text: '你觉得自己现在卡在哪里了？',
          answer_text: '不知道这些训练还值不值钱，也不知道该往哪个方向走。',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          path_type: 'A',
          question_index: 2,
          question_text: '如果可以，你最想改变的是什么？',
          answer_text: '想找到一个新的方向，但又怕选错。',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generatePathAMirror(conversations);

      expect(result).toHaveProperty('line1');
      expect(result).toHaveProperty('line2');
      expect(result).toHaveProperty('line3');

      // 验证格式
      expect(result.line1).toMatch(/^你说你/);
      expect(result.line2).toMatch(/^你说你不知道/);
      expect(result.line3).toMatch(/^你问的那个问题，其实是：/);

      // 验证长度限制
      expect(result.line1.length).toBeLessThanOrEqual(30);
      expect(result.line2.length).toBeLessThanOrEqual(30);
      expect(result.line3.length).toBeLessThanOrEqual(35);
    });

    it('应该处理空回答的情况', () => {
      const conversations: Conversation[] = [];
      const result = generatePathAMirror(conversations);

      expect(result.line1).toBe('你说你感觉有些迷茫');
      expect(result.line2).toBe('你说你不知道该怎么办');
      expect(result.line3).toBe('你问的那个问题，其实是：我还能站在哪里？');
    });
  });

  describe('generatePathBMirror', () => {
    it('应该生成 Path B 的方向诊断摘要', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'B',
          question_index: 0,
          question_text: '你现在手里有什么？',
          answer_text: '有三年产品经验，会画原型，了解一些用户研究方法。',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          path_type: 'B',
          question_index: 1,
          question_text: '你想去哪里？',
          answer_text: '想转向 AI 产品方向，但不确定没有技术背景能不能行。',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          path_type: 'B',
          question_index: 2,
          question_text: '你已经做了什么尝试？',
          answer_text: '报了一些在线课程，但还没有实际项目经验。',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generatePathBMirror(conversations);

      expect(result).toHaveProperty('doing');
      expect(result).toHaveProperty('uncertain');
      expect(result).toHaveProperty('need');

      // 验证内容不为空
      expect(result.doing.length).toBeGreaterThan(0);
      expect(result.uncertain.length).toBeGreaterThan(0);
      expect(result.need.length).toBeGreaterThan(0);

      // 验证长度限制
      expect(result.doing.length).toBeLessThanOrEqual(50);
      expect(result.uncertain.length).toBeLessThanOrEqual(50);
      expect(result.need.length).toBeLessThanOrEqual(50);
    });

    it('应该处理空回答的情况', () => {
      const conversations: Conversation[] = [];
      const result = generatePathBMirror(conversations);

      expect(result.doing).toBe('尝试探索新方向');
      expect(result.uncertain).toBe('不确定这条路是否可行');
      expect(result.need).toBe('需要更清晰的方向指引');
    });
  });

  describe('generatePathCMirror', () => {
    it('应该生成 Path C 的轨迹摘要确认', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'C',
          question_index: 0,
          question_text: '你是从哪个时刻开始感觉到转变的？',
          answer_text: '2022年初，决定离开大厂去创业公司做产品负责人。',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          user_id: 'user1',
          path_type: 'C',
          question_index: 1,
          question_text: '在过渡期最困难的时候，是什么支撑你走下来的？',
          answer_text: '几个好朋友的鼓励，还有对产品的热爱。',
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          user_id: 'user1',
          path_type: 'C',
          question_index: 2,
          question_text: '现在回头看，你觉得那段经历给你带来了什么？',
          answer_text: '学会了从 0 到 1 搭建产品，也更了解自己想要什么了。',
          created_at: new Date().toISOString(),
        },
        {
          id: '4',
          user_id: 'user1',
          path_type: 'C',
          question_index: 3,
          question_text: '如果可以对当时的自己说一句话，你会说什么？',
          answer_text: '相信自己的判断，不要太在意别人的眼光。',
          created_at: new Date().toISOString(),
        },
        {
          id: '5',
          user_id: 'user1',
          path_type: 'C',
          question_index: 4,
          question_text: '你希望用什么方式帮助到正在经历类似过渡的人？',
          answer_text: '分享我的经验，告诉他们不是一个人在战斗。',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generatePathCMirror(conversations);

      expect(result).toHaveProperty('startPoint');
      expect(result).toHaveProperty('turningPoint');
      expect(result).toHaveProperty('currentState');
      expect(result).toHaveProperty('lightMessage');

      // 验证内容不为空
      expect(result.startPoint.length).toBeGreaterThan(0);
      expect(result.turningPoint.length).toBeGreaterThan(0);
      expect(result.currentState.length).toBeGreaterThan(0);
      expect(result.lightMessage.length).toBeGreaterThan(0);

      // 验证长度限制
      expect(result.startPoint.length).toBeLessThanOrEqual(60);
      expect(result.turningPoint.length).toBeLessThanOrEqual(60);
      expect(result.currentState.length).toBeLessThanOrEqual(60);
      expect(result.lightMessage.length).toBeLessThanOrEqual(80);
    });

    it('应该处理空回答的情况', () => {
      const conversations: Conversation[] = [];
      const result = generatePathCMirror(conversations);

      expect(result.startPoint).toBe('开始探索新的方向');
      expect(result.turningPoint).toBe('经历了一些转折');
      expect(result.currentState).toBe('正在继续前行');
      expect(result.lightMessage).toBe('希望能帮助到和我有相似经历的人');
    });
  });

  describe('generateMirrorSummary', () => {
    it('应该根据路径类型调用相应的生成器 - Path A', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'A',
          question_index: 0,
          question_text: '问题1',
          answer_text: '回答1',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generateMirrorSummary('A', conversations);
      expect(result.pathType).toBe('A');
      expect(result).toHaveProperty('data');
    });

    it('应该根据路径类型调用相应的生成器 - Path B', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'B',
          question_index: 0,
          question_text: '问题1',
          answer_text: '回答1',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generateMirrorSummary('B', conversations);
      expect(result.pathType).toBe('B');
      expect(result).toHaveProperty('data');
    });

    it('应该根据路径类型调用相应的生成器 - Path C', () => {
      const conversations: Conversation[] = [
        {
          id: '1',
          user_id: 'user1',
          path_type: 'C',
          question_index: 0,
          question_text: '问题1',
          answer_text: '回答1',
          created_at: new Date().toISOString(),
        },
      ];

      const result = generateMirrorSummary('C', conversations);
      expect(result.pathType).toBe('C');
      expect(result).toHaveProperty('data');
    });

    it('应该处理未知路径类型', () => {
      const conversations: Conversation[] = [];
      // @ts-expect-error 测试未知路径
      const result = generateMirrorSummary('X', conversations);

      expect(result.pathType).toBe('X');
      expect(result.data).toBeNull();
    });
  });
});
