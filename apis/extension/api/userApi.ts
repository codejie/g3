import { post, setConfig } from './request'
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
  DeleteUserRequest,
  DeleteUserResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  GetUsersRequest,
  GetUsersResponse,
} from '../types/user'

export const userApi = {
  login: (data: LoginRequest) => post<LoginResponse>('user/login', data),

  logout: () => post<LogoutResponse>('user/logout', {}),

  refreshToken: (data: RefreshTokenRequest) => post<RefreshTokenResponse>('user/refresh', data),

  register: (data: RegisterRequest) => post<RegisterResponse>('user/register', data),

  getProfile: (data: ProfileRequest) => post<ProfileResponse>('user/profile', data),

  updateProfile: (data: UpdateProfileRequest) => post<UpdateProfileResponse>('user/profile/update', data),

  list: (data?: GetUsersRequest) => post<GetUsersResponse>('user/list', data ?? {}),

  delete: (data: DeleteUserRequest) => post<DeleteUserResponse>('user/delete', data),

  changePassword: (data: ChangePasswordRequest) => post<ChangePasswordResponse>('user/password', data),
}

export { setConfig }