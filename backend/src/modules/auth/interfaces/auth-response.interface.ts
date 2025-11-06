export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    email_verified: boolean;
  };
}

export interface JwtPayload {
  user_id: string;
  tenant_id: string;
  email: string;
  roles: Array<{
    id: string;
    name: string;
    scope_type: string;
    scope_id: string | null;
  }>;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string; // JWT ID for revocation
}
