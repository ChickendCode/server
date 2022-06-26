import { RefreshToken } from 'src/schemas/refreshToken.schema';
import { Model } from 'mongoose';
import { CreateRefreshTokenDTO } from 'src/user/dto/refreshToken.dto';
export declare class RefreshTokenService {
    private refreshTokenModel;
    constructor(refreshTokenModel: Model<RefreshToken>);
    createRefreshToken(refreshTokenData: CreateRefreshTokenDTO): Promise<import("mongoose").Document<any, any, RefreshToken> & RefreshToken & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    getRefreshToken(refreshTokenId: string): Promise<import("mongoose").Document<any, any, RefreshToken> & RefreshToken & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
