"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Room = void 0;
const Timer = {
    matchStart: 3,
    matchMove: 15,
    matchFinish: 5,
};
class Room {
    constructor(name, owner, password) {
        this.owner = owner;
        this.password = password;
        this.name = name;
        this.player = [{ name: owner, pos: 1, isReady: false }];
        this.viewer = [];
    }
    handleJoin(username) {
        if (this.viewer.findIndex((viewer) => viewer.name === username) < 0 &&
            this.player.findIndex((player) => player.name === username) < 0) {
            this.viewer.push({ name: username });
            return true;
        }
        return false;
    }
    handleRequestToPlay(username, pos) {
        if (this.player.findIndex((player) => player.pos === pos) >= 0)
            return false;
        const indexPlayer = this.player.findIndex((player) => player.name === username);
        if (indexPlayer >= 0)
            this.player[indexPlayer].pos = pos;
        else {
            const indexViewer = this.viewer.findIndex((viewer) => viewer.name === username);
            if (indexViewer < 0)
                return false;
            this.player.push({
                name: username,
                pos,
                isReady: false,
            });
            this.viewer.splice(indexViewer, 1);
        }
        return true;
    }
    handleRequestToBeViewer(username) {
        const indexPlayer = this.player.findIndex((player) => player.name === username);
        if (indexPlayer < 0)
            return false;
        this.player.splice(indexPlayer, 1);
        this.viewer.push({ name: username });
        return true;
    }
    handlePlayerReadyStatusChange(username) {
        const index = this.player.findIndex((player) => player.name === username);
        if (index < 0)
            return false;
        this.player[index].isReady = !this.player[index].isReady;
        return true;
    }
    handleLeave(username) {
        const isPlayer = this.player.findIndex((player) => player.name === username);
        if (isPlayer >= 0)
            this.player.splice(isPlayer, 1);
        const isViewer = this.viewer.findIndex((viewer) => viewer.name === username);
        if (isViewer >= 0)
            this.viewer.splice(isPlayer, 1);
        return this;
    }
    handleMove(username, xIndex, yIndex) {
        if (!this.onGoingMatch || this.onGoingMatch.result)
            return false;
        const player = this.player.find((player) => player.name === username);
        if (!player || player.pos !== this.onGoingMatch.nextTurn)
            return false;
        this.onGoingMatch.matchMoves[xIndex][yIndex] = this.onGoingMatch.nextTurn;
        this.onGoingMatch.nextTurn = this.onGoingMatch.nextTurn === 1 ? 2 : 1;
        return true;
    }
    calculateResult() {
        if (!this.onGoingMatch)
            return null;
        if (this.onGoingMatch.matchMoves.reduce((prevSum, currentCol) => prevSum +
            currentCol.reduce((prev, cur) => (cur ? prev + 1 : prev), 0), 0) >= 10) {
            return 2;
        }
        return null;
    }
    calculateWinner(xIndex, yIndex) {
        if (!this.onGoingMatch)
            return;
        const board = this.onGoingMatch.matchMoves;
        const boardLength = board.length;
        const turn = this.onGoingMatch.nextTurn === 1 ? 2 : 1;
        const opponent = this.onGoingMatch.nextTurn;
        const topMost = xIndex - 4 < 0 ? 0 : xIndex - 4;
        const bottomMost = xIndex + 4 > boardLength - 1 ? boardLength - 1 : xIndex + 4;
        const leftMost = yIndex - 4 < 0 ? 0 : yIndex - 4;
        const rightMost = yIndex + 4 > boardLength - 1 ? boardLength - 1 : yIndex + 4;
        const topLeftLost = xIndex - 4 >= 0 && yIndex - 4 >= 0
            ? 0
            : Math.max(0 - (xIndex - 4), 0 - (yIndex - 4));
        const topLeft = {
            xIndex: xIndex - 4 + topLeftLost,
            yIndex: yIndex - 4 + topLeftLost,
        };
        const topRightLost = xIndex - 4 >= 0 && yIndex + 4 <= boardLength - 1
            ? 0
            : Math.max(0 - (xIndex - 4), yIndex + 4 - (boardLength - 1));
        const topRight = {
            xIndex: xIndex - 4 + topRightLost,
            yIndex: yIndex + 4 - topRightLost,
        };
        const bottomLeftLost = xIndex + 4 <= boardLength - 1 && yIndex - 4 >= 0
            ? 0
            : Math.max(xIndex + 4 - (boardLength - 1), 0 - (yIndex - 4));
        const bottomLeft = {
            xIndex: xIndex + 4 - bottomLeftLost,
            yIndex: yIndex - 4 + bottomLeftLost,
        };
        const bottomRightLost = xIndex + 4 <= boardLength - 1 && yIndex + 4 <= boardLength - 1
            ? 0
            : Math.max(xIndex + 4 - (boardLength - 1), yIndex + 4 - (boardLength - 1));
        const bottomRight = {
            xIndex: xIndex + 4 - bottomRightLost,
            yIndex: yIndex + 4 - bottomRightLost,
        };
        const streak = [];
        for (let y = leftMost; y <= rightMost; y++) {
            if (board[xIndex][y] === turn) {
                streak.push({ xIndex, yIndex: y });
            }
            else {
                streak.length = 0;
            }
            if (streak.length === 5) {
                const leftGuard = streak[0].yIndex === 0
                    ? opponent
                    : board[xIndex][streak[0].yIndex - 1];
                const rightGuard = streak[4].yIndex === boardLength - 1
                    ? opponent
                    : board[xIndex][streak[4].yIndex + 1];
                if (!(leftGuard === rightGuard && leftGuard === opponent))
                    return { winner: turn, streak };
            }
        }
        streak.length = 0;
        for (let x = topMost; x <= bottomMost; x++) {
            if (board[x][yIndex] === turn) {
                streak.push({ xIndex: x, yIndex });
            }
            else {
                streak.length = 0;
            }
            if (streak.length === 5) {
                const topGuard = streak[0].xIndex === 0
                    ? opponent
                    : board[streak[0].xIndex - 1][yIndex];
                const bottomGuard = streak[4].xIndex === boardLength - 1
                    ? opponent
                    : board[streak[4].xIndex + 1][yIndex];
                if (!(topGuard === bottomGuard && topGuard === opponent))
                    return { winner: turn, streak };
            }
        }
        streak.length = 0;
        for (let x = topLeft.xIndex, y = topLeft.yIndex; x <= bottomRight.xIndex && y <= bottomRight.yIndex; x++, y++) {
            if (board[x][y] === turn) {
                streak.push({ xIndex: x, yIndex: y });
            }
            else {
                streak.length = 0;
            }
            if (streak.length === 5) {
                const topLeftGuard = streak[0].xIndex === 0 || streak[0].yIndex === 0
                    ? opponent
                    : board[streak[0].xIndex - 1][streak[0].yIndex - 1];
                const bottomRightGuard = streak[4].xIndex === boardLength - 1 ||
                    streak[4].yIndex === boardLength - 1
                    ? opponent
                    : board[streak[4].xIndex + 1][streak[4].yIndex + 1];
                if (!(topLeftGuard === bottomRightGuard && topLeftGuard === opponent))
                    return { winner: turn, streak };
            }
        }
        streak.length = 0;
        for (let x = bottomLeft.xIndex, y = bottomLeft.yIndex; x >= topRight.xIndex && y <= topRight.yIndex; x--, y++) {
            if (board[x][y] === turn) {
                streak.push({ xIndex: x, yIndex: y });
            }
            else {
                streak.length = 0;
            }
            if (streak.length === 5) {
                const bottomLeftGuard = streak[0].xIndex === boardLength - 1 || streak[0].yIndex === 0
                    ? opponent
                    : board[streak[0].xIndex + 1][streak[0].yIndex - 1];
                const topRightGuard = streak[4].xIndex === 0 || streak[4].yIndex === boardLength - 1
                    ? opponent
                    : board[streak[4].xIndex - 1][streak[4].yIndex + 1];
                if (!(bottomLeftGuard === topRightGuard && bottomLeftGuard === opponent))
                    return { winner: turn, streak };
            }
        }
        return null;
    }
    changeToDTO() {
        return {
            name: this.name,
            owner: this.owner,
            havePassword: !!this.password,
            player: this.player,
            viewer: this.viewer,
            onGoingMatch: this.onGoingMatch && Object.assign(Object.assign({}, this.onGoingMatch), { timeout: this.onGoingMatch.timeout && {
                    type: this.onGoingMatch.timeout.type,
                    remain: Timer[this.onGoingMatch.timeout.type] -
                        Math.round((Date.now() - this.onGoingMatch.timeout.startTime) / 1000),
                } }),
        };
    }
    getUserRoleInRoom(username) {
        const isViewer = this.viewer.find((viewer) => viewer.name === username);
        if (isViewer)
            return isViewer;
        const isPlayer = this.player.find((player) => player.name === username);
        if (isPlayer)
            return isPlayer;
    }
}
exports.Room = Room;
//# sourceMappingURL=room.js.map