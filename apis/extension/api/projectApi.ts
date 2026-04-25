import { post } from './request'
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  GetProjectsResponse,
  GetProjectDetailRequest,
  GetProjectDetailResponse,
  UpdateProjectRequest,
  UpdateProjectResponse,
  SetProjectStatusRequest,
  SetProjectStatusResponse,
  ResetProjectSessionRequest,
  ResetProjectSessionResponse,
} from '../types/project'

export const projectApi = {
  create: (data: CreateProjectRequest) => post<CreateProjectResponse>('/project/create', data),

  list: () => post<GetProjectsResponse>('/project/list'),

  detail: (data: GetProjectDetailRequest) => post<GetProjectDetailResponse>('/project/detail', data),

  update: (data: UpdateProjectRequest) => post<UpdateProjectResponse>('/project/update', data),

  setStatus: (data: SetProjectStatusRequest) => post<SetProjectStatusResponse>('/project/status', data),

  resetSession: (data: ResetProjectSessionRequest) => post<ResetProjectSessionResponse>('/project/reset-session', data),
}