import { describe, expect, it } from 'vitest'
import { cn, createQueryString, formatDate } from './utils'

describe('cn - className merger', () => {
  it('应该合并多个类名', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('应该处理条件类名', () => {
    expect(cn('base', false && 'hidden', true && 'visible')).toBe('base visible')
  })

  it('应该合并 Tailwind 类并解决冲突', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })
})

describe('createQueryString', () => {
  it('应该添加新参数', () => {
    const params = new URLSearchParams()
    const result = createQueryString({ page: 1 }, params)
    expect(result).toBe('page=1')
  })

  it('应该删除 null/undefined 参数', () => {
    const params = new URLSearchParams('page=1&limit=10')
    const result = createQueryString({ page: null, limit: undefined }, params)
    expect(result).toBe('')
  })

  it('应该更新已有参数', () => {
    const params = new URLSearchParams('page=1')
    const result = createQueryString({ page: 2 }, params)
    expect(result).toBe('page=2')
  })
})

describe('formatDate', () => {
  it('应该格式化日期为中文格式', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date)
    expect(result).toContain('2024')
    expect(result).toContain('3')
    expect(result).toContain('15')
  })

  it('应该支持字符串日期输入', () => {
    const result = formatDate('2024-01-01')
    expect(result).toContain('2024')
  })

  it('应该支持自定义格式选项', () => {
    const date = new Date('2024-03-15')
    const result = formatDate(date, { month: 'short' })
    expect(result).toBeTruthy()
  })
})
