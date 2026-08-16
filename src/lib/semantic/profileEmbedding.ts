const SEMANTIC_BUCKETS: Array<{ id: string; keywords: string[] }> = [
  { id: 'liberal-arts', keywords: ['文科', '翻译', '语言', '编辑', '记者', '教育', '人文', '外语', '媒体', '乘务'] },
  { id: 'stem', keywords: ['理工科', '技术', '开发', '工程', '后端', '前端', '算法', '云原生', '硬件', '运维'] },
  { id: 'business', keywords: ['商科', '运营', '品牌', '营销', '客户', '电商', '销售', '咨询'] },
  { id: 'arts', keywords: ['艺术', '设计', '创作', '视频', '空间', '建筑', '审美'] },
  { id: 'ai-anxiety', keywords: ['AI替代', '被替代', '自动化', 'AI翻译', 'AI做的事', '工具冲击'] },
  { id: 'resume-anxiety', keywords: ['投简历', '没回音', 'offer', '面试', '简历'] },
  { id: 'direction-anxiety', keywords: ['方向迷茫', '不知道能做什么', '迷茫', '不知道该找什么', '选错'] },
  { id: 'peer-pressure', keywords: ['同辈压力', '同龄人', '别人都在'] },
  { id: 'no-action', keywords: ['还没开始', '还没行动', '不敢行动', '停在原地'] },
  { id: 'exploring', keywords: ['探索', '学习', '试试看', '刚开始', '重新看'] },
  { id: 'doing', keywords: ['做项目', '做副业', '投简历', '找前辈聊', '参加社群', '考证'] },
  { id: 'product', keywords: ['产品', '产品经理', '用户研究', '课程产品'] },
  { id: 'operations', keywords: ['运营', '品牌运营', '社媒', '客户成功', '增长'] },
  { id: 'tech', keywords: ['技术', '工程师', '全栈', '平台', '云', '架构'] },
  { id: 'design', keywords: ['设计', 'UX', 'UI', '交互', '视觉'] },
  { id: 'content', keywords: ['内容', '创作者', '编辑', '短视频', '写作'] },
  { id: 'research', keywords: ['研究', '分析', '咨询', '商业分析'] },
  { id: 'data', keywords: ['数据', '分析师', 'BI', '指标'] },
  { id: 'education', keywords: ['教育', '教学', '课程', '老师'] },
  { id: 'freelance', keywords: ['自由职业', '独立创作者', '接案'] },
  { id: 'mentor-help', keywords: ['过来人', '前辈', '聊聊', '1对1', '一个走过这条路的人'] },
  { id: 'peer-outcomes', keywords: ['同类人去向', '去了哪里', '类似的人'] },
  { id: 'direction-help', keywords: ['方向建议', '第一步', '具体方向'] },
  { id: 'confidence-help', keywords: ['信心确认', '确认', '被看见', '走得通'] },
]

function countKeyword(source: string, keyword: string): number {
  if (!keyword) return 0
  let count = 0
  let cursor = source.indexOf(keyword)
  while (cursor !== -1) {
    count += 1
    cursor = source.indexOf(keyword, cursor + keyword.length)
  }
  return count
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0))
  if (magnitude === 0) return vector
  return vector.map((value) => value / magnitude)
}

export function createProfileEmbedding(text: string, extraTokens: string[] = []): number[] {
  const source = `${text} ${extraTokens.join(' ')}`.trim()
  if (!source) {
    return new Array(SEMANTIC_BUCKETS.length + 4).fill(0)
  }

  const semantic = SEMANTIC_BUCKETS.map(({ keywords }) => {
    return keywords.reduce((score, keyword) => score + countKeyword(source, keyword), 0)
  })

  const hashed = new Array(4).fill(0)
  Array.from(source).forEach((character, index) => {
    const bucket = (character.codePointAt(0) ?? index) % hashed.length
    hashed[bucket] += 0.05
  })

  return normalize([...semantic, ...hashed])
}

export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return 0
  }

  let dot = 0
  let leftNorm = 0
  let rightNorm = 0

  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index]
    leftNorm += left[index] * left[index]
    rightNorm += right[index] * right[index]
  }

  const denominator = Math.sqrt(leftNorm) * Math.sqrt(rightNorm)
  return denominator === 0 ? 0 : dot / denominator
}

export function averageEmbeddings(embeddings: number[][]): number[] {
  const valid = embeddings.filter((embedding) => embedding.length > 0)
  if (valid.length === 0) return []

  const width = valid[0].length
  const sums = new Array(width).fill(0)

  valid.forEach((embedding) => {
    for (let index = 0; index < width; index += 1) {
      sums[index] += embedding[index] ?? 0
    }
  })

  return normalize(sums.map((value) => value / valid.length))
}
