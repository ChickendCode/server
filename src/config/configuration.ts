export default () => ({
  api: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    ttl: process.env.REDIS_TTL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    accessTokenExpireTime: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
    refreshTokenExpireTime: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
  },
  database: {
    username: process.env.MONGO_USERNAME,
    name: process.env.MONGODB_DBNAME,
  },
  bcrypt_salt: process.env.BCRYPT_SALT,
});
