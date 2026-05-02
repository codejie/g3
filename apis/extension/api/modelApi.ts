import { post } from './request'
import type {
  GetModelsRequest,
  GetModelsResponse,
  AddProviderRequest,
  AddProviderResponse,
  AddModelRequest,
  AddModelResponse,
  DeleteModelRequest,
  DeleteModelResponse,
  DeleteProviderRequest,
  DeleteProviderResponse,
  UpdateProviderRequest,
  UpdateProviderResponse,
  UpdateModelRequest,
  UpdateModelResponse,
} from '../types/model'

export const modelApi = {
  getModels: (data: GetModelsRequest) => post<GetModelsResponse>('/model/list', data),

  addProvider: (data: AddProviderRequest) => post<AddProviderResponse>('/model/provider/add', data),

  addModel: (data: AddModelRequest) => post<AddModelResponse>('/model/add', data),

  deleteModel: (data: DeleteModelRequest) => post<DeleteModelResponse>('/model/delete', data),

  deleteProvider: (data: DeleteProviderRequest) => post<DeleteProviderResponse>('/model/provider/delete', data),

  updateProvider: (data: UpdateProviderRequest) => post<UpdateProviderResponse>('/model/provider/update', data),

  updateModel: (data: UpdateModelRequest) => post<UpdateModelResponse>('/model/update', data),
}
