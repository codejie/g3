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
  DownloadOpencodeConfigRequest,
  UploadOpencodeConfigResponse,
  ReadOpencodeConfigRequest,
  ReadOpencodeConfigResponse,
  SaveOpencodeConfigRequest,
  SaveOpencodeConfigResponse,
} from '../types/file'

export const fileApi = {
  getFiles: (data: GetFilesRequest) => post<GetFilesResponse>('/file/list', data),

  delete: (data: DeleteFileRequest) => post<DeleteFileResponse>('/file/delete', data),

  download: (data: DownloadFileRequest, fallbackName?: string) => downloadBlob('/file/download', data, fallbackName),

  upload: (data: UploadFileRequest) => post<UploadFileResponse>('/file/upload', data),

  readFile: (data: ReadFileRequest) => post<ReadFileResponse>('/file/read', data),

  readOpencodeConfig: (data: ReadOpencodeConfigRequest) => post<ReadOpencodeConfigResponse>('/file/opencode-config/read', data),

  saveOpencodeConfig: (data: SaveOpencodeConfigRequest) => post<SaveOpencodeConfigResponse>('/file/opencode-config/save', data),

  downloadOpencodeConfig: (data: DownloadOpencodeConfigRequest, fallbackName?: string) => downloadBlob('/file/opencode-config/download', data, fallbackName),

  uploadOpencodeConfig: async (file: File, name: string, baseURL: string, token: string | null): Promise<UploadOpencodeConfigResponse> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`
    const url = `${baseURL}file/opencode-config/upload`
    const response = await fetch(url, { method: 'POST', headers, body: formData })
    return response.json()
  },
}