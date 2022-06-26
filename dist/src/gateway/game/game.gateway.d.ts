import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { CreateRoomDTO, JoinRoomDTO, MatchMoveDTO } from '../interface/room';
import { ISocketWithUserData } from '../interface/socketWithUserData';
import { GameService } from './game.service';
export declare class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private authenticationService;
    private redisService;
    private userService;
    private gameService;
    namespace: Namespace;
    constructor(authenticationService: AuthenticationService, redisService: RedisService, userService: UserService, gameService: GameService);
    handleDisconnect(socket: ISocketWithUserData): Promise<void>;
    handleConnection(socket: Socket): Promise<Socket<import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap, import("socket.io/dist/typed-events").DefaultEventsMap>>;
    listenForRetrieveCurrentRoom(socket: ISocketWithUserData): Promise<{
        success: boolean;
        data?: undefined;
    } | {
        success: boolean;
        data: {
            name: string;
            owner: string;
            havePassword: boolean;
            player: import("../interface/room").Player[];
            viewer: import("../interface/room").Viewer[];
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
    }>;
    listenForJoiningRoomRequest({ roomName, roomPassword }: JoinRoomDTO, socket: ISocketWithUserData): Promise<void>;
    listenForFetchRooms(socket: ISocketWithUserData): Promise<{
        name: string;
        owner: string;
        havePassword: boolean;
        player: import("../interface/room").Player[];
        viewer: import("../interface/room").Viewer[];
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
    }[]>;
    listenForCreateRoom({ roomName, roomPassword }: CreateRoomDTO, socket: ISocketWithUserData): Promise<{
        errorMessage: string;
        data?: undefined;
    } | {
        data: {
            name: string;
            owner: string;
            havePassword: boolean;
            player: import("../interface/room").Player[];
            viewer: import("../interface/room").Viewer[];
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
        errorMessage?: undefined;
    }>;
    listenForMatchMove({ xIndex, yIndex }: MatchMoveDTO, socket: ISocketWithUserData): Promise<boolean>;
    listenForRequestJoinMatch(pos: 1 | 2, socket: ISocketWithUserData): Promise<boolean>;
    listenForRequestToBeViewer(socket: ISocketWithUserData): Promise<boolean>;
    listenForReadyStatusChange(socket: ISocketWithUserData): Promise<boolean>;
    listenForLeaveRoom(socket: ISocketWithUserData): Promise<boolean>;
    listenForChat(socket: ISocketWithUserData, message: {
        sender: string;
        content: string;
    }): Promise<void>;
}
