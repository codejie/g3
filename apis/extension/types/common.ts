export type PageInfo = {
  page: number
  size: number
  total?: number
}

export type SortInfo = {
  field: string
  order: 'ASC' | 'DESC' // ASC or DESC
}

export interface BaseRequest {
  requestId?: string // Request ID, make uuid and convert to 8-bytes hash
}

export interface BaseResponse<RESULT = any> {
  code: number
  message?: string // Add message field
  data?: RESULT
}

// Response code constants for business logic results
export const RESPONSE_CODES = {
  // Success codes
  SUCCESS: 0,

  // General error codes
  INVALID_REQUEST: -1,
  VALIDATION_ERROR: -2,
  UNAUTHORIZED: -3,
  FORBIDDEN: -4,
  NOT_FOUND: -5,
  CONFLICT: -6,
  INTERNAL_ERROR: -7,
}

export type ResponseCode = (typeof RESPONSE_CODES)[keyof typeof RESPONSE_CODES]
