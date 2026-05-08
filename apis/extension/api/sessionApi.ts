import { post, setConfig } from './request'
import type {
  GetSessionsRequest,
  GetSessionsResponse,
} from '../types/session'

export const sessionApi = {
  list: (data?: GetSessionsRequest) => post<GetSessionsResponse>('/session/list', data ?? {}),
}

export { setConfig }
