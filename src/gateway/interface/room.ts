export interface CreateRoomDTO {
  roomName: string;
  roomPassword?: string;
}

export type JoinRoomDTO = CreateRoomDTO;

export interface MatchMoveDTO {
  xIndex: number;
  yIndex: number;
}

export interface Player {
  name: string;
  pos: 1 | 2;
  isReady: boolean;
}

export interface Viewer {
  name: string;
}

const Timer = {
  matchStart: 3,
  matchMove: 15,
  matchFinish: 5,
};

// export interface OnGoingMatch {
//   matchMoves: (number | null)[][];
//   nextTurn: 1 | 2;
//   result?: {
//     winner: 1 | 2;
//     streak: MatchMoveDTO[];
//   };
// }

export interface OnGoingMatch {
  matchMoves: (number | null)[][];
  nextTurn: 1 | 2;
  result?: {
    winner: 1 | 2;
    streak: MatchMoveDTO[];
  };
  timeout?: {
    instance: number;
    startTime: number;
    type: 'matchStart' | 'matchMove' | 'matchFinish';
  };
}

/**
 * Class used for working with room
 */
export class Room {
  name: string;
  owner: string;
  password?: string;
  player: Player[];
  viewer: Viewer[];
  onGoingMatch?: OnGoingMatch;
  // inRoom: string[];

  constructor(name: string, owner: string, password?: string) {
    this.owner = owner;
    this.password = password;
    this.name = name;
    this.player = [{ name: owner, pos: 1, isReady: false }];
    this.viewer = [];
    // this.inRoom = [owner];
  }

  /**
   * Method used for handling join request. User will join room as a viewer
   * @param username username of requested user
   * @returns true if user is not in room, false otherwise
   */
  public handleJoin(username: string) {
    if (
      this.viewer.findIndex((viewer) => viewer.name === username) < 0 &&
      this.player.findIndex((player) => player.name === username) < 0
    ) {
      this.viewer.push({ name: username });
      return true;
    }
    return false;
  }

  /**
   * Method used to handle user's request to be a player
   * @param username username of requested viewer
   * @param pos player position, either player 1 or 2
   * @returns true if ok, false otherwise
   */
  public handleRequestToPlay(username: string, pos: 1 | 2) {
    // check if that position is not empty
    if (this.player.findIndex((player) => player.pos === pos) >= 0)
      return false;

    // if the request's user is already a player, swap the position
    const indexPlayer = this.player.findIndex(
      (player) => player.name === username,
    );
    if (indexPlayer >= 0) this.player[indexPlayer].pos = pos;
    // otherwise fill the position with that user
    else {
      const indexViewer = this.viewer.findIndex(
        (viewer) => viewer.name === username,
      );
      if (indexViewer < 0) return false;
      this.player.push({
        name: username,
        pos,
        isReady: false,
      });
      this.viewer.splice(indexViewer, 1);
    }
    return true;
  }

  /**
   * Method used for handling player's request to be a viewer
   * @param username username of request user
   * @returns true if ok, false otherwise
   */
  public handleRequestToBeViewer(username: string) {
    // check if that user was a player and do other job
    const indexPlayer = this.player.findIndex(
      (player) => player.name === username,
    );
    if (indexPlayer < 0) return false;
    this.player.splice(indexPlayer, 1);
    this.viewer.push({ name: username });
    return true;
  }

  /**
   * Method used for handling player's status change
   * @param username player's username
   * @returns true if ok, false otherwise
   */
  public handlePlayerReadyStatusChange(username: string) {
    const index = this.player.findIndex((player) => player.name === username);
    if (index < 0) return false;
    this.player[index].isReady = !this.player[index].isReady;
    return true;
  }

