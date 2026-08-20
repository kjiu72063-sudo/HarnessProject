/**
 * F005 代码执行沙箱 — TS 类型镜像（硬性规则 4：Pydantic schema + TS 类型镜像）。
 *
 * SandboxStatusResponse 对齐 server/schemas/sandbox.py
 * SandboxResult 对齐 server/sandbox/base.py ExecutionResult
 */

export type SandboxExecutorType = 'docker' | 'local' | 'disabled'

export type SandboxExecutionStatus =
  | 'completed'
  | 'timeout'
  | 'cancelled'
  | 'error'
  | 'disabled'

export interface SandboxStatusResponse {
  executor_type: SandboxExecutorType
  docker_available: boolean
}

export interface SandboxResult {
  execution_id: string
  exit_code: number
  stdout: string
  stderr: string
  duration_ms: number
  status: SandboxExecutionStatus
}
