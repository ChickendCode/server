export interface JwtConfig {
  secret: string;
  accessTokenExpireTime: number;
  refreshTokenExpireTime: number;
}
