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

export interface GetAutoCleanRequest extends BaseRequest {}

export interface GetAutoCleanResult {
  enabled: boolean
}

export type GetAutoCleanResponse = BaseResponse<GetAutoCleanResult>

export interface SetAutoCleanRequest extends BaseRequest {
  enabled: boolean
}

export interface SetAutoCleanResult {
  enabled: boolean
}

export type SetAutoCleanResponse = BaseResponse<SetAutoCleanResult>
