import { post } from './request'
import type { ExecuteScriptRequest, ExecuteScriptResponse } from '../types/system'

export const systemApi = {
  executeScript: (data: ExecuteScriptRequest) =>
    post<ExecuteScriptResponse>('/system/execute-script', data),
}
