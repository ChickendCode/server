import { Injectable, OnModuleInit } from '@nestjs/common';
import { Namespace, Socket } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { parse } from 'cookie';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { plainToClass } from 'class-transformer';
import { MatchMoveDTO, Room } from '../interface/room';
import { WebSocketServer } from '@nestjs/websockets';
import { User, UserDocument } from 'src/schemas/user.schema';
import { ILeaderBoard } from '../interface/leaderBoard';

@Injectable()
export class GameService implements OnModuleInit {
  constructor(
    private authenticationService: AuthenticationService,
    private redisService: RedisService,
    private userService: UserService,
  ) {}

  async onModuleInit() {
    const leaderBoard = await this.userService.getLeaderBoard();
    await this.redisService.cacheManager.set('game_leader_board', leaderBoard);
  }

  async updateLeaderBoard(winner: UserDocument, loser: UserDocument) {
    const leaderBoard = await this.redisService.cacheManager.get<
      ILeaderBoard[]
    >('game_leader_board');
    const isWinnerInTop = leaderBoard.findIndex(
      (item) => item.username === winner.username,
    );
    const isLoserInTop = leaderBoard.findIndex(
      (item) => item.username === loser.username,
    );
    if (isWinnerInTop !== -1) {
      leaderBoard[isWinnerInTop] = {
        username: winner.username,
        win: winner.win,
        lose: winner.lose,
      };
    } else {
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

  /**
   * This function is used to get room data from redis cache with room's name
   * @param roomName room's name
   * @returns room object converted from plain redis object
   */
  async getRoomDataFromRedis(roomName: string) {
    const plainRoomObj = await this.redisService.cacheManager.get<Room>(
      roomName,
    );
    return plainToClass(Room, plainRoomObj);
  }

  // async handleMatchMove(
  //   currentPlayer: string,
  //   xIndex: number,
  //   yIndex: number,
  //   room: Room,
  // ) {
  //   // first let's check if the move is valid
  //   const isValidMove = room.handleMove(currentPlayer, xIndex, yIndex);
  //   if (!isValidMove)
  //     return {
  //       success: false,
  //     };
  //   // the move is valid, then let emit back to room's client
  //   namespace.to(room.name).emit('match_move', xIndex, yIndex);
  //   // then we clear any timeout in room
  //   clearTimeout(room.onGoingMatch.timeout.instance);
  //   // then we find the next player and set a new timeout
  //   const nextPlayer = room.player.find(
  //     (player) => player.name !== currentPlayer,
  //   );
  //   room.onGoingMatch.timeout = {
  //     instance: setTimeout(() => {
  //       this.handleTurnOutOfTime(room.name, nextPlayer.name, namespace);
  //     }, 15 * 1000)[Symbol.toPrimitive](),
  //     startTime: Date.now(),
  //     type: 'matchMove',
  //   };
  //   // finally return the room object for further working
  //   return {
  //     success: true,
  //     room,
  //   };
  // }

  // async calculateResult(room: Room, xIndex: number, yIndex: number) {
  //   const matchResult = room.calculateWinner(xIndex, yIndex)
  //   if (!matchResult) return;

  // }
  // async handleMatchFinish(
  //   room: Room,
  //   matchResult: { winner: 1 | 2; streak: MatchMoveDTO[] },
  // ) {
  //   // first clear any timeout
  //   clearTimeout(room.onGoingMatch.timeout.instance);
  //   room.onGoingMatch.result = matchResult;
  //   // then emit result back to room
  //   namespace.to(room.name).emit('match_result', matchResult);

  //   // set match_finish timeout
  //   const matchFinishTimeout = setTimeout(async () => {
  //     const roomAfter = await this.redisService.cacheManager.get<Room>(
  //       room.name,
  //     );
  //     roomAfter.onGoingMatch = undefined;
  //     roomAfter.player = roomAfter.player.map((player) => ({
  //       ...player,
  //       isReady: false,
  //     }));
  //     await this.redisService.cacheManager.set<Room>(room.name, roomAfter);
  //     namespace
  //       .to(room.name)
  //       .emit('match_finish', plainToClass(Room, roomAfter).changeToDTO());
  //   }, 5000);
  //   room.onGoingMatch.timeout = {
  //     instance: matchFinishTimeout[Symbol.toPrimitive](),
  //     startTime: Date.now(),
  //     type: 'matchFinish',
  //   };
  //   // update statistic
  //   const winner = room.player.find(
  //     (player) => player.pos === matchResult.winner,
  //   );
  //   const loser = room.player.find(
  //     (player) => player.pos !== matchResult.winner,
  //   );
  //   const winnerDocument =
  //   // finally return room object
  //   return room;
  // }

  /**
   * This function is used to handle turn timeout event. It will be register as a timeout
   * callback after each move
   * @param roomName name of room
   * @param currentPlayer name of player that doesn't using his turn
   * @returns
   */
  async handleTurnOutOfTime(
    roomName: string,
    currentPlayer: string,
    namespace: Namespace,
  ) {
    // fist get room data
    const room = await this.getRoomDataFromRedis(roomName);
    // then filter match board to get blank square
    const blankSquares = room.onGoingMatch.matchMoves.reduce<number[][]>(
      (prevX, curX, xIndex) =>
        prevX.concat(
          curX.reduce<number[][]>((prevY, curY, yIndex) => {
            if (!curY) prevY.push([xIndex, yIndex]);
            return prevY;
          }, []),
        ),
      [],
    );
    // random a move from those blank square
    const [randomXIndex, randomYIndex] =
      blankSquares[Math.floor(Math.random() * blankSquares.length)];
    // call handle move method of room
    const result = room.handleMove(currentPlayer, randomXIndex, randomYIndex);
    if (!result) return result;
    // emit event
    namespace.to(roomName).emit('match_move', randomXIndex, randomYIndex);
    // clearTimeout and set a new one
    clearTimeout(room.onGoingMatch.timeout.instance);
    const nextPlayer = room.player.find(
      (player) => player.name !== currentPlayer,
    );
    room.onGoingMatch.timeout = {
      instance: setTimeout(() => {
        this.handleTurnOutOfTime(roomName, nextPlayer.name, namespace);
      }, 15 * 1000)[Symbol.toPrimitive](),
      startTime: Date.now(),
      type: 'matchMove',
    };
    // calculate result
    const matchResult = room.calculateWinner(randomXIndex, randomYIndex);
    // if we have result, emit result to room
    if (matchResult) {
      // clear match move timeout
      clearTimeout(room.onGoingMatch.timeout.instance);
      room.onGoingMatch.result = matchResult;
      namespace.to(roomName).emit('match_result', matchResult);

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
      winnerDocument.save();
      loserDocument.save();
      // update leader-board
      this.updateLeaderBoard(winnerDocument, loserDocument).then(
        (leaderBoard) => {
          namespace.emit('leaderBoard', leaderBoard);
        },
      );

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
        namespace
          .to(room.name)
          .emit('match_finish', plainToClass(Room, roomAfter).changeToDTO());
      }, 5000);
      room.onGoingMatch.timeout = {
        instance: matchFinishTimeout[Symbol.toPrimitive](),
        startTime: Date.now(),
        type: 'matchFinish',
      };
    }

    await this.redisService.cacheManager.set<Room>(roomName, room);
    return true;
  }
}
