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
exports.GameService = void 0;
const common_1 = require("@nestjs/common");
const authentication_service_1 = require("../../authentication/authentication.service");
const redis_service_1 = require("../../redis/redis.service");
const user_service_1 = require("../../user/user.service");
const class_transformer_1 = require("class-transformer");
const room_1 = require("../interface/room");
const user_schema_1 = require("../../schemas/user.schema");
let GameService = class GameService {
    constructor(authenticationService, redisService, userService) {
        this.authenticationService = authenticationService;
        this.redisService = redisService;
        this.userService = userService;
    }
    async onModuleInit() {
        const leaderBoard = await this.userService.getLeaderBoard();
        await this.redisService.cacheManager.set('game_leader_board', leaderBoard);
    }
    async updateLeaderBoard(winner, loser) {
        const leaderBoard = await this.redisService.cacheManager.get('game_leader_board');
        const isWinnerInTop = leaderBoard.findIndex((item) => item.username === winner.username);
        const isLoserInTop = leaderBoard.findIndex((item) => item.username === loser.username);
        if (isWinnerInTop !== -1) {
            leaderBoard[isWinnerInTop] = {
                username: winner.username,
                win: winner.win,
                lose: winner.lose,
            };
        }
        else {
            leaderBoard.concat({
                username: winner.username,
                win: winner.win,
                lose: winner.lose,
            });
        }
        if (isLoserInTop !== -1) {
            leaderBoard[isLoserInTop] = {
                username: loser.username,
                win: loser.win,
                lose: loser.lose,
            };
        }
        leaderBoard.sort((a, b) => b.win - a.win);
        await this.redisService.cacheManager.set('game_leader_board', leaderBoard);
        return leaderBoard.slice(0, 5);
    }
    async getRoomDataFromRedis(roomName) {
        const plainRoomObj = await this.redisService.cacheManager.get(roomName);
        return (0, class_transformer_1.plainToClass)(room_1.Room, plainRoomObj);
    }
    async handleTurnOutOfTime(roomName, currentPlayer, namespace) {
        const room = await this.getRoomDataFromRedis(roomName);
        const blankSquares = room.onGoingMatch.matchMoves.reduce((prevX, curX, xIndex) => prevX.concat(curX.reduce((prevY, curY, yIndex) => {
            if (!curY)
                prevY.push([xIndex, yIndex]);
            return prevY;
        }, [])), []);
        const [randomXIndex, randomYIndex] = blankSquares[Math.floor(Math.random() * blankSquares.length)];
        const result = room.handleMove(currentPlayer, randomXIndex, randomYIndex);
        if (!result)
            return result;
        namespace.to(roomName).emit('match_move', randomXIndex, randomYIndex);
        clearTimeout(room.onGoingMatch.timeout.instance);
        const nextPlayer = room.player.find((player) => player.name !== currentPlayer);
        room.onGoingMatch.timeout = {
            instance: setTimeout(() => {
                this.handleTurnOutOfTime(roomName, nextPlayer.name, namespace);
            }, 15 * 1000)[Symbol.toPrimitive](),
            startTime: Date.now(),
            type: 'matchMove',
        };
        const matchResult = room.calculateWinner(randomXIndex, randomYIndex);
        if (matchResult) {
            clearTimeout(room.onGoingMatch.timeout.instance);
            room.onGoingMatch.result = matchResult;
            namespace.to(roomName).emit('match_result', matchResult);
            const winner = room.player.find((player) => player.pos === matchResult.winner);
            const loser = room.player.find((player) => player.pos !== matchResult.winner);
            const winnerDocument = await this.userService.getUserWithUsername(winner.name);
            const loserDocument = await this.userService.getUserWithUsername(loser.name);
            winnerDocument.win += 1;
            loserDocument.lose += 1;
            winnerDocument.save();
            loserDocument.save();
            this.updateLeaderBoard(winnerDocument, loserDocument).then((leaderBoard) => {
                namespace.emit('leaderBoard', leaderBoard);
            });
            winnerDocument.currentSocketInstances.forEach((socketId) => {
                namespace.to(socketId).emit('update_after_match', {
                    username: winnerDocument.username,
                    win: winnerDocument.win,
                    lose: winnerDocument.lose,
                });
            });
            loserDocument.currentSocketInstances.forEach((socketId) => {
                namespace.to(socketId).emit('update_after_match', {
                    username: loserDocument.username,
                    win: loserDocument.win,
                    lose: loserDocument.lose,
                });
            });
            const matchFinishTimeout = setTimeout(async () => {
                const roomAfter = await this.redisService.cacheManager.get(room.name);
                roomAfter.onGoingMatch = undefined;
                roomAfter.player = roomAfter.player.map((player) => (Object.assign(Object.assign({}, player), { isReady: false })));
                await this.redisService.cacheManager.set(room.name, roomAfter);
                namespace
                    .to(room.name)
                    .emit('match_finish', (0, class_transformer_1.plainToClass)(room_1.Room, roomAfter).changeToDTO());
            }, 5000);
            room.onGoingMatch.timeout = {
                instance: matchFinishTimeout[Symbol.toPrimitive](),
                startTime: Date.now(),
                type: 'matchFinish',
            };
        }
        await this.redisService.cacheManager.set(roomName, room);
        return true;
    }
};
GameService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [authentication_service_1.AuthenticationService,
        redis_service_1.RedisService,
        user_service_1.UserService])
], GameService);
exports.GameService = GameService;
//# sourceMappingURL=game.service.js.map