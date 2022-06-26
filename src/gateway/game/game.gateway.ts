import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse } from 'cookie';
import { Socket, Namespace } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import {
  CreateRoomDTO,
  JoinRoomDTO,
  MatchMoveDTO,
  Room,
} from '../interface/room';
import { ISocketWithUserData } from '../interface/socketWithUserData';
import { plainToClass } from 'class-transformer';
import { GameService } from './game.service';
import { User } from 'src/schemas/user.schema';
import { match } from 'assert';
import { ILeaderBoard } from '../interface/leaderBoard';

@WebSocketGateway({
  namespace: 'game',
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  namespace: Namespace;

  constructor(
    private authenticationService: AuthenticationService,
    private redisService: RedisService,
    private userService: UserService,
    private gameService: GameService,
  ) {}

  /**
   * Method used for handling client socket disconnecting.
   * @param socket: client socket
   */
  async handleDisconnect(socket: ISocketWithUserData) {
    try {
      // retrieve user's socket instance and update it
      const userId = socket.data.userId;
      const user = await this.userService.getUserWithId(userId);
      const socketIndex = user.currentSocketInstances.indexOf(socket.id);
      if (socketIndex >= 0) user.currentSocketInstances.splice(socketIndex, 1);

      // we have to check 2 things: if he is not in a room, or he still have another socket instance
      // if both are true, then just save his data back after remove the current socket instance
      if (!user.currentRoom || user.currentSocketInstances.length) {
        await user.save();
        return;
      }

      // otherwise, check if he is a player in an ongoing match in his room
      // first get his room's data
      const plainRoomObj = await this.redisService.cacheManager.get<Room>(
        user.currentRoom,
      );
      const roomData = plainToClass(Room, plainRoomObj);
      // now check if he is the last in his room, it means there is no match, so we just have to
      // delete the room
      if (roomData.player.length + roomData.viewer.length === 1) {
        console.log('here');
        // clear any timeout, delete room's data in redis and broadcast
        clearTimeout(roomData.onGoingMatch?.timeout?.instance);
        await this.redisService.cacheManager.del(user.currentRoom);
        this.namespace.emit(
          'room_change',
          roomData.changeToDTO(),
          'remove_room',
        );
        user.currentRoom = undefined;
        await user.save();
        return;
      }

      let isInMatch;
      // otherwise check if he is a player and in an ongoing match or not
      const role = roomData.getUserRoleInRoom(user.username);
      if (
        'pos' in role &&
        roomData.onGoingMatch &&
        !roomData.onGoingMatch.result
      ) {
        // clear any timeout instance
        clearTimeout(roomData.onGoingMatch.timeout?.instance);
        // check if that match is just begin or not
        // if true then emit cancel match
        if (roomData.onGoingMatch.timeout.type === 'matchStart') {
          this.namespace.to(user.currentRoom).emit('match_start_cancel');
        }
        // otherwise end the ongoing match and do some result update
        else {
          isInMatch = true;
          // first get the winner
          const winner = roomData.player.find(
            (player) => player.name !== user.username,
          );
          // update the winner's document in db
          const winnerDocument = await this.userService.getUserWithUsername(
            winner.name,
          );
          winnerDocument.win += 1;
          user.lose += 1;
          await winnerDocument.save();
          // emit match result update to the winner's socket instance to update UI
          winnerDocument.currentSocketInstances.forEach((socketId) => {
            this.namespace.to(socketId).emit('update_after_match', {
              username: winnerDocument.username,
              win: winnerDocument.win,
              lose: winnerDocument.lose,
            });
          });
          // emit match result to room
          roomData.onGoingMatch.result = {
            winner: winner.pos,
            streak: [],
          };
          this.namespace.to(user.currentRoom).emit('match_result', {
            ...roomData.onGoingMatch.result,
            reason: 'Player ' + user.username + ' has quit',
          });
          // update leader-board
          this.gameService
            .updateLeaderBoard(winnerDocument, user)
            .then((leaderBoard) => {
              this.namespace.emit('leaderBoard', leaderBoard);
            });

          // set a match finish timeout that will be fired after 5s
          const matchFinishTimeout = setTimeout(async () => {
            // first get roomData
            const roomAfter = await this.redisService.cacheManager.get<Room>(
              roomData.name,
            );
            // clear match data, and make all players unready
            roomAfter.onGoingMatch = undefined;
            roomAfter.player = roomAfter.player.map((player) => ({
              ...player,
              isReady: false,
            }));
            await this.redisService.cacheManager.set<Room>(
              roomAfter.name,
              roomAfter,
            );
            // emit back to room for UI updating
            this.namespace
              .to(roomAfter.name)
              .emit(
                'match_finish',
                plainToClass(Room, roomAfter).changeToDTO(),
              );
          }, 5000);
          // save timeout instance in room's data for later clear
          roomData.onGoingMatch.timeout = {
            instance: matchFinishTimeout[Symbol.toPrimitive](),
            startTime: Date.now(),
            type: 'matchFinish',
          };
        }
      }

      // finally, update room's data after leave
      const roomAfterLeave = roomData.handleLeave(user.username);
      // broadcast back
      if (!isInMatch) {
        this.namespace
          .to(roomAfterLeave.name)
          .emit('room_member_change', roomAfterLeave.changeToDTO());
      }

      this.namespace.emit(
        'room_change',
        roomAfterLeave.changeToDTO(),
        'change',
      );
      await this.redisService.cacheManager.set<Room>(
        roomAfterLeave.name,
        roomAfterLeave,
      );
      // save user's document back to db
      user.currentRoom = undefined;
      await user.save();
    } catch (error: any) {
      console.error(error);
    }
  }

  /**
   * Method used for handling websocket connection. User authentication will be processed
   * here and user's id will be attach to the socket instance for later use
   * @param socket: client socket
   */
  async handleConnection(socket: Socket) {
    // get cookie from handshake request and do authentication
    const cookies = socket.handshake.headers.cookie;
    const AccessToken = cookies && parse(cookies).AccessToken;
    if (!AccessToken) {
      return socket.disconnect();
    }

    try {
      const user = await this.authenticationService.verifyAccessToken(
        AccessToken,
      );
      if (!user) {
        return socket.disconnect();
      }
      user.currentSocketInstances.push(socket.id);
      await user.save();
      socket.data.userId = user._id;
      socket.emit('connect_accept');
      const leaderBoard = await this.redisService.cacheManager.get<
        ILeaderBoard[]
      >('game_leader_board');
      socket.emit('leaderBoard', leaderBoard.slice(0, 5));
    } catch (error: any) {
      console.log(error);
      socket.disconnect();
    }
  }

  /**
   * Method used to retrieve user current room data, used when a new websocket connection
   * of a same user established
   * @param socket : client socket
   */
  @SubscribeMessage('retrieve_current_room')
  async listenForRetrieveCurrentRoom(
    // @MessageBody() { roomName, roomPassword }: JoinRoomDTO,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    // retrieve user current room if exist
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return { success: false };
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    if (!roomFromRedis) return;
    const room = plainToClass(Room, roomFromRedis);
    socket.join(user.currentRoom);
    return { success: true, data: room.changeToDTO() };
  }

  /**
   * Method used for handling request to join room from client socket
   * @param param0 Authenticate data of the requested room: name and password
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('join_room')
  async listenForJoiningRoomRequest(
    @MessageBody() { roomName, roomPassword }: JoinRoomDTO,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (user.currentRoom) return;
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      roomName,
    );
    if (!roomFromRedis) return;
    const roomDetail = plainToClass(Room, roomFromRedis);
    if (!roomDetail.password || roomDetail.password === roomPassword) {
      roomDetail.handleJoin(user.username);
      await this.redisService.cacheManager.set<Room>(roomName, roomDetail);
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
      // return {
      //   data: roomDetail.changeToDTO(),
      // };
    }
  }

  /**
   * Method used for fetching all room when a client socket establish a connection
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('fetch_rooms')
  async listenForFetchRooms(
    // @MessageBody() data: string,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    const userId = socket.data.userId;
    if (!userId) return;
    const roomFromRedis = Array.from(this.namespace.adapter.rooms).map(
      (room): Promise<Room> => this.redisService.cacheManager.get(room[0]),
    );
    const rooms = await Promise.all(roomFromRedis);
    const result = rooms
      .filter((room) => room !== null)
      .map((room) => {
        const convertRoom = plainToClass(Room, room);
        return convertRoom.changeToDTO();
      });
    return result;
  }

  /**
   * Method used for handling create room request
   * @param param0 Authentication data: room name and password
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('create_room')
  async listenForCreateRoom(
    @MessageBody() { roomName, roomPassword }: CreateRoomDTO,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    const userId = socket.data.userId;
    if (!userId) return;
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
    user.currentSocketInstances.forEach((socketId) =>
      this.namespace.sockets.get(socketId).join(roomName),
    );
    // socket.join(roomName);
    const newRoom = new Room(roomName, user.username, roomPassword);
    await this.redisService.cacheManager.set<Room>(roomName, newRoom);
    user.currentRoom = roomName;
    await user.save();
    this.namespace.emit('room_change', newRoom.changeToDTO(), 'new_room');
    return { data: plainToClass(Room, newRoom).changeToDTO() };
  }

  /**
   * Method used for handling match move
   * @param param0 Coordinate of the move
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('match_move')
  async listenForMatchMove(
    @MessageBody() { xIndex, yIndex }: MatchMoveDTO,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    // get user data
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return;
    // get room data
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    const room = plainToClass(Room, roomFromRedis);
    // handle move, if ok emit to room
    const result = room.handleMove(user.username, xIndex, yIndex);
    if (!result) return result;
    this.namespace.to(user.currentRoom).emit('match_move', xIndex, yIndex);
    // clear next move timeout and set a new one
    clearTimeout(room.onGoingMatch.timeout.instance);
    // get next player and set timeout
    const nextPlayer = room.player.find(
      (player) => player.name !== user.username,
    );
    room.onGoingMatch.timeout = {
      instance: setTimeout(() => {
        this.gameService.handleTurnOutOfTime(
          room.name,
          nextPlayer.name,
          this.namespace,
        );
      }, 15 * 1000)[Symbol.toPrimitive](),
      startTime: Date.now(),
      type: 'matchMove',
    };
    // calculate result
    const matchResult = room.calculateWinner(xIndex, yIndex);
    // if we have result, emit result to room
    if (matchResult) {
      // clear match move timeout
      clearTimeout(room.onGoingMatch.timeout.instance);
      room.onGoingMatch.result = matchResult;

      // update database
      const winner = room.player.find(
        (player) => player.pos === matchResult.winner,
      );
      const loser = room.player.find(
        (player) => player.pos !== matchResult.winner,
      );
      const winnerDocument = await this.userService.getUserWithUsername(
        winner.name,
      );
      const loserDocument = await this.userService.getUserWithUsername(
        loser.name,
      );
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

      // emit result
      this.namespace.to(user.currentRoom).emit('match_result', matchResult);
      // update leader-board
      this.gameService
        .updateLeaderBoard(winnerDocument, loserDocument)
        .then((leaderBoard) => {
          this.namespace.emit('leaderBoard', leaderBoard);
        });

      // set match_finish timeout
      const matchFinishTimeout = setTimeout(async () => {
        const roomAfter = await this.redisService.cacheManager.get<Room>(
          room.name,
        );
        roomAfter.onGoingMatch = undefined;
        roomAfter.player = roomAfter.player.map((player) => ({
          ...player,
          isReady: false,
        }));
        await this.redisService.cacheManager.set<Room>(room.name, roomAfter);
        this.namespace
          .to(room.name)
          .emit('match_finish', plainToClass(Room, roomAfter).changeToDTO());
      }, 5000);
      room.onGoingMatch.timeout = {
        instance: matchFinishTimeout[Symbol.toPrimitive](),
        startTime: Date.now(),
        type: 'matchFinish',
      };
    }

    await this.redisService.cacheManager.set<Room>(user.currentRoom, room);
    return true;
  }

  /**
   * Method used for handling a room viewer's request be a player
   * @param pos shorthand for position
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('request_to_be_player')
  async listenForRequestJoinMatch(
    @MessageBody() pos: 1 | 2,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    // get use data
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return;
    // get room data
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    const room = plainToClass(Room, roomFromRedis);
    // handle request
    const result = room.handleRequestToPlay(user.username, pos);
    if (!result) return result;
    // save room data to redis and emit event back to room
    await this.redisService.cacheManager.set<Room>(user.currentRoom, room);
    this.namespace.emit('room_change', room.changeToDTO(), 'change');
    this.namespace
      .to(user.currentRoom)
      .emit('room_member_change', room.changeToDTO());
    // this.namespace.to().
    // this.namespace.broadcast(user.currentRoom).broadcast('match_move', { xIndex, yIndex });
    return result;
  }

  /**
   * Method used for handling a room player's request to be a viewer
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('request_to_be_viewer')
  async listenForRequestToBeViewer(
    // @MessageBody() pos: 1 | 2,
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    // get user data
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return;
    // get room data
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    const room = plainToClass(Room, roomFromRedis);
    // handle request
    const result = room.handleRequestToBeViewer(user.username);
    if (!result) return result;
    // save room data to redis and emit event back to room
    await this.redisService.cacheManager.set<Room>(user.currentRoom, room);
    this.namespace.emit('room_change', room.changeToDTO(), 'change');
    this.namespace
      .to(user.currentRoom)
      .emit('room_member_change', room.changeToDTO());
    // this.namespace.to().
    // this.namespace.broadcast(user.currentRoom).broadcast('match_move', { xIndex, yIndex });
    return result;
  }

  /**
   * Method used for handling a room player's ready status change
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('ready_status_change')
  async listenForReadyStatusChange(
    @ConnectedSocket() socket: ISocketWithUserData,
  ) {
    // get user data
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return;
    // get room data
    const roomFromRedis = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    const room = plainToClass(Room, roomFromRedis);
    // handle request
    const result = room.handlePlayerReadyStatusChange(user.username);
    if (!result) return result;
    // if both player are ready, ready the match
    if (
      room.player.length === 2 &&
      room.player.every((player) => player.isReady)
    ) {
      room.onGoingMatch = {
        matchMoves: Array(15)
          .fill(null)
          .map(() => Array(15).fill(null)),
        nextTurn: 1,
      };
      // maybe match ready here, but dont change any state; after 3 second emit match
      // setTimeout(() => {
      // get room
      // room.onGoingMatch = {
      //   matchMoves: Array(15)
      //     .fill(null)
      //     .map(() => Array(15).fill(null)),
      //   nextTurn: 1,
      // };
      // set room
      this.namespace.to(room.name).emit('match_start', room.onGoingMatch);
      const matchStartTimeout = setTimeout(async () => {
        const room = plainToClass(
          Room,
          await this.redisService.cacheManager.get<Room>(user.currentRoom),
        );
        // get next player and set timeout
        const nextPlayer = room.player.find((player) => player.pos === 1);
        room.onGoingMatch.timeout = {
          instance: setTimeout(() => {
            this.gameService.handleTurnOutOfTime(
              room.name,
              nextPlayer.name,
              this.namespace,
            );
          }, 15 * 1000)[Symbol.toPrimitive](),
          startTime: Date.now(),
          type: 'matchMove',
        };
        await this.redisService.cacheManager.set<Room>(user.currentRoom, room);
        this.namespace
          .to(room.name)
          .emit('match_start_count', room.onGoingMatch);
      }, 3000);
      room.onGoingMatch.timeout = {
        instance: matchStartTimeout[Symbol.toPrimitive](),
        startTime: Date.now(),
        type: 'matchStart',
      };
      // }, 1000);
    }
    // if not then check if there was any match_start timeout, cancel it
    else {
      if (
        room.onGoingMatch &&
        room.onGoingMatch.timeout &&
        room.onGoingMatch.timeout.type === 'matchStart'
      ) {
        clearTimeout(room.onGoingMatch.timeout.instance);
        room.onGoingMatch = undefined;
        this.namespace.to(room.name).emit('match_start_cancel');
      }
    }
    // save room data to redis and emit event back to room
    await this.redisService.cacheManager.set<Room>(user.currentRoom, room);
    this.namespace
      .to(user.currentRoom)
      .emit('room_member_change', room.changeToDTO());
    return result;
  }

  /**
   * Method used for handling leave room request
   * @param socket client socket
   * @returns
   */
  @SubscribeMessage('leave_room')
  async listenForLeaveRoom(@ConnectedSocket() socket: ISocketWithUserData) {
    // retrieve user from socket instance
    const userId = socket.data.userId;
    if (!userId) return;
    const user = await this.userService.getUserWithId(userId);
    if (!user.currentRoom) return;

    // get room data from redis
    const plainRoomObj = await this.redisService.cacheManager.get<Room>(
      user.currentRoom,
    );
    const room = plainToClass(Room, plainRoomObj);

    // if user is a player, and there is an onGoingMatch, end the match in defeat for him
    const role = room.getUserRoleInRoom(user.username);
    if ('pos' in role && room.onGoingMatch && !room.onGoingMatch.result) {
      // clear match move timeout
      clearTimeout(room.onGoingMatch.timeout.instance);
      // if timeout type is matchStart, cancel that match
      if (room.onGoingMatch.timeout.type === 'matchStart') {
        this.namespace.to(room.name).emit('match_start_cancel');
        room.onGoingMatch = undefined;
        const roomAfterLeave = room.handleLeave(user.username);
        this.namespace
          .to(roomAfterLeave.name)
          .emit('room_member_change', roomAfterLeave.changeToDTO());
        this.namespace.emit(
          'room_change',
          roomAfterLeave.changeToDTO(),
          'change',
        );
        await this.redisService.cacheManager.set<Room>(
          roomAfterLeave.name,
          roomAfterLeave,
        );
      }
      // timeout type is match_move, end the match
      else {
        // get winner document and update it
        const winner = room.player.find(
          (player) => player.name !== user.username,
        );
        const winnerDocument = await this.userService.getUserWithUsername(
          winner.name,
        );
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

        // broadcast match result to room
        room.onGoingMatch.result = {
          winner: winner.pos,
          streak: [],
        };
        this.namespace.to(user.currentRoom).emit('match_result', {
          ...room.onGoingMatch.result,
          reason: 'Player ' + user.username + ' has quit',
        });
        // update leader-board
        this.gameService
          .updateLeaderBoard(winnerDocument, user)
          .then((leaderBoard) => {
            this.namespace.emit('leaderBoard', leaderBoard);
          });
        // handle leave and emit room data back to room
        const roomAfterLeave = room.handleLeave(user.username);
        this.namespace.emit(
          'room_change',
          roomAfterLeave.changeToDTO(),
          'change',
        );

        // set a match_finish timeout
        const matchFinishTimeout = setTimeout(async () => {
          const roomAfter = await this.redisService.cacheManager.get<Room>(
            room.name,
          );
          roomAfter.onGoingMatch = undefined;
          roomAfter.player = roomAfter.player.map((player) => ({
            ...player,
            isReady: false,
          }));
          await this.redisService.cacheManager.set<Room>(room.name, roomAfter);
          this.namespace
            .to(room.name)
            .emit('match_finish', plainToClass(Room, roomAfter).changeToDTO());
        }, 5000);
        roomAfterLeave.onGoingMatch.timeout = {
          instance: matchFinishTimeout[Symbol.toPrimitive](),
          startTime: Date.now(),
          type: 'matchFinish',
        };
        await this.redisService.cacheManager.set<Room>(
          roomAfterLeave.name,
          roomAfterLeave,
        );
      }
    } else {
      // if user is not a player, just make him leave the room
      const roomAfterLeave = room.handleLeave(user.username);
      if (roomAfterLeave.player.length + roomAfterLeave.viewer.length === 0) {
        // clear any timeout left
        clearTimeout(roomAfterLeave.onGoingMatch?.timeout?.instance);
        await this.redisService.cacheManager.del(user.currentRoom);
        this.namespace.emit('room_change', room.changeToDTO(), 'remove_room');
      } else {
        await this.redisService.cacheManager.set<Room>(
          user.currentRoom,
          roomAfterLeave,
        );
        this.namespace.emit(
          'room_change',
          roomAfterLeave.changeToDTO(),
          'change',
        );
        this.namespace
          .to(room.name)
          .emit('room_member_change', roomAfterLeave.changeToDTO());
      }
    }

    // after make user leave room, get all his socket instances and leave room
    user.currentSocketInstances.forEach((socketId) => {
      this.namespace.sockets.get(socketId).leave(room.name);
      this.namespace.to(socketId).emit('leave_room');
    });
    user.currentRoom = undefined;
    await user.save();
    return true;
  }

  /**
   * Method used for handling incoming global chat
   * @param socket client socket
   * @param message message content
   * @returns
   */
  @SubscribeMessage('global_chat')
  async listenForChat(
    @ConnectedSocket() socket: ISocketWithUserData,
    @MessageBody() message: { sender: string; content: string },
  ) {
    // retrieve user from socket instance
    const userId = socket.data.userId;
    if (!userId) return;

    // emit message globally
    this.namespace.emit('global_chat', { ...message, time: new Date() });
  }
}
