/**
 * Result Analysis Domain Types
 * 结果分析领域类型定义
 */

import type { PressureLevel } from '@/types';

/**
 * 基础分析结果
 */
export interface AnalysisResult {
  pressureLevel: PressureLevel;
  pressureDescription: string;
  abilities: string[];
  marketSignals: string;
  actionSuggestions: string[];
  /** 标记此结果是否为 fallback 数据 */
  isFallback: boolean;
}

/**
 * Path A (挣扎路径) 特定分析结果
 * 关注：压力区间、结构性压力、情绪承接
 */
export interface PathAAnalysis extends AnalysisResult {
  /** 结构性压力因素识别 */
  structuralPressure: {
    economicFactors: string[];
    industryChanges: string[];
    personalCircumstances: string[];
  };
  /** 个体行动说明 - 温和、慢节奏 */
  individualActions: {
    emotionalSupport: string[];
    smallSteps: string[];
    reflectionPrompts: string[];
  };
}

/**
 * Path B (挣脱路径) 特定分析结果
 * 关注：压力区间、方向验证、务实行动
 */
export interface PathBAnalysis extends AnalysisResult {
  /** 方向验证 */
  directionValidation: {
    currentDirection: string;
    alignmentScore: number; // 0-100
    adjustmentNeeded: boolean;
  };
  /** 最小可行行动 - 快节奏、务实 */
  minimalActions: {
    immediateSteps: string[];
    resourceMapping: string[];
    experimentIdeas: string[];
  };
}

/**
 * 对话输入类型
 */
export interface ConversationInput {
  answers: string[];
  questionCount: number;
  averageLength: number;
  totalLength: number;
}

/**
 * 压力分析参数
 */
export interface PressureAnalysisParams {
  totalLength: number;
  answerCount: number;
  keywords: string[];
}
