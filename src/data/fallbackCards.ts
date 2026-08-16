import type { MoltCard } from '@/types'

export const ACT_TITLES: Record<1 | 2 | 3, string> = {
  1: '壳在哪里裂开的',
  2: '壳下面是什么',
  3: '新壳开始硬化',
}

export const FALLBACK_ACT1: MoltCard[] = [
  {
    id: 'fb1-01',
    line1: '我学的东西',
    line2: '好像突然没人要了',
    tags: ['AI替代焦虑', '专业冷门'],
    profileFields: { anxiety_type: 'AI替代焦虑', major_field: '文科' },
    depth: 'surface',
  },
  {
    id: 'fb1-02',
    line1: '投了很多简历',
    line2: '连已读都没有',
    tags: ['投简历没回音', '行业缩招'],
    profileFields: { anxiety_type: '投简历没回音' },
    depth: 'surface',
  },
  {
    id: 'fb1-03',
    line1: '同龄人都在往前走',
    line2: '我还在原地',
    tags: ['方向迷茫', '同辈压力'],
    profileFields: { anxiety_type: '方向迷茫' },
    depth: 'middle',
  },
  {
    id: 'fb1-04',
    line1: 'AI做的事',
    line2: '和我越来越像了',
    tags: ['AI替代焦虑', '技能过时'],
    profileFields: { anxiety_type: 'AI替代焦虑' },
    depth: 'middle',
  },
  {
    id: 'fb1-05',
    line1: '不是找不到工作',
    line2: '是不知道该找什么',
    tags: ['方向迷茫', '不知道能做什么'],
    profileFields: { anxiety_type: '不知道能做什么' },
    depth: 'deep',
  },
  {
    id: 'fb1-custom',
    line1: '这些都不像我',
    line2: '我的裂缝在别处',
    tags: [],
    profileFields: {},
    isCustom: true,
  },
]

export const FALLBACK_ACT2: MoltCard[] = [
  {
    id: 'fb2-01',
    line1: '其实不是没方向',
    line2: '是怕选错',
    tags: ['方向迷茫'],
    profileFields: { action_stage: '还没开始' },
    depth: 'surface',
  },
  {
    id: 'fb2-02',
    line1: '我不是不想行动',
    line2: '是怕行动也没用',
    tags: ['还没行动'],
    profileFields: { action_stage: '还没开始', actions_taken: ['还没行动'] },
    depth: 'middle',
  },
  {
    id: 'fb2-03',
    line1: '最怕的不是失败',
    line2: '是不知道擅长什么',
    tags: ['技能过时'],
    profileFields: { action_stage: '还没开始' },
    depth: 'deep',
  },
  {
    id: 'fb2-04',
    line1: '想做新方向的事',
    line2: '但觉得自己不够格',
    tags: ['AI替代焦虑'],
    profileFields: { action_stage: '刚开始探索' },
    depth: 'middle',
  },
  {
    id: 'fb2-custom',
    line1: '这些都不够准',
    line2: '我想自己说',
    tags: [],
    profileFields: {},
    isCustom: true,
  },
]

export const FALLBACK_ACT3: MoltCard[] = [
  {
    id: 'fb3-01',
    line1: '找一个走过这路的人',
    line2: '先听一句真话',
    tags: ['想找过来人聊'],
    profileFields: { help_needed: '想找过来人聊', direction: '还没确定' },
    depth: 'surface',
  },
  {
    id: 'fb3-02',
    line1: '看看像我的人',
    line2: '最后都去了哪里',
    tags: ['想看同类人去向'],
    profileFields: { help_needed: '想看同类人去向', direction: '还没确定' },
    depth: 'surface',
  },
  {
    id: 'fb3-03',
    line1: '有人告诉我',
    line2: '这条路走得通',
    tags: ['想要信心确认'],
    profileFields: { help_needed: '想要信心确认', direction: '还没确定' },
    depth: 'middle',
  },
  {
    id: 'fb3-04',
    line1: '给我一个具体方向',
    line2: '哪怕只是第一步',
    tags: ['想要方向建议'],
    profileFields: { help_needed: '想要方向建议', direction: '还没确定' },
    depth: 'middle',
  },
  {
    id: 'fb3-05',
    line1: '我现在只想被看见',
    line2: '不用急着给答案',
    tags: ['想要信心确认'],
    profileFields: { help_needed: '想要信心确认', direction: '还没确定' },
    depth: 'deep',
  },
]

export function getFallbackCardsForAct(actNumber: 1 | 2 | 3): MoltCard[] {
  if (actNumber === 1) return FALLBACK_ACT1
  if (actNumber === 2) return FALLBACK_ACT2
  return FALLBACK_ACT3
}
