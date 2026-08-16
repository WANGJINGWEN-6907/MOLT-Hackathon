import csvText from './molt_user_profiles.csv?raw'
import type { CareerNodeType } from '@/types'

export interface VirtualProfileRecord {
  userId: string
  educationStage: string
  majorField: string
  majorName: string
  city: string
  careerStatus: string
  anxietyType: string[]
  anxietyDuration: string
  pressureAttribution: string
  hardSkills: string[]
  softSkills: string[]
  direction: string[]
  actionStage: string
  actionsTaken: string[]
  helpNeeded: string[]
  targetCompanyType: string[]
  decisionStyle: string
  socialPreference: string
  stressResponse: string
  communicationStyle: string[]
  currentNodeType: CareerNodeType
  currentNodeSince: string
  profileCompleteness: number
  aggregatedTags: string[]
  dataSource: string
  profileDescription: string
}

function parseCsv(input: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index]
    const next = input[index + 1]

    if (character === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (character === ',' && !inQuotes) {
      row.push(field)
      field = ''
      continue
    }

    if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && next === '\n') {
        index += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += character
  }

  if (field || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function normalizeCell(value: string | undefined): string {
  return (value ?? '').replace(/^\uFEFF/, '').trim()
}

function parseStringArray(raw: string | undefined): string[] {
  const normalized = normalizeCell(raw)
  if (!normalized) return []

  try {
    const parsed = JSON.parse(normalized)
    if (Array.isArray(parsed)) {
      return parsed.map((value) => String(value).trim()).filter(Boolean)
    }
  } catch {
    // fallback: the csv may contain a loose delimiter string instead of JSON.
  }

  return normalized
    .split(/[、,，/]/)
    .map((value) => value.trim())
    .filter(Boolean)
}

function parseNumber(raw: string | undefined): number {
  const value = Number(normalizeCell(raw))
  return Number.isFinite(value) ? value : 0
}

function parseCareerNodeType(raw: string | undefined): CareerNodeType {
  const value = normalizeCell(raw)
  if (value === 'acting' || value === 'crisis' || value === 'exploring' || value === 'landed') {
    return value
  }
  return 'exploring'
}

function getValue(row: Record<string, string>, key: string): string {
  return normalizeCell(row[key])
}

function createRowRecord(header: string[], row: string[]): Record<string, string> {
  return Object.fromEntries(header.map((column, index) => [column, row[index] ?? '']))
}

const rows = parseCsv(csvText).filter((row) => row.some((value) => normalizeCell(value).length > 0))
const header = (rows[0] ?? []).map((column) => normalizeCell(column))

export const virtualProfiles: VirtualProfileRecord[] = rows.slice(1).map((row) => {
  const record = createRowRecord(header, row)

  return {
    userId: getValue(record, 'user_id'),
    educationStage: getValue(record, 'education_stage'),
    majorField: getValue(record, 'major_field'),
    majorName: getValue(record, 'major_name'),
    city: getValue(record, 'city'),
    careerStatus: getValue(record, 'career_status'),
    anxietyType: parseStringArray(record.anxiety_type),
    anxietyDuration: getValue(record, 'anxiety_duration'),
    pressureAttribution: getValue(record, 'pressure_attribution'),
    hardSkills: parseStringArray(record.hard_skills),
    softSkills: parseStringArray(record.soft_skills),
    direction: parseStringArray(record.direction),
    actionStage: getValue(record, 'action_stage'),
    actionsTaken: parseStringArray(record.actions_taken),
    helpNeeded: parseStringArray(record.help_needed),
    targetCompanyType: parseStringArray(record.target_company_type),
    decisionStyle: getValue(record, 'decision_style'),
    socialPreference: getValue(record, 'social_preference'),
    stressResponse: getValue(record, 'stress_response'),
    communicationStyle: parseStringArray(record.communication_style),
    currentNodeType: parseCareerNodeType(record.current_node_type),
    currentNodeSince: getValue(record, 'current_node_since'),
    profileCompleteness: parseNumber(record.profile_completeness),
    aggregatedTags: parseStringArray(record.aggregated_tags),
    dataSource: getValue(record, 'data_source'),
    profileDescription: getValue(record, 'profile_description'),
  }
})
