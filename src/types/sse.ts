/** SSE 事件类型 — F007 TS 类型镜像，字段级一致 server/schemas/sse.py Pydantic schema。 */

export type SSEEventType =
  | 'stage-start' | 'stage-end' | 'snapshot'
  | 'status' | 'gate' | 'done' | 'error' | 'heartbeat'

export interface SSEStageEvent {
  node: string
  stage: string
  timestamp: string
}

export interface SSESnapshotEvent {
  session_id: string
  status: string
  next: string[]
  state: Record<string, unknown>
}

export interface SSEStatusEvent {
  status: string
}

export interface SSEGateEvent {
  gate: string
  next: string[]
}

export interface SSEErrorEvent {
  message: string
  node?: string
}

export interface SSEHeartbeatEvent {
  ts: string
}

export type SSEDoneEvent = Record<string, never>
