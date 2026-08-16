import type { MemoryImportRequest } from '@/types'

function normalizeSource(sourceAI: string): 'ChatGPT' | 'Claude' | '豆包' | '其他' {
  if (sourceAI === 'ChatGPT' || sourceAI === 'Claude' || sourceAI === '豆包') {
    return sourceAI
  }
  return '其他'
}

export function getMemoryImportReversePrompt(sourceAI: string): string {
  const source = normalizeSource(sourceAI)

  if (source === 'ChatGPT') {
    return `请基于我们过去的对话、你对我长期保留的印象，以及你已经形成的用户理解，用不超过200字总结“你对我的了解”。请尽量覆盖：
1. 我的背景或正在经历的身份变化
2. 我最常出现的焦虑或卡点
3. 我做事/思考的风格
4. 我正在探索什么方向
5. 你觉得我最值得保留的能力

请直接输出一段中文总结，不要安慰，不要提建议，不要分点，不要写“作为 AI”。`
  }

  if (source === 'Claude') {
    return `请根据我们过去反复出现的对话主题，用克制、具体、第三人称的方式，在200字以内总结“你对我的了解”。请尽量覆盖：
1. 我的背景或当前的人生阶段
2. 我反复暴露出的焦虑、矛盾或卡点
3. 我的思考方式、决策风格或人格线索
4. 我正在试探的方向
5. 你认为我最稳定、最值得保留的能力

请输出一整段中文，不要分点，不要建议，不要鼓励，不要解释你为什么这样判断。`
  }

  if (source === '豆包') {
    return `请按你对我聊天印象里最稳定的判断，用不超过200字概括“你觉得我是一个怎样的人，我现在卡在哪里，又在往哪里试”。尽量写到：
1. 我的背景或处境
2. 我的焦虑或压力来源
3. 我的做事风格
4. 我最近在试探什么方向
5. 你觉得我最该保留的长处

请直接写成一段中文总结，不要分点，不要安慰，不要给行动建议。`
  }

  return `请你基于我们过去的对话，用不超过200字总结“你对我的了解”。请尽量覆盖：
1. 我的背景或正在经历的身份变化
2. 我最常出现的焦虑或卡点
3. 我做事/思考的风格
4. 我正在探索什么方向
5. 你觉得我最值得保留的能力

请直接输出一段中文总结，不要安慰，不要提建议，不要分点。`
}

export const MEMORY_IMPORT_REVERSE_PROMPT = getMemoryImportReversePrompt('其他')

export function buildMemoryImportPrompt(input: MemoryImportRequest): string {
  const source = normalizeSource(input.sourceAI)
  const sourceHint =
    source === 'ChatGPT'
      ? '这类总结往往更像长期自我画像，会混合背景、偏好与反复提及的话题。请优先抽取稳定特征，不要把客套语当成关键信息。'
      : source === 'Claude'
        ? '这类总结常更抽象、更克制，可能把情绪写成思考模式。请把抽象描述还原成背景、焦虑、方向与能力线索。'
        : source === '豆包'
          ? '这类总结往往更口语、信息密度不均。请从生活化表达里提取真实处境、压力来源与方向试探，不要因为语气轻松就弱化焦虑。'
          : '请把这段外部 AI 总结还原成结构化画像，优先识别稳定背景、焦虑、方向与优势。'

  return `你是 MOLT 的记忆解析器。下面这段内容来自 ${source} 对用户的总结。

${sourceHint}

请把它解析成：背景、焦虑、人格线索、探索方向、优势线索和信心程度。

原文：
${input.rawText}`
}
