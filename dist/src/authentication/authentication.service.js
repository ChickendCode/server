"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationService = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../user/user.service");
const user_register_dto_1 = require("../user/dto/user-register.dto");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const interface_1 = require("../config/interface");
const refreshToken_dto_1 = require("../user/dto/refreshToken.dto");
const refresh_token_service_1 = require("../refresh-token/refresh-token.service");
let AuthenticationService = class AuthenticationService {
    constructor(userService, jwtService, configService, refreshTokenService) {
        this.userService = userService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.refreshTokenService = refreshTokenService;
    }
    async validateCredential(username, plainTextPassword) {
        const userData = await this.userService.getUserWithCredential(username, plainTextPassword);
        return userData;
    }
    async verifyAccessToken(token) {
        const payload = await this.jwtService.verifyAsync(token, {
            secret: this.configService.get('jwt.secret'),
        });
        const userData = await this.userService.getUserWithId(payload.id);
        return userData;
    }
    async register(userRegistrationData) {
        const userData = await this.userService.createUser(userRegistrationData);
        return userData;
    }
    async createRefreshToken(refreshTokenData) {
        const refreshToken = await this.refreshTokenService.createRefreshToken(refreshTokenData);
    }
    async getActiveRefreshToken(refreshTokenId) {
        const refreshToken = await this.refreshTokenService.getRefreshToken(refreshTokenId);
        if (!refreshToken)
            throw new common_1.HttpException('Invalid refresh token', 401);
        if (!refreshToken.isActive)
            throw new common_1.HttpException('Malicious action', 401);
        return refreshToken;
    }
    async getUserWithId(id) {
        const user = await this.userService.getUserWithId(id);
        return user;
    }
    async generateTokenCookie(accessTokenPayload, refreshTokenPayload) {
        const accessTokenCookie = await this.generateAccessTokenCookie(accessTokenPayload);
        const refreshTokenCookie = await this.generateRefreshTokenCookie(refreshTokenPayload);
        return { accessTokenCookie, refreshTokenCookie };
    }
    async generateAccessTokenCookie(tokenPayload) {
        const jwtConfig = this.configService.get('jwt');
        const accessToken = await this.jwtService.signAsync(tokenPayload, {
            secret: jwtConfig.secret,
            expiresIn: 18000,
        });
        return `AccessToken=${accessToken}; HttpOnly; Path=/; Max-Age=${jwtConfig.accessTokenExpireTime}`;
    }
    async generateRefreshTokenCookie(tokenPayload) {
        const jwtConfig = this.configService.get('jwt');
        const refreshToken = await this.jwtService.signAsync(tokenPayload, {
            secret: jwtConfig.secret,
            expiresIn: 18000,
        });
        return `RefreshToken=${refreshToken}; HttpOnly; Path=${'/auth/refresh'}; Max-Age=${jwtConfig.refreshTokenExpireTime}`;
    }
};
AuthenticationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService,
        jwt_1.JwtService,
        config_1.ConfigService,
        refresh_token_service_1.RefreshTokenService])
], AuthenticationService);
exports.AuthenticationService = AuthenticationService;
//# sourceMappingURL=authentication.service.js.map