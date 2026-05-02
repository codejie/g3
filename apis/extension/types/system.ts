import type { BaseRequest, BaseResponse } from './common'

export interface ExecuteScriptRequest extends BaseRequest {
  name: string
  params?: Record<string, any>
}

export type ExecuteScriptResponse = BaseResponse<void>
