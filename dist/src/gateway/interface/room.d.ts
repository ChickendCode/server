export interface CreateRoomDTO {
    roomName: string;
    roomPassword?: string;
}
export declare type JoinRoomDTO = CreateRoomDTO;
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
export declare class Room {
    name: string;
    owner: string;
    password?: string;
    player: Player[];
    viewer: Viewer[];
    onGoingMatch?: OnGoingMatch;
    constructor(name: string, owner: string, password?: string);
    handleJoin(username: string): boolean;
    handleRequestToPlay(username: string, pos: 1 | 2): boolean;
    handleRequestToBeViewer(username: string): boolean;
    handlePlayerReadyStatusChange(username: string): boolean;
    handleLeave(username: string): this;
    handleMove(username: string, xIndex: number, yIndex: number): boolean;
    calculateResult(): 1 | 2 | null;
    calculateWinner(xIndex: number, yIndex: number): {
        winner: 1 | 2;
        streak: MatchMoveDTO[];
    };
    changeToDTO(): {
        name: string;
        owner: string;
        havePassword: boolean;
        player: Player[];
        viewer: Viewer[];
        onGoingMatch: {
            timeout: {
                type: "matchStart" | "matchMove" | "matchFinish";
                remain: number;
            };
            matchMoves: number[][];
            nextTurn: 2 | 1;
            result?: {
                winner: 2 | 1;
                streak: MatchMoveDTO[];
            };
        };
    };
    getUserRoleInRoom(username: string): Viewer | Player;
}
