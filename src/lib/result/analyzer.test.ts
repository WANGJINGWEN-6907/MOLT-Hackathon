import { describe, expect, it } from 'vitest';
import { analyzeConversation, analyzePathA, analyzePathB } from './analyzer';
import type { PathAAnalysis, PathBAnalysis } from './types';

describe('Result Analyzer', () => {
  describe('analyzePathA - 挣扎路径', () => {
    it('应该正确识别高压力区间', () => {
      const longAnswers = [
        '我感到非常困惑，不知道该往哪个方向走。每天都在焦虑中度过，感觉自己的能力在贬值。市场变化太快了，我跟不上节奏。之前的经验似乎都用不上了，我很害怕被淘汰。',
        '具体的时刻是去年年底，公司开始裁员，我突然意识到自己的工作可能随时会失去。那种不安全感一直持续到现在。',
        '我尝试过学习新技能，但感觉时间不够，精力也不够。每天忙于现有工作，根本抽不出时间。而且不知道学什么才是对的。',
        '我觉得自己陷入了一个循环，想改变但又不知道从何开始。有时候会怀疑自己是不是不适合这个行业。'
      ];

      const result = analyzePathA(longAnswers);

      expect(result.pressureLevel).toBe('high');
      expect(result.pressureDescription).toContain('高压力');
      expect(result.structuralPressure.economicFactors.length).toBeGreaterThan(0);
      expect(result.individualActions.emotionalSupport.length).toBeGreaterThan(0);
      expect(result.isFallback).toBe(false);
    });

    it('应该正确识别中压力区间', () => {
      const mediumAnswers = [
        '最近感觉有些迷茫，但还在坚持',
        '大概是半年前开始的',
        '尝试了一些新方向'
      ];

      const result = analyzePathA(mediumAnswers);

      expect(result.pressureLevel).toBe('medium');
      expect(result.abilities).toContain('自我觉察能力');
      expect(result.individualActions.smallSteps.length).toBeGreaterThan(0);
    });

    it('应该正确识别低压力区间', () => {
      const shortAnswers = ['还好', '没有', '在看'];

      const result = analyzePathA(shortAnswers);

      expect(result.pressureLevel).toBe('low');
      expect(result.pressureDescription).toContain('较低');
    });

    it('应该包含结构性压力分析', () => {
      const answers = ['经济压力很大', '行业在变化', '个人情况复杂'];

      const result = analyzePathA(answers);

      expect(result.structuralPressure).toBeDefined();
      expect(result.structuralPressure.economicFactors).toBeInstanceOf(Array);
      expect(result.structuralPressure.industryChanges).toBeInstanceOf(Array);
      expect(result.structuralPressure.personalCircumstances).toBeInstanceOf(Array);
    });

    it('应该提供个体行动建议', () => {
      const answers = ['感到焦虑', '不知道怎么办'];

      const result = analyzePathA(answers);

      expect(result.individualActions.emotionalSupport.length).toBeGreaterThan(0);
      expect(result.individualActions.smallSteps.length).toBeGreaterThan(0);
      expect(result.individualActions.reflectionPrompts.length).toBeGreaterThan(0);
    });

    it('空数组应该返回 fallback 结果', () => {
      const result = analyzePathA([]);

      expect(result.isFallback).toBe(true);
      expect(result.pressureLevel).toBe('medium');
    });
  });

  describe('analyzePathB - 挣脱路径', () => {
    it('应该正确识别中压力区间', () => {
      const longAnswers = [
        '我已经开始尝试做自媒体，但还没有明确的方向。每天都在实验不同的内容形式，看数据反馈。',
        '我有一些技术背景，之前做过产品经理，现在想转向内容创作或者咨询方向。',
        '目前在测试几个方向：技术科普、职业发展咨询、产品分析。',
        '最大的挑战是时间分配和方向选择，不确定应该all in哪个方向。'
      ];

      const result = analyzePathB(longAnswers);

      expect(result.pressureLevel).toBe('medium');
      expect(result.directionValidation).toBeDefined();
      expect(result.minimalActions.immediateSteps.length).toBeGreaterThan(0);
      expect(result.isFallback).toBe(false);
    });

    it('应该正确识别低压力区间', () => {
      const shortAnswers = ['在尝试', '有想法', '在行动'];

      const result = analyzePathB(shortAnswers);

      expect(result.pressureLevel).toBe('low');
      expect(result.pressureDescription).toContain('状态不错');
    });

    it('应该提供方向验证', () => {
      const answers = ['我想做产品设计', '已经开始学习相关课程'];

      const result = analyzePathB(answers);

      expect(result.directionValidation.currentDirection).toBeDefined();
      expect(result.directionValidation.alignmentScore).toBeGreaterThanOrEqual(0);
      expect(result.directionValidation.alignmentScore).toBeLessThanOrEqual(100);
      expect(typeof result.directionValidation.adjustmentNeeded).toBe('boolean');
    });

    it('应该提供最小可行行动', () => {
      const answers = ['想转行', '有技能'];

      const result = analyzePathB(answers);

      expect(result.minimalActions.immediateSteps.length).toBeGreaterThan(0);
      expect(result.minimalActions.resourceMapping.length).toBeGreaterThan(0);
      expect(result.minimalActions.experimentIdeas.length).toBeGreaterThan(0);
    });

    it('应该识别行动力和能力标签', () => {
      const answers = ['我在行动', '学习能力强'];

      const result = analyzePathB(answers);

      expect(result.abilities).toContain('行动力');
      expect(result.abilities.length).toBeGreaterThan(0);
    });

    it('空数组应该返回 fallback 结果', () => {
      const result = analyzePathB([]);

      expect(result.isFallback).toBe(true);
      expect(result.pressureLevel).toBe('medium');
    });
  });

  describe('analyzeConversation - 通用分析', () => {
    it('应该正确处理 Path A', () => {
      const answers = ['困惑', '焦虑'];
      const result = analyzeConversation(answers, 'A');

      expect(result.pressureLevel).toBeDefined();
      expect((result as PathAAnalysis).structuralPressure).toBeDefined();
    });

    it('应该正确处理 Path B', () => {
      const answers = ['在尝试', '有方向'];
      const result = analyzeConversation(answers, 'B');

      expect(result.pressureLevel).toBeDefined();
      expect((result as PathBAnalysis).directionValidation).toBeDefined();
    });

    it('应该处理 Path C (返回 fallback)', () => {
      const answers = ['测试'];
      const result = analyzeConversation(answers, 'C');

      expect(result.isFallback).toBe(true);
    });
  });

  describe('输出字段稳定性', () => {
    it('Path A 输出应该包含所有必需字段', () => {
      const result = analyzePathA(['test']);

      // AnalysisResult 基础字段
      expect(result).toHaveProperty('pressureLevel');
      expect(result).toHaveProperty('pressureDescription');
      expect(result).toHaveProperty('abilities');
      expect(result).toHaveProperty('marketSignals');
      expect(result).toHaveProperty('actionSuggestions');
      expect(result).toHaveProperty('isFallback');

      // PathAAnalysis 特定字段
      expect(result).toHaveProperty('structuralPressure');
      expect(result.structuralPressure).toHaveProperty('economicFactors');
      expect(result.structuralPressure).toHaveProperty('industryChanges');
      expect(result.structuralPressure).toHaveProperty('personalCircumstances');

      expect(result).toHaveProperty('individualActions');
      expect(result.individualActions).toHaveProperty('emotionalSupport');
      expect(result.individualActions).toHaveProperty('smallSteps');
      expect(result.individualActions).toHaveProperty('reflectionPrompts');
    });

    it('Path B 输出应该包含所有必需字段', () => {
      const result = analyzePathB(['test']);

      // AnalysisResult 基础字段
      expect(result).toHaveProperty('pressureLevel');
      expect(result).toHaveProperty('pressureDescription');
      expect(result).toHaveProperty('abilities');
      expect(result).toHaveProperty('marketSignals');
      expect(result).toHaveProperty('actionSuggestions');
      expect(result).toHaveProperty('isFallback');

      // PathBAnalysis 特定字段
      expect(result).toHaveProperty('directionValidation');
      expect(result.directionValidation).toHaveProperty('currentDirection');
      expect(result.directionValidation).toHaveProperty('alignmentScore');
      expect(result.directionValidation).toHaveProperty('adjustmentNeeded');

      expect(result).toHaveProperty('minimalActions');
      expect(result.minimalActions).toHaveProperty('immediateSteps');
      expect(result.minimalActions).toHaveProperty('resourceMapping');
      expect(result.minimalActions).toHaveProperty('experimentIdeas');
    });
  });
});
