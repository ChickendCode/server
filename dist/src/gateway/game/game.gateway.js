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
exports.GameGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const cookie_1 = require("cookie");
const socket_io_1 = require("socket.io");
const authentication_service_1 = require("../../authentication/authentication.service");
const redis_service_1 = require("../../redis/redis.service");
const user_service_1 = require("../../user/user.service");
const room_1 = require("../interface/room");
const class_transformer_1 = require("class-transformer");
const game_service_1 = require("./game.service");
const user_schema_1 = require("../../schemas/user.schema");
let GameGateway = class GameGateway {
    constructor(authenticationService, redisService, userService, gameService) {
        this.authenticationService = authenticationService;
        this.redisService = redisService;
        this.userService = userService;
        this.gameService = gameService;
    }
    async handleDisconnect(socket) {
        var _a, _b, _c;
        try {
            const userId = socket.data.userId;
            const user = await this.userService.getUserWithId(userId);
            const socketIndex = user.currentSocketInstances.indexOf(socket.id);
            if (socketIndex >= 0)
                user.currentSocketInstances.splice(socketIndex, 1);
            if (!user.currentRoom || user.currentSocketInstances.length) {
                await user.save();
                return;
            }
            const plainRoomObj = await this.redisService.cacheManager.get(user.currentRoom);
            const roomData = (0, class_transformer_1.plainToClass)(room_1.Room, plainRoomObj);
            if (roomData.player.length + roomData.viewer.length === 1) {
                console.log('here');
                clearTimeout((_b = (_a = roomData.onGoingMatch) === null || _a === void 0 ? void 0 : _a.timeout) === null || _b === void 0 ? void 0 : _b.instance);
                await this.redisService.cacheManager.del(user.currentRoom);
                this.namespace.emit('room_change', roomData.changeToDTO(), 'remove_room');
                user.currentRoom = undefined;
                await user.save();
                return;
            }
            let isInMatch;
            const role = roomData.getUserRoleInRoom(user.username);
            if ('pos' in role &&
                roomData.onGoingMatch &&
                !roomData.onGoingMatch.result) {
                clearTimeout((_c = roomData.onGoingMatch.timeout) === null || _c === void 0 ? void 0 : _c.instance);
                if (roomData.onGoingMatch.timeout.type === 'matchStart') {
                    this.namespace.to(user.currentRoom).emit('match_start_cancel');
                }
                else {
                    isInMatch = true;
                    const winner = roomData.player.find((player) => player.name !== user.username);
                    const winnerDocument = await this.userService.getUserWithUsername(winner.name);
                    winnerDocument.win += 1;
                    user.lose += 1;
                    await winnerDocument.save();
                    winnerDocument.currentSocketInstances.forEach((socketId) => {
                        this.namespace.to(socketId).emit('update_after_match', {
                            username: winnerDocument.username,
                            win: winnerDocument.win,
                            lose: winnerDocument.lose,
                        });
                    });
                    roomData.onGoingMatch.result = {
                        winner: winner.pos,
                        streak: [],
                    };
                    this.namespace.to(user.currentRoom).emit('match_result', Object.assign(Object.assign({}, roomData.onGoingMatch.result), { reason: 'Player ' + user.username + ' has quit' }));
                    this.gameService
                        .updateLeaderBoard(winnerDocument, user)
                        .then((leaderBoard) => {
                        this.namespace.emit('leaderBoard', leaderBoard);
                    });
                    const matchFinishTimeout = setTimeout(async () => {
                        const roomAfter = await this.redisService.cacheManager.get(roomData.name);
                        roomAfter.onGoingMatch = undefined;
                        roomAfter.player = roomAfter.player.map((player) => (Object.assign(Object.assign({}, player), { isReady: false })));
                        await this.redisService.cacheManager.set(roomAfter.name, roomAfter);
                        this.namespace
                            .to(roomAfter.name)
                            .emit('match_finish', (0, class_transformer_1.plainToClass)(room_1.Room, roomAfter).changeToDTO());
                    }, 5000);
                    roomData.onGoingMatch.timeout = {
                        instance: matchFinishTimeout[Symbol.toPrimitive](),
                        startTime: Date.now(),
                        type: 'matchFinish',
                    };
                }
            }
            const roomAfterLeave = roomData.handleLeave(user.username);
            if (!isInMatch) {
                this.namespace
                    .to(roomAfterLeave.name)
                    .emit('room_member_change', roomAfterLeave.changeToDTO());
            }
            this.namespace.emit('room_change', roomAfterLeave.changeToDTO(), 'change');
            await this.redisService.cacheManager.set(roomAfterLeave.name, roomAfterLeave);
            user.currentRoom = undefined;
            await user.save();
        }
        catch (error) {
            console.error(error);
        }
    }
    async handleConnection(socket) {
        const cookies = socket.handshake.headers.cookie;
        const AccessToken = cookies && (0, cookie_1.parse)(cookies).AccessToken;
        if (!AccessToken) {
            return socket.disconnect();
        }
        try {
            const user = await this.authenticationService.verifyAccessToken(AccessToken);
            if (!user) {
                return socket.disconnect();
            }
            user.currentSocketInstances.push(socket.id);
            await user.save();
            socket.data.userId = user._id;
            socket.emit('connect_accept');
            const leaderBoard = await this.redisService.cacheManager.get('game_leader_board');
            socket.emit('leaderBoard', leaderBoard.slice(0, 5));
        }
        catch (error) {
            console.log(error);
            socket.disconnect();
        }
    }
    async listenForRetrieveCurrentRoom(socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return { success: false };
        const roomFromRedis = await this.redisService.cacheManager.get(user.currentRoom);
        if (!roomFromRedis)
            return;
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        socket.join(user.currentRoom);
        return { success: true, data: room.changeToDTO() };
    }
    async listenForJoiningRoomRequest({ roomName, roomPassword }, socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (user.currentRoom)
            return;
        const roomFromRedis = await this.redisService.cacheManager.get(roomName);
        if (!roomFromRedis)
            return;
        const roomDetail = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        if (!roomDetail.password || roomDetail.password === roomPassword) {
            roomDetail.handleJoin(user.username);
            await this.redisService.cacheManager.set(roomName, roomDetail);
            user.currentRoom = roomName;
            await user.save();
            this.namespace.emit('room_change', roomDetail.changeToDTO(), 'change');
            this.namespace
                .to(roomName)
                .emit('room_member_change', roomDetail.changeToDTO());
            user.currentSocketInstances.forEach((socketId) => {
                this.namespace.sockets.get(socketId).join(roomName);
                this.namespace.to(socketId).emit('sync_join', roomDetail.changeToDTO());
            });
        }
    }
    async listenForFetchRooms(socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const roomFromRedis = Array.from(this.namespace.adapter.rooms).map((room) => this.redisService.cacheManager.get(room[0]));
        const rooms = await Promise.all(roomFromRedis);
        const result = rooms
            .filter((room) => room !== null)
            .map((room) => {
            const convertRoom = (0, class_transformer_1.plainToClass)(room_1.Room, room);
            return convertRoom.changeToDTO();
        });
        return result;
    }
    async listenForCreateRoom({ roomName, roomPassword }, socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (user.currentRoom)
            return {
                errorMessage: 'You are already in a room',
            };
        const isExist = this.namespace.adapter.rooms.get(roomName);
        if (isExist)
            return {
                errorMessage: 'This name is already taken. Choose another name',
            };
        user.currentSocketInstances.forEach((socketId) => this.namespace.sockets.get(socketId).join(roomName));
        const newRoom = new room_1.Room(roomName, user.username, roomPassword);
        await this.redisService.cacheManager.set(roomName, newRoom);
        user.currentRoom = roomName;
        await user.save();
        this.namespace.emit('room_change', newRoom.changeToDTO(), 'new_room');
        return { data: (0, class_transformer_1.plainToClass)(room_1.Room, newRoom).changeToDTO() };
    }
    async listenForMatchMove({ xIndex, yIndex }, socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return;
        const roomFromRedis = await this.redisService.cacheManager.get(user.currentRoom);
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        const result = room.handleMove(user.username, xIndex, yIndex);
        if (!result)
            return result;
        this.namespace.to(user.currentRoom).emit('match_move', xIndex, yIndex);
        clearTimeout(room.onGoingMatch.timeout.instance);
        const nextPlayer = room.player.find((player) => player.name !== user.username);
        room.onGoingMatch.timeout = {
            instance: setTimeout(() => {
                this.gameService.handleTurnOutOfTime(room.name, nextPlayer.name, this.namespace);
            }, 15 * 1000)[Symbol.toPrimitive](),
            startTime: Date.now(),
            type: 'matchMove',
        };
        const matchResult = room.calculateWinner(xIndex, yIndex);
        if (matchResult) {
            clearTimeout(room.onGoingMatch.timeout.instance);
            room.onGoingMatch.result = matchResult;
            const winner = room.player.find((player) => player.pos === matchResult.winner);
            const loser = room.player.find((player) => player.pos !== matchResult.winner);
            const winnerDocument = await this.userService.getUserWithUsername(winner.name);
            const loserDocument = await this.userService.getUserWithUsername(loser.name);
            winnerDocument.win += 1;
            loserDocument.lose += 1;
            await winnerDocument.save();
            await loserDocument.save();
            winnerDocument.currentSocketInstances.forEach((socketId) => {
                this.namespace.to(socketId).emit('update_after_match', {
                    username: winnerDocument.username,
                    win: winnerDocument.win,
                    lose: winnerDocument.lose,
                });
            });
            loserDocument.currentSocketInstances.forEach((socketId) => {
                this.namespace.to(socketId).emit('update_after_match', {
                    username: loserDocument.username,
                    win: loserDocument.win,
                    lose: loserDocument.lose,
                });
            });
            this.namespace.to(user.currentRoom).emit('match_result', matchResult);
            this.gameService
                .updateLeaderBoard(winnerDocument, loserDocument)
                .then((leaderBoard) => {
                this.namespace.emit('leaderBoard', leaderBoard);
            });
            const matchFinishTimeout = setTimeout(async () => {
                const roomAfter = await this.redisService.cacheManager.get(room.name);
                roomAfter.onGoingMatch = undefined;
                roomAfter.player = roomAfter.player.map((player) => (Object.assign(Object.assign({}, player), { isReady: false })));
                await this.redisService.cacheManager.set(room.name, roomAfter);
                this.namespace
                    .to(room.name)
                    .emit('match_finish', (0, class_transformer_1.plainToClass)(room_1.Room, roomAfter).changeToDTO());
            }, 5000);
            room.onGoingMatch.timeout = {
                instance: matchFinishTimeout[Symbol.toPrimitive](),
                startTime: Date.now(),
                type: 'matchFinish',
            };
        }
        await this.redisService.cacheManager.set(user.currentRoom, room);
        return true;
    }
    async listenForRequestJoinMatch(pos, socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return;
        const roomFromRedis = await this.redisService.cacheManager.get(user.currentRoom);
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        const result = room.handleRequestToPlay(user.username, pos);
        if (!result)
            return result;
        await this.redisService.cacheManager.set(user.currentRoom, room);
        this.namespace.emit('room_change', room.changeToDTO(), 'change');
        this.namespace
            .to(user.currentRoom)
            .emit('room_member_change', room.changeToDTO());
        return result;
    }
    async listenForRequestToBeViewer(socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return;
        const roomFromRedis = await this.redisService.cacheManager.get(user.currentRoom);
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        const result = room.handleRequestToBeViewer(user.username);
        if (!result)
            return result;
        await this.redisService.cacheManager.set(user.currentRoom, room);
        this.namespace.emit('room_change', room.changeToDTO(), 'change');
        this.namespace
            .to(user.currentRoom)
            .emit('room_member_change', room.changeToDTO());
        return result;
    }
    async listenForReadyStatusChange(socket) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return;
        const roomFromRedis = await this.redisService.cacheManager.get(user.currentRoom);
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, roomFromRedis);
        const result = room.handlePlayerReadyStatusChange(user.username);
        if (!result)
            return result;
        if (room.player.length === 2 &&
            room.player.every((player) => player.isReady)) {
            room.onGoingMatch = {
                matchMoves: Array(15)
                    .fill(null)
                    .map(() => Array(15).fill(null)),
                nextTurn: 1,
            };
            this.namespace.to(room.name).emit('match_start', room.onGoingMatch);
            const matchStartTimeout = setTimeout(async () => {
                const room = (0, class_transformer_1.plainToClass)(room_1.Room, await this.redisService.cacheManager.get(user.currentRoom));
                const nextPlayer = room.player.find((player) => player.pos === 1);
                room.onGoingMatch.timeout = {
                    instance: setTimeout(() => {
                        this.gameService.handleTurnOutOfTime(room.name, nextPlayer.name, this.namespace);
                    }, 15 * 1000)[Symbol.toPrimitive](),
                    startTime: Date.now(),
                    type: 'matchMove',
                };
                await this.redisService.cacheManager.set(user.currentRoom, room);
                this.namespace
                    .to(room.name)
                    .emit('match_start_count', room.onGoingMatch);
            }, 3000);
            room.onGoingMatch.timeout = {
                instance: matchStartTimeout[Symbol.toPrimitive](),
                startTime: Date.now(),
                type: 'matchStart',
            };
        }
        else {
            if (room.onGoingMatch &&
                room.onGoingMatch.timeout &&
                room.onGoingMatch.timeout.type === 'matchStart') {
                clearTimeout(room.onGoingMatch.timeout.instance);
                room.onGoingMatch = undefined;
                this.namespace.to(room.name).emit('match_start_cancel');
            }
        }
        await this.redisService.cacheManager.set(user.currentRoom, room);
        this.namespace
            .to(user.currentRoom)
            .emit('room_member_change', room.changeToDTO());
        return result;
    }
    async listenForLeaveRoom(socket) {
        var _a, _b;
        const userId = socket.data.userId;
        if (!userId)
            return;
        const user = await this.userService.getUserWithId(userId);
        if (!user.currentRoom)
            return;
        const plainRoomObj = await this.redisService.cacheManager.get(user.currentRoom);
        const room = (0, class_transformer_1.plainToClass)(room_1.Room, plainRoomObj);
        const role = room.getUserRoleInRoom(user.username);
        if ('pos' in role && room.onGoingMatch && !room.onGoingMatch.result) {
            clearTimeout(room.onGoingMatch.timeout.instance);
            if (room.onGoingMatch.timeout.type === 'matchStart') {
                this.namespace.to(room.name).emit('match_start_cancel');
                room.onGoingMatch = undefined;
                const roomAfterLeave = room.handleLeave(user.username);
                this.namespace
                    .to(roomAfterLeave.name)
                    .emit('room_member_change', roomAfterLeave.changeToDTO());
                this.namespace.emit('room_change', roomAfterLeave.changeToDTO(), 'change');
                await this.redisService.cacheManager.set(roomAfterLeave.name, roomAfterLeave);
            }
            else {
                const winner = room.player.find((player) => player.name !== user.username);
                const winnerDocument = await this.userService.getUserWithUsername(winner.name);
                winnerDocument.win += 1;
                await winnerDocument.save();
                user.lose += 1;
                winnerDocument.currentSocketInstances.forEach((socketId) => {
                    this.namespace.to(socketId).emit('update_after_match', {
                        username: winnerDocument.username,
                        win: winnerDocument.win,
                        lose: winnerDocument.lose,
                    });
                });
                user.currentSocketInstances.forEach((socketId) => {
                    this.namespace.to(socketId).emit('update_after_match', {
                        username: user.username,
                        win: user.win,
                        lose: user.lose,
                    });
                });
                room.onGoingMatch.result = {
                    winner: winner.pos,
                    streak: [],
                };
                this.namespace.to(user.currentRoom).emit('match_result', Object.assign(Object.assign({}, room.onGoingMatch.result), { reason: 'Player ' + user.username + ' has quit' }));
                this.gameService
                    .updateLeaderBoard(winnerDocument, user)
                    .then((leaderBoard) => {
                    this.namespace.emit('leaderBoard', leaderBoard);
                });
                const roomAfterLeave = room.handleLeave(user.username);
                this.namespace.emit('room_change', roomAfterLeave.changeToDTO(), 'change');
                const matchFinishTimeout = setTimeout(async () => {
                    const roomAfter = await this.redisService.cacheManager.get(room.name);
                    roomAfter.onGoingMatch = undefined;
                    roomAfter.player = roomAfter.player.map((player) => (Object.assign(Object.assign({}, player), { isReady: false })));
                    await this.redisService.cacheManager.set(room.name, roomAfter);
                    this.namespace
                        .to(room.name)
                        .emit('match_finish', (0, class_transformer_1.plainToClass)(room_1.Room, roomAfter).changeToDTO());
                }, 5000);
                roomAfterLeave.onGoingMatch.timeout = {
                    instance: matchFinishTimeout[Symbol.toPrimitive](),
                    startTime: Date.now(),
                    type: 'matchFinish',
                };
                await this.redisService.cacheManager.set(roomAfterLeave.name, roomAfterLeave);
            }
        }
        else {
            const roomAfterLeave = room.handleLeave(user.username);
            if (roomAfterLeave.player.length + roomAfterLeave.viewer.length === 0) {
                clearTimeout((_b = (_a = roomAfterLeave.onGoingMatch) === null || _a === void 0 ? void 0 : _a.timeout) === null || _b === void 0 ? void 0 : _b.instance);
                await this.redisService.cacheManager.del(user.currentRoom);
                this.namespace.emit('room_change', room.changeToDTO(), 'remove_room');
            }
            else {
                await this.redisService.cacheManager.set(user.currentRoom, roomAfterLeave);
                this.namespace.emit('room_change', roomAfterLeave.changeToDTO(), 'change');
                this.namespace
                    .to(room.name)
                    .emit('room_member_change', roomAfterLeave.changeToDTO());
            }
        }
        user.currentSocketInstances.forEach((socketId) => {
            this.namespace.sockets.get(socketId).leave(room.name);
            this.namespace.to(socketId).emit('leave_room');
        });
        user.currentRoom = undefined;
        await user.save();
        return true;
    }
    async listenForChat(socket, message) {
        const userId = socket.data.userId;
        if (!userId)
            return;
        this.namespace.emit('global_chat', Object.assign(Object.assign({}, message), { time: new Date() }));
    }
};
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Namespace)
], GameGateway.prototype, "namespace", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('retrieve_current_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForRetrieveCurrentRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForJoiningRoomRequest", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('fetch_rooms'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForFetchRooms", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('create_room'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForCreateRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('match_move'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForMatchMove", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_to_be_player'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForRequestJoinMatch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('request_to_be_viewer'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForRequestToBeViewer", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('ready_status_change'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForReadyStatusChange", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave_room'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForLeaveRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('global_chat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GameGateway.prototype, "listenForChat", null);
GameGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        namespace: 'game',
    }),
    __metadata("design:paramtypes", [authentication_service_1.AuthenticationService,
        redis_service_1.RedisService,
        user_service_1.UserService,
        game_service_1.GameService])
], GameGateway);
exports.GameGateway = GameGateway;
//# sourceMappingURL=game.gateway.js.map