import type { BaseRequest, BaseResponse } from './common'

export interface Project {
  id: string
  user_id: string
  session_id: string
  name: string
  type: string
  description?: string
  status: string
  created: number
  updated: number
}

export interface CreateProjectRequest extends BaseRequest {
  name?: string
  type: string
  description?: string
}

export interface CreateProjectResult {
  id: string
}

export type CreateProjectResponse = BaseResponse<CreateProjectResult>

export interface GetProjectDetailRequest extends BaseRequest {
  id: string
}

export interface GetProjectDetailResult {
  item: Project
  directory: string
}

export type GetProjectDetailResponse = BaseResponse<GetProjectDetailResult>

export interface GetProjectsResult {
  items: Project[]
}

export type GetProjectsResponse = BaseResponse<GetProjectsResult>

export interface UpdateProjectRequest extends BaseRequest {
  id: string
  name?: string
  type?: string
  description?: string
}

export interface UpdateProjectResult {
  id: string
}

export type UpdateProjectResponse = BaseResponse<UpdateProjectResult>

export interface SetProjectStatusRequest extends BaseRequest {
  id: string
  status: string
}

export interface SetProjectStatusResult {
  id: string
}

export type SetProjectStatusResponse = BaseResponse<SetProjectStatusResult>

export interface ResetProjectSessionRequest extends BaseRequest {
  id: string
}

export interface ResetProjectSessionResult {
  id: string
  session_id: string
}

export type ResetProjectSessionResponse = BaseResponse<ResetProjectSessionResult>