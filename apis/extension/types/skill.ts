import type { BaseRequest, BaseResponse } from './common'

export interface Skill {
  id: string
  name: string
  description?: string
  path: string
  created: number
}

export interface DownloadSkillRequest extends BaseRequest {
  name: string
}

export interface DeleteSkillRequest extends BaseRequest {
  name: string
}

export type DownloadSkillResponse = BaseResponse<void>
export type DeleteSkillResponse = BaseResponse<void>
export type UploadSkillResponse = BaseResponse<void>
