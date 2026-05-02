import { post, downloadBlob } from './request'
import type { DeleteSkillRequest, DeleteSkillResponse, DownloadSkillRequest } from '../types/skill'

export const skillApi = {
  download: (data: DownloadSkillRequest) =>
    downloadBlob('/skill/download', data, `${data.name}.tar.gz`),

  delete: (data: DeleteSkillRequest) =>
    post<DeleteSkillResponse>('/skill/delete', data),

  upload: async (file: File, baseURL: string, token: string | null): Promise<{ code: number; message?: string; data?: { skill_name: string; skill_path: string } }> => {
    const formData = new FormData()
    formData.append('file', file)
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${baseURL}skill/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })
    return response.json()
  },
}