  /**
   * Method for handling room's member leave
   * @param username
   * @returns
   */
  public handleLeave(username: string) {
    const isPlayer = this.player.findIndex(
      (player) => player.name === username,
    );
    if (isPlayer >= 0) this.player.splice(isPlayer, 1);
    const isViewer = this.viewer.findIndex(
      (viewer) => viewer.name === username,
    );
    if (isViewer >= 0) this.viewer.splice(isPlayer, 1);
    return this;
  }

  public handleMove(username: string, xIndex: number, yIndex: number) {
    if (!this.onGoingMatch || this.onGoingMatch.result) return false;
    const player = this.player.find((player) => player.name === username);
    if (!player || player.pos !== this.onGoingMatch.nextTurn) return false;
    this.onGoingMatch.matchMoves[xIndex][yIndex] = this.onGoingMatch.nextTurn;
    this.onGoingMatch.nextTurn = this.onGoingMatch.nextTurn === 1 ? 2 : 1;
    return true;
  }

  public calculateResult(): 1 | 2 | null {
    if (!this.onGoingMatch) return null;
    if (
      this.onGoingMatch.matchMoves.reduce(
        (prevSum, currentCol) =>
          prevSum +
          currentCol.reduce((prev, cur) => (cur ? prev + 1 : prev), 0),
        0,
      ) >= 10
    ) {
      // this.onGoingMatch.result = 2;
      return 2;
    }
    return null;
  }

