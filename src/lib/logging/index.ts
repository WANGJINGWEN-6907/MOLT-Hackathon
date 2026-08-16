export type LogLevel = 'info' | 'warn' | 'error'
export type LogStatus = 'started' | 'succeeded' | 'failed' | 'fallback'

export interface LogEvent {
  scope: string
  action: string
  status: LogStatus
  level: LogLevel
  message?: string
  payload?: Record<string, unknown>
  timestamp: string
}

interface CreateLogEventInput {
  scope: string
  action: string
  status: LogStatus
  level?: LogLevel
  message?: string
  payload?: Record<string, unknown>
}

function getDefaultLevel(status: LogStatus): LogLevel {
  if (status === 'failed') {
    return 'error'
  }

  if (status === 'fallback') {
    return 'warn'
  }

  return 'info'
}

export function serializeError(error: unknown): {
  name?: string
  message: string
  stack?: string
} {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === 'string') {
    return {
      message: error,
    }
  }

  return {
    message: 'Unknown error',
  }
}

export function createLogEvent(input: CreateLogEventInput): LogEvent {
  return {
    scope: input.scope,
    action: input.action,
    status: input.status,
    level: input.level ?? getDefaultLevel(input.status),
    message: input.message,
    payload: input.payload,
    timestamp: new Date().toISOString(),
  }
}

export function logEvent(event: LogEvent): void {
  const logger =
    event.level === 'error'
      ? console.error
      : event.level === 'warn'
        ? console.warn
        : console.info

  logger(`[${event.scope}] ${event.action} ${event.status}`, {
    message: event.message,
    payload: event.payload,
    timestamp: event.timestamp,
  })
}
