"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenProvider = void 0;
const refreshToken_schema_1 = require("./refreshToken.schema");
exports.refreshTokenProvider = [
    {
        provide: 'REFRESH_TOKEN_MODEL',
        useFactory: (connection) => connection.model('RefreshToken', refreshToken_schema_1.RefreshTokenSchema),
        inject: ['DATABASE_CONNECTION'],
    },
];
//# sourceMappingURL=refreshToken.provider.js.map