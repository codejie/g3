import type { BaseRequest, BaseResponse, PageInfo } from './common'

export interface LogEntry {
  id: string
  user_id: string
  action: string
  target?: string
  details?: string
  created: number
}

export interface GetLogsRequest extends BaseRequest {
  user_id?: string
  action?: string
  target?: string
  page_info?: PageInfo
}

export interface GetLogsResult {
  items: LogEntry[]
  page_info: PageInfo
}

export type GetLogsResponse = BaseResponse<GetLogsResult>