// global types

// 百度地图GL版本全局类型声明
/// <reference types="bmapgl" />

interface Window {
  __MOLT_E2E__?: {
    conversation?: {
      currentQuestionIndex: number;
      currentAnswer: string;
      setAnswer: (answer: string) => void;
      send: () => Promise<void>;
    };
  };
}
