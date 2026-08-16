import { cosineSimilarity, createProfileEmbedding } from '@/lib/semantic/profileEmbedding'
import type { Cluster } from '@/types'

const CLUSTER_SEEDS = [
  {
    id: 'cluster-01',
    label: '文科AI焦虑 × 产品方向',
    description: '文科或语言类背景，因 AI 冲击而焦虑，正在把表达、理解和组织能力迁移到产品方向。',
    memberCount: 12,
    recoveredCount: 7,
  },
  {
    id: 'cluster-02',
    label: '理工转型 × 技术升级',
    description: '理工科或工程背景，已有技术基础，但正经历栈迁移、平台升级或职业再定位。',
    memberCount: 9,
    recoveredCount: 5,
  },
  {
    id: 'cluster-03',
    label: '内容运营 × 再定位',
    description: '内容、品牌、运营相关背景，在媒介与渠道变化中重新定位自己的长期能力。',
    memberCount: 11,
    recoveredCount: 6,
  },
  {
    id: 'cluster-04',
    label: '设计研究 × 跨场景迁移',
    description: '设计、研究或教育背景，正在把深度观察和方法论迁移到新的工作场景。',
    memberCount: 8,
    recoveredCount: 4,
  },
] satisfies Array<Omit<Cluster, 'centroidEmbedding'>>

export const PREDEFINED_CLUSTERS: Cluster[] = CLUSTER_SEEDS.map((cluster) => ({
  ...cluster,
  centroidEmbedding: createProfileEmbedding(cluster.description, [cluster.label]),
}))

export function assignCluster(userEmbedding: number[], clusters: Cluster[] = PREDEFINED_CLUSTERS): Cluster {
  if (clusters.length === 0) {
    throw new Error('No clusters configured')
  }

  if (userEmbedding.length === 0) {
    return clusters[0]
  }

  return clusters.reduce((best, cluster) => {
    const similarity = cosineSimilarity(userEmbedding, cluster.centroidEmbedding)
    if (similarity > best.similarity) {
      return { cluster, similarity }
    }
    return best
  }, { cluster: clusters[0], similarity: -1 }).cluster
}

export function buildClusterNarrative(cluster: Cluster): string {
  const recoveredCount = cluster.recoveredCount ?? Math.max(1, Math.floor(cluster.memberCount * 0.5))
  return `你和另外 ${cluster.memberCount} 个人正在经历类似的转变，其中已有 ${recoveredCount} 个人先走出来了。`
}
