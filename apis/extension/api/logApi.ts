import { post } from './request'
import type {
  GetLogsRequest,
  GetLogsResponse,
} from '../types/log'

export const logApi = {
  getLogs: (data: GetLogsRequest) => post<GetLogsResponse>('/log/list', data),
}