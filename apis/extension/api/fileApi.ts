import { post, downloadBlob } from './request'
import type {
  GetFilesRequest,
  GetFilesResponse,
  DeleteFileRequest,
  DeleteFileResponse,
  DownloadFileRequest,
  UploadFileRequest,
  UploadFileResponse,
  ReadFileRequest,
  ReadFileResponse,
} from '../types/file'

export const fileApi = {
  getFiles: (data: GetFilesRequest) => post<GetFilesResponse>('/file/list', data),

  delete: (data: DeleteFileRequest) => post<DeleteFileResponse>('/file/delete', data),

  download: (data: DownloadFileRequest, fallbackName?: string) => downloadBlob('/file/download', data, fallbackName),

  upload: (data: UploadFileRequest) => post<UploadFileResponse>('/file/upload', data),

  readFile: (data: ReadFileRequest) => post<ReadFileResponse>('/file/read', data),
}