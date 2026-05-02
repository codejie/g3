import type { BaseRequest, BaseResponse } from './common'

// ===== Shared Options type =====
export interface Options {
  key: string
  value: string
}

// ===== Response-level types (used in GetModelsResult) =====
export interface Provider {
  id: string
  provider_id: string
  npm?: string
  options: Options[]
}

export interface Model {
  id: string
  model_id: string
  options: Options[]
}

// ===== DB-level types (used internally) =====
export interface ProviderRow {
  id: string
  provider_id: string
  npm: string | null
  disabled: number
  created_at: number
  updated_at: number
}

export interface ModelRow {
  id: string
  provider_id: string
  model_id: string
  disabled: number
  created_at: number
  updated_at: number
}

export interface ProviderOptionRow {
  id: string
  provider_id: string
  key: string
  value: string
}

export interface ModelOptionRow {
  id: string
  model_id: string
  key: string
  value: string
}

// ===== GetModels =====
export interface GetModelsRequest extends BaseRequest {
  provider_id?: string
}

export interface GetModelsResult {
  items: {
    provider: Provider
    models: Model[]
  }[]
}

export type GetModelsResponse = BaseResponse<GetModelsResult>

// ===== AddProvider =====
export interface AddProviderRequest extends BaseRequest {
  id: string
  npm?: string
  options: Options[]
}

export interface AddProviderResult {
  id: string
}

export type AddProviderResponse = BaseResponse<AddProviderResult>

// ===== AddModel =====
export interface AddModelRequest extends BaseRequest {
  provider_id: string
  id: string
  options: Options[]
}

export interface AddModelResult {
  id: string
  provider_id: string
}

export type AddModelResponse = BaseResponse<AddModelResult>

// ===== DeleteModel =====
export interface DeleteModelRequest extends BaseRequest {
  id: string
  provider_id: string
}

export interface DeleteModelResult {
  id: string
  provider_id: string
}

export type DeleteModelResponse = BaseResponse<DeleteModelResult>

// ===== DeleteProvider =====
export interface DeleteProviderRequest extends BaseRequest {
  id: string
}

export type DeleteProviderResponse = BaseResponse<void>

// ===== UpdateProvider =====
export interface UpdateProviderRequest extends BaseRequest {
  id: string
  npm?: string
  options?: Options[]
}

export interface UpdateProviderResult {
  id: string
}

export type UpdateProviderResponse = BaseResponse<UpdateProviderResult>

// ===== UpdateModel =====
export interface UpdateModelRequest extends BaseRequest {
  id: string
  provider_id: string
  options?: Options[]
}

export interface UpdateModelResult {
  id: string
  provider_id: string
}

export type UpdateModelResponse = BaseResponse<UpdateModelResult>
