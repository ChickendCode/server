import { OnModuleInit } from '@nestjs/common';
import { Namespace } from 'socket.io';
import { AuthenticationService } from 'src/authentication/authentication.service';
import { RedisService } from 'src/redis/redis.service';
import { UserService } from 'src/user/user.service';
import { Room } from '../interface/room';
import { UserDocument } from 'src/schemas/user.schema';
import { ILeaderBoard } from '../interface/leaderBoard';
export declare class GameService implements OnModuleInit {
    private authenticationService;
    private redisService;
    private userService;
    constructor(authenticationService: AuthenticationService, redisService: RedisService, userService: UserService);
    onModuleInit(): Promise<void>;
    updateLeaderBoard(winner: UserDocument, loser: UserDocument): Promise<ILeaderBoard[]>;
    getRoomDataFromRedis(roomName: string): Promise<Room>;
    handleTurnOutOfTime(roomName: string, currentPlayer: string, namespace: Namespace): Promise<boolean>;
}
