import { User, UserDocument } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { UserRegisterDTO } from './dto/user-register.dto';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
export declare class UserService {
    private userModel;
    private configService;
    private redisService;
    constructor(userModel: Model<User>, configService: ConfigService, redisService: RedisService);
    getLeaderBoard(): Promise<(import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    })[]>;
    updateLeaderBoardsAfterRegister(user: UserDocument): Promise<void>;
    createUser(userRegistrationData: UserRegisterDTO): Promise<import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    getUserWithCredential(username: string, plainTextPassword: string): Promise<import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    getUserWithId(id: string): Promise<import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    getUserWithUsername(username: string): Promise<import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    private verifyPassword;
}
