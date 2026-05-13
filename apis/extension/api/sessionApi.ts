import { post, setConfig } from './request'
import type {
  GetSessionsRequest,
  GetSessionsResponse,
  GetAutoCleanRequest,
  GetAutoCleanResponse,
  SetAutoCleanRequest,
  SetAutoCleanResponse,
} from '../types/session'

export const sessionApi = {
  list: (data?: GetSessionsRequest) => post<GetSessionsResponse>('/session/list', data ?? {}),
  getAutoClean: (data?: GetAutoCleanRequest) => post<GetAutoCleanResponse>('/session/auto-clean/get', data ?? {}),
  setAutoClean: (data: SetAutoCleanRequest) => post<SetAutoCleanResponse>('/session/auto-clean/set', data),
}

export { setConfig }
