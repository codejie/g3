import { post } from './request'
import type {
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ProfileRequest,
  ProfileResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
} from '../types/user'

export const userApi = {
  login: (data: LoginRequest) => post<LoginResponse>('/user/login', data),

  logout: () => post<LogoutResponse>('/user/logout'),

  refreshToken: (data: RefreshTokenRequest) => post<RefreshTokenResponse>('/user/refresh', data),

  register: (data: RegisterRequest) => post<RegisterResponse>('/user/register', data),

  getProfile: (data: ProfileRequest) => post<ProfileResponse>('/user/profile', data),

  updateProfile: (data: UpdateProfileRequest) => post<UpdateProfileResponse>('/user/profile/update', data),
}