import type { BaseRequest, BaseResponse } from './common'

export interface Model {
  id: string
  provider_id: string
  name: string
  description?: string
  created: number
}

export interface Provider {
  id: string
  name: string
  description?: string
  created: number
}

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

export interface AddProviderRequest extends BaseRequest {
  name: string
  description?: string
}

export interface AddProviderResult {
  id: string
}

export type AddProviderResponse = BaseResponse<AddProviderResult>

export interface AddModelRequest extends BaseRequest {
  provider_id: string
  name: string
  description?: string
}

export interface AddModelResult {
  provider_id: string
}

export type AddModelResponse = BaseResponse<AddModelResult>

export interface DeleteModelRequest extends BaseRequest {
  id: string
  provider_id: string
}

export interface DeleteModelResult {
  provider_id: string
}

export type DeleteModelResponse = BaseResponse<DeleteModelResult>

export interface DeleteProviderRequest extends BaseRequest {
  id: string
}

export type DeleteProviderResponse = BaseResponse<void>