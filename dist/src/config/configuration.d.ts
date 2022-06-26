declare const _default: () => {
    api: {
        host: string;
        port: string;
    };
    redis: {
        host: string;
        port: string;
        ttl: string;
    };
    jwt: {
        secret: string;
        accessTokenExpireTime: string;
        refreshTokenExpireTime: string;
    };
    database: {
        username: string;
        name: string;
    };
    bcrypt_salt: string;
};
export default _default;
