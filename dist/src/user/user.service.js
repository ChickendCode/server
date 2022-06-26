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
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const user_schema_1 = require("../schemas/user.schema");
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
const config_1 = require("@nestjs/config");
const refreshToken_schema_1 = require("../schemas/refreshToken.schema");
const redis_service_1 = require("../redis/redis.service");
const leaderBoard_1 = require("../gateway/interface/leaderBoard");
let UserService = class UserService {
    constructor(userModel, configService, redisService) {
        this.userModel = userModel;
        this.configService = configService;
        this.redisService = redisService;
    }
    async getLeaderBoard() {
        const leaderBoard = await this.userModel
            .find()
            .sort({ win: 'desc' })
            .limit(15)
            .select('username win lose -_id')
            .exec();
        return leaderBoard;
    }
    async updateLeaderBoardsAfterRegister(user) {
        const leaderBoards = await this.redisService.cacheManager.get('game_leader_board');
        leaderBoards.push({
            username: user.username,
            win: user.win,
            lose: user.lose,
        });
        await this.redisService.cacheManager.set('game_leader_board', leaderBoards.slice(0, 15));
    }
    async createUser(userRegistrationData) {
        const { username, password } = userRegistrationData;
        const isExist = await this.userModel.findOne({
            username: username,
        });
        if (isExist)
            throw new common_1.HttpException('User with that username already exists', common_1.HttpStatus.CONFLICT);
        const hashedPassword = await bcrypt.hash(password, parseInt(this.configService.get('bcrypt_salt'), 10));
        const user = await this.userModel.create(Object.assign(Object.assign({}, userRegistrationData), { password: hashedPassword }));
        return user;
    }
    async getUserWithCredential(username, plainTextPassword) {
        const user = await this.userModel.findOne({ username });
        if (!user)
            throw new common_1.HttpException('Invalid credential', common_1.HttpStatus.UNAUTHORIZED);
        await this.verifyPassword(plainTextPassword, user.password);
        return user;
    }
    async getUserWithId(id) {
        const user = await this.userModel.findById(id);
        return user;
    }
    async getUserWithUsername(username) {
        const user = await this.userModel.findOne({ username });
        return user;
    }
    async verifyPassword(plainTextPassword, hashedPassword) {
        const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
        if (!isMatch)
            throw new common_1.HttpException('Invalid credential', common_1.HttpStatus.UNAUTHORIZED);
    }
};
UserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('USER_MODEL')),
    __metadata("design:paramtypes", [mongoose_1.Model,
        config_1.ConfigService,
        redis_service_1.RedisService])
], UserService);
exports.UserService = UserService;
//# sourceMappingURL=user.service.js.map