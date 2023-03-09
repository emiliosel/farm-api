export interface TokenUser {
  id: string;
  email: string;
  role: string;
}

export interface TokenData {
  user: TokenUser;
  iat: number;
  exp: number;
}
