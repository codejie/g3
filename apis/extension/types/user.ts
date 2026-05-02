import type { BaseRequest, BaseResponse } from './common'

export interface Profile {
  id: string
  user_id: string
  name: string
  email?: string
  nickname?: string
  avatar?: string
  gender?: string
  description?: string
  department?: string
  remark?: string
}

export interface User {
  id: string
  username: string
  password: string
  role: string
  disabled: number
  profile_id: string
  created: number
  updated: number
}

export interface Token {
  token: string
  expires_at: number
}

export interface LoginRequest extends BaseRequest {
  username: string
  password: string
  role?: string
}

export interface LoginResult {
  token: Token
  profile: Profile
  permissions?: string[]
}

export type LoginResponse = BaseResponse<LoginResult>

export type LogoutResponse = BaseResponse<void>

export interface RefreshTokenRequest extends BaseRequest {}

export interface RefreshTokenResult {
  token: Token
}

export type RefreshTokenResponse = BaseResponse<RefreshTokenResult>

export interface RegisterRequest extends BaseRequest {
  username: string
  password: string
  role?: string
}

export interface RegisterResult {
  id: string
}

export type RegisterResponse = BaseResponse<RegisterResult>

export interface ProfileRequest extends BaseRequest {
  id?: string
}

export interface ProfileResult {
  profile: Profile
}

export type ProfileResponse = BaseResponse<ProfileResult>

export interface UpdateProfileRequest extends BaseRequest {
  name?: string
  email?: string
  nickname?: string
  avatar?: string
  gender?: string
  description?: string
  department?: string
  remark?: string
}

export interface UpdateProfileResult {
  id: string
}

export type UpdateProfileResponse = BaseResponse<UpdateProfileResult>

export interface DeleteUserRequest extends BaseRequest {
  id: string
}

export type DeleteUserResponse = BaseResponse<void>

export interface ChangePasswordRequest extends BaseRequest {
  id: string
  new_password: string
}

export type ChangePasswordResponse = BaseResponse<void>

export interface GetUsersRequest extends BaseRequest {
  role?: string
}

export interface UserItem {
  id: string
  username: string
  role: string
  disabled: number
  profile_id: string
  created_at: number
  updated_at: number
  profile?: Profile
}

export interface GetUsersResult {
  items: UserItem[]
}

export type GetUsersResponse = BaseResponse<GetUsersResult>