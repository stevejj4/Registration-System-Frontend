export type UserRole = 'facilitator' | 'coordinator' | 'admin';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  /** normalized role (e.g. 'facilitator'|'coordinator'|'admin') */
  role: UserRole;
  /** raw role string returned by backend (e.g. 'ROLE_FACILITATOR') */
  rawRole?: string;
}

export interface AuthResponse {
  token: string;
  role: string;
  id: number;
  email: string;
  fullName: string;
}
