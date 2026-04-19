import { post } from './request'
import type {
  GetFilesRequest,
  GetFilesResponse,
  DeleteFileRequest,
  DeleteFileResponse,
  DownloadFileRequest,
  DownloadFileResponse,
  UploadFileRequest,
  UploadFileResponse,
} from '../types/file'

export const fileApi = {
  getFiles: (data: GetFilesRequest) => post<GetFilesResponse>('/file/list', data),

  delete: (data: DeleteFileRequest) => post<DeleteFileResponse>('/file/delete', data),

  download: (data: DownloadFileRequest) => post<DownloadFileResponse>('/file/download', data),

  upload: (data: UploadFileRequest) => post<UploadFileResponse>('/file/upload', data),
}