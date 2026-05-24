export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthSession {
  token: string;
  role: string;
  userId: string;
  username: string;
  fullName?: string;
  branchId?: number;
}

export interface AuthErrorResponse {
  message: string;
  statusCode?: number;
}
