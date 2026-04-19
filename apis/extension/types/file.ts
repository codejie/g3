import type { BaseRequest, BaseResponse } from './common'

export interface FileNode {
  name: string
  type: string
  size: number
  created: number
  updated: number
}

export interface GetFilesRequest extends BaseRequest {
  project_id: string
  path?: string
}

export interface GetFilesResult {
  items: FileNode[]
}

export type GetFilesResponse = BaseResponse<GetFilesResult>

export interface DeleteFileRequest extends BaseRequest {
  project_id: string
  path: string
}

export type DeleteFileResponse = BaseResponse<void>

export interface DownloadFileRequest extends BaseRequest {
  project_id: string
  path: string
}

export type DownloadFileResponse = BaseResponse<void>

export interface UploadFileRequest extends BaseRequest {
  project_id: string
  path: string
}

export type UploadFileResponse = BaseResponse<void>