  public calculateWinner(
    xIndex: number,
    yIndex: number,
  ): { winner: 1 | 2; streak: MatchMoveDTO[] } {
    if (!this.onGoingMatch) return;
    const board = this.onGoingMatch.matchMoves;
    const boardLength = board.length;
    const turn = this.onGoingMatch.nextTurn === 1 ? 2 : 1;
    const opponent = this.onGoingMatch.nextTurn;

    const topMost = xIndex - 4 < 0 ? 0 : xIndex - 4;
    const bottomMost =
      xIndex + 4 > boardLength - 1 ? boardLength - 1 : xIndex + 4;
    const leftMost = yIndex - 4 < 0 ? 0 : yIndex - 4;
    const rightMost =
      yIndex + 4 > boardLength - 1 ? boardLength - 1 : yIndex + 4;

    const topLeftLost =
      xIndex - 4 >= 0 && yIndex - 4 >= 0
        ? 0
        : Math.max(0 - (xIndex - 4), 0 - (yIndex - 4));
    const topLeft = {
      xIndex: xIndex - 4 + topLeftLost,
      yIndex: yIndex - 4 + topLeftLost,
    };
    const topRightLost =
      xIndex - 4 >= 0 && yIndex + 4 <= boardLength - 1
        ? 0
        : Math.max(0 - (xIndex - 4), yIndex + 4 - (boardLength - 1));
    const topRight = {
      xIndex: xIndex - 4 + topRightLost,
      yIndex: yIndex + 4 - topRightLost,
    };
    const bottomLeftLost =
      xIndex + 4 <= boardLength - 1 && yIndex - 4 >= 0
        ? 0
        : Math.max(xIndex + 4 - (boardLength - 1), 0 - (yIndex - 4));
    const bottomLeft = {
      xIndex: xIndex + 4 - bottomLeftLost,
      yIndex: yIndex - 4 + bottomLeftLost,
    };
    const bottomRightLost =
      xIndex + 4 <= boardLength - 1 && yIndex + 4 <= boardLength - 1
        ? 0
        : Math.max(
            xIndex + 4 - (boardLength - 1),
            yIndex + 4 - (boardLength - 1),
          );
    const bottomRight = {
      xIndex: xIndex + 4 - bottomRightLost,
      yIndex: yIndex + 4 - bottomRightLost,
    };

    // check possible row win
    const streak: MatchMoveDTO[] = [];
    for (let y = leftMost; y <= rightMost; y++) {
      if (board[xIndex][y] === turn) {
        streak.push({ xIndex, yIndex: y });
      } else {
        streak.length = 0;
      }
      if (streak.length === 5) {
        const leftGuard =
          streak[0].yIndex === 0
            ? opponent
            : board[xIndex][streak[0].yIndex - 1];
        const rightGuard =
          streak[4].yIndex === boardLength - 1
            ? opponent
            : board[xIndex][streak[4].yIndex + 1];
        if (!(leftGuard === rightGuard && leftGuard === opponent))
          return { winner: turn, streak };
      }
    }

    // check possible column win
    streak.length = 0;
    for (let x = topMost; x <= bottomMost; x++) {
      if (board[x][yIndex] === turn) {
        streak.push({ xIndex: x, yIndex });
      } else {
        streak.length = 0;
      }
      if (streak.length === 5) {
        const topGuard =
          streak[0].xIndex === 0
            ? opponent
            : board[streak[0].xIndex - 1][yIndex];
        const bottomGuard =
          streak[4].xIndex === boardLength - 1
            ? opponent
            : board[streak[4].xIndex + 1][yIndex];
        if (!(topGuard === bottomGuard && topGuard === opponent))
          return { winner: turn, streak };
      }
    }

    // check possible anti diagonal win
    streak.length = 0;
    for (
      let x = topLeft.xIndex, y = topLeft.yIndex;
      x <= bottomRight.xIndex && y <= bottomRight.yIndex;
      x++, y++
    ) {
      if (board[x][y] === turn) {
        streak.push({ xIndex: x, yIndex: y });
      } else {
        streak.length = 0;
      }
      if (streak.length === 5) {
        const topLeftGuard =
          streak[0].xIndex === 0 || streak[0].yIndex === 0
            ? opponent
            : board[streak[0].xIndex - 1][streak[0].yIndex - 1];
        const bottomRightGuard =
          streak[4].xIndex === boardLength - 1 ||
          streak[4].yIndex === boardLength - 1
            ? opponent
            : board[streak[4].xIndex + 1][streak[4].yIndex + 1];
        if (!(topLeftGuard === bottomRightGuard && topLeftGuard === opponent))
          return { winner: turn, streak };
      }
    }

    // check possible main diagonal win
    streak.length = 0;
    for (
      let x = bottomLeft.xIndex, y = bottomLeft.yIndex;
      x >= topRight.xIndex && y <= topRight.yIndex;
      x--, y++
    ) {
      if (board[x][y] === turn) {
        streak.push({ xIndex: x, yIndex: y });
      } else {
        streak.length = 0;
      }
      if (streak.length === 5) {
        const bottomLeftGuard =
          streak[0].xIndex === boardLength - 1 || streak[0].yIndex === 0
            ? opponent
            : board[streak[0].xIndex + 1][streak[0].yIndex - 1];
        const topRightGuard =
          streak[4].xIndex === 0 || streak[4].yIndex === boardLength - 1
            ? opponent
            : board[streak[4].xIndex - 1][streak[4].yIndex + 1];
        if (
          !(bottomLeftGuard === topRightGuard && bottomLeftGuard === opponent)
        )
          return { winner: turn, streak };
      }
    }
    return null;
  }

  /**
   * Method used for transforming an instance of class Room to a DTO
   * @returns a DTO
   */
  public changeToDTO() {
    return {
      name: this.name,
      owner: this.owner,
      havePassword: !!this.password,
      player: this.player,
      viewer: this.viewer,
      onGoingMatch: this.onGoingMatch && {
        ...this.onGoingMatch,
        timeout: this.onGoingMatch.timeout && {
          type: this.onGoingMatch.timeout.type,
          remain:
            Timer[this.onGoingMatch.timeout.type] -
            Math.round(
              (Date.now() - this.onGoingMatch.timeout.startTime) / 1000,
            ),
        },
      },
    };
  }

  public getUserRoleInRoom(username: string): Viewer | Player {
    const isViewer = this.viewer.find((viewer) => viewer.name === username);
    if (isViewer) return isViewer;
    const isPlayer = this.player.find((player) => player.name === username);
    if (isPlayer) return isPlayer;
  }
}
