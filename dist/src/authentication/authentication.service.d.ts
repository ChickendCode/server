/// <reference types="mongoose" />
import { UserService } from 'src/user/user.service';
import { UserRegisterDTO } from 'src/user/dto/user-register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from './interface/access-token.payload';
import { CreateRefreshTokenDTO } from 'src/user/dto/refreshToken.dto';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { RefreshTokenPayload } from './interface/refresh-token.payload';
export declare class AuthenticationService {
    private userService;
    private jwtService;
    private configService;
    private refreshTokenService;
    constructor(userService: UserService, jwtService: JwtService, configService: ConfigService, refreshTokenService: RefreshTokenService);
    validateCredential(username: string, plainTextPassword: string): Promise<import("mongoose").Document<any, any, import("../schemas/user.schema").User> & import("../schemas/user.schema").User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    verifyAccessToken(token: string): Promise<import("mongoose").Document<any, any, import("../schemas/user.schema").User> & import("../schemas/user.schema").User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    register(userRegistrationData: UserRegisterDTO): Promise<import("mongoose").Document<any, any, import("../schemas/user.schema").User> & import("../schemas/user.schema").User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    createRefreshToken(refreshTokenData: CreateRefreshTokenDTO): Promise<void>;
    getActiveRefreshToken(refreshTokenId: string): Promise<import("mongoose").Document<any, any, import("../schemas/refreshToken.schema").RefreshToken> & import("../schemas/refreshToken.schema").RefreshToken & {
        _id: import("mongoose").Types.ObjectId;
    }>;
    getUserWithId(id: string): Promise<import("mongoose").Document<any, any, import("../schemas/user.schema").User> & import("../schemas/user.schema").User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    generateTokenCookie(accessTokenPayload: AccessTokenPayload, refreshTokenPayload: RefreshTokenPayload): Promise<{
        accessTokenCookie: string;
        refreshTokenCookie: string;
    }>;
    private generateAccessTokenCookie;
    private generateRefreshTokenCookie;
}
