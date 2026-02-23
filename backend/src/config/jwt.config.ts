export const jwtConfig = {
  secret: process.env.JWT_SECRET ?? 'CHANGE_THIS_IN_PRODUCTION',
  accessTokenExpiry: '15m',
  refreshTokenExpiry: '7d',
};
