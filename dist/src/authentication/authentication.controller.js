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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticationController = void 0;
const common_1 = require("@nestjs/common");
const authentication_service_1 = require("./authentication.service");
const local_guard_1 = require("./guards/local.guard");
const worker_threads_1 = require("worker_threads");
const user_register_dto_1 = require("../user/dto/user-register.dto");
const mongooseSerialize_interceptor_1 = require("../interceptor/mongooseSerialize.interceptor");
const user_schema_1 = require("../schemas/user.schema");
const refresh_token_guard_1 = require("./guards/refresh_token.guard");
const refresh_token_service_1 = require("../refresh-token/refresh-token.service");
const user_service_1 = require("../user/user.service");
let AuthenticationController = class AuthenticationController {
    constructor(authenticationService, refreshTokenService, userService) {
        this.authenticationService = authenticationService;
        this.refreshTokenService = refreshTokenService;
        this.userService = userService;
    }
    async login(request) {
        const { user: userData } = request;
        const refreshToken = await this.refreshTokenService.createRefreshToken({
            user: userData._id,
            createdByIp: request.ip,
            userAgent: request.headers['user-agent'],
        });
        const { accessTokenCookie, refreshTokenCookie } = await this.authenticationService.generateTokenCookie({
            id: userData._id,
        }, { id: refreshToken._id });
        request.res.setHeader('Set-Cookie', [
            accessTokenCookie,
            refreshTokenCookie,
        ]);
        return userData;
    }
    async handleRegister(userRegistrationData, request) {
        const userData = await this.authenticationService.register(userRegistrationData);
        const refreshToken = await this.refreshTokenService.createRefreshToken({
            user: userData._id,
            createdByIp: request.ip,
            userAgent: request.headers['user-agent'],
        });
        const { accessTokenCookie, refreshTokenCookie } = await this.authenticationService.generateTokenCookie({
            id: userData._id.toString(),
        }, { id: refreshToken._id });
        request.res.setHeader('Set-Cookie', [
            accessTokenCookie,
            refreshTokenCookie,
        ]);
        await this.userService.updateLeaderBoardsAfterRegister(userData);
        return userData;
    }
    async getItem(request) {
        console.log('task');
        const time = Date.now();
        const promise = new Promise((res) => {
            const worker = new worker_threads_1.Worker('./worker.js', {
                workerData: {
                    value: 45,
                    path: './worker.ts',
                },
            });
            worker.on('message', (result) => {
                res(result);
            });
        });
        await promise;
        return Date.now() - time;
    }
    async refresh(request) {
        const { user: refreshToken } = request;
        const newRefreshToken = await this.refreshTokenService.createRefreshToken({
            user: refreshToken.user._id,
            createdByIp: request.ip,
            userAgent: request.headers['user-agent'],
        });
        refreshToken.revokedAt = new Date();
        refreshToken.replacedByToken = newRefreshToken._id;
        await refreshToken.save();
        const { accessTokenCookie, refreshTokenCookie } = await this.authenticationService.generateTokenCookie({
            id: refreshToken.user._id.toString(),
        }, { id: newRefreshToken._id });
        request.res.setHeader('Set-Cookie', [
            accessTokenCookie,
            refreshTokenCookie,
        ]);
        return 'OK';
    }
    async logout(request) {
        const { user: refreshToken } = request;
        refreshToken.revokedAt = new Date();
        await refreshToken.save();
        request.res.clearCookie('AccessToken');
        request.res.clearCookie('RefreshToken');
        return { success: true };
    }
};
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.UseGuards)(local_guard_1.LocalGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_register_dto_1.UserRegisterDTO, Object]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "handleRegister", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "getItem", null);
__decorate([
    (0, common_1.Get)('/refresh'),
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('/refresh/logout'),
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthenticationController.prototype, "logout", null);
AuthenticationController = __decorate([
    (0, common_1.Controller)('auth'),
    (0, common_1.UseInterceptors)((0, mongooseSerialize_interceptor_1.default)(user_schema_1.User)),
    __metadata("design:paramtypes", [authentication_service_1.AuthenticationService,
        refresh_token_service_1.RefreshTokenService,
        user_service_1.UserService])
], AuthenticationController);
exports.AuthenticationController = AuthenticationController;
//# sourceMappingURL=authentication.controller.js.map