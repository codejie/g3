import type { BaseRequest, BaseResponse } from './common'

export interface SessionItem {
  id: string
  title: string
  directory: string
  created: number
  updated: number
  project_name: string | null
  project_type: string | null
  project_status: string | null
  user_name: string | null
}

export interface GetSessionsRequest extends BaseRequest {}

export interface GetSessionsResult {
  items: SessionItem[]
}

export type GetSessionsResponse = BaseResponse<GetSessionsResult>
