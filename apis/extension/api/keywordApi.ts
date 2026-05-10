import { post } from './request'
import type {
  GetKeywordsRequest,
  GetKeywordsResponse,
  AddKeywordRequest,
  AddKeywordResponse,
  DeleteKeywordRequest,
  DeleteKeywordResponse,
  UpdateKeywordRequest,
  UpdateKeywordResponse,
  AddPromptRequest,
  AddPromptResponse,
  DeletePromptRequest,
  DeletePromptResponse,
  UpdatePromptRequest,
  UpdatePromptResponse,
} from '../types/keyword'

export const keywordApi = {
  getKeywords: (data: GetKeywordsRequest) => post<GetKeywordsResponse>('/keyword/list', data),

  addKeyword: (data: AddKeywordRequest) => post<AddKeywordResponse>('/keyword/add', data),

  deleteKeyword: (data: DeleteKeywordRequest) => post<DeleteKeywordResponse>('/keyword/delete', data),

  updateKeyword: (data: UpdateKeywordRequest) => post<UpdateKeywordResponse>('/keyword/update', data),

  addPrompt: (data: AddPromptRequest) => post<AddPromptResponse>('/keyword/prompt/add', data),

  deletePrompt: (data: DeletePromptRequest) => post<DeletePromptResponse>('/keyword/prompt/delete', data),

  updatePrompt: (data: UpdatePromptRequest) => post<UpdatePromptResponse>('/keyword/prompt/update', data),
}
