import type { BaseRequest, BaseResponse } from './common'

export interface Keyword {
  id: string
  keyword: string
  description?: string
  disabled: number
  order: number
  type: string
  created_at: number
  updated_at: number
}

export interface Prompt {
  id: string
  keyword_id: string
  label: string
  prompt: string
  description?: string
  disabled: number
  order: number
  created_at: number
  updated_at: number
}

export interface KeywordRow {
  id: string
  keyword: string
  description: string | null
  disabled: number
  order: number
  type: string
  created_at: number
  updated_at: number
}

export interface PromptRow {
  id: string
  keyword_id: string
  label: string
  prompt: string
  description: string | null
  disabled: number
  order: number
  created_at: number
  updated_at: number
}

export interface GetKeywordsRequest extends BaseRequest {
  keyword?: string
  type?: string
}

export interface GetKeywordsResult {
  items: {
    keyword: Keyword
    prompts: Prompt[]
  }[]
}

export type GetKeywordsResponse = BaseResponse<GetKeywordsResult>

export interface AddKeywordRequest extends BaseRequest {
  keyword: string
  description?: string
  order?: number
  type?: string
}

export interface AddKeywordResult {
  id: string
}

export type AddKeywordResponse = BaseResponse<AddKeywordResult>

export interface DeleteKeywordRequest extends BaseRequest {
  id: string
}

export type DeleteKeywordResponse = BaseResponse<void>

export interface UpdateKeywordRequest extends BaseRequest {
  id: string
  keyword?: string
  description?: string
  order?: number
  type?: string
  disabled?: number
}

export interface UpdateKeywordResult {
  id: string
}

export type UpdateKeywordResponse = BaseResponse<UpdateKeywordResult>

export interface AddPromptRequest extends BaseRequest {
  keyword_id: string
  label: string
  prompt: string
  description?: string
  order?: number
}

export interface AddPromptResult {
  id: string
}

export type AddPromptResponse = BaseResponse<AddPromptResult>

export interface DeletePromptRequest extends BaseRequest {
  id: string
}

export type DeletePromptResponse = BaseResponse<void>

export interface UpdatePromptRequest extends BaseRequest {
  id: string
  label?: string
  prompt?: string
  description?: string
  order?: number
  disabled?: number
}

export interface UpdatePromptResult {
  id: string
}

export type UpdatePromptResponse = BaseResponse<UpdatePromptResult>
