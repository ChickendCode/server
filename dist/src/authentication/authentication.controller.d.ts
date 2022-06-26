/// <reference types="mongoose" />
import { AuthenticationService } from './authentication.service';
import { UserRegisterDTO } from 'src/user/dto/user-register.dto';
import { User } from 'src/schemas/user.schema';
import { Request } from 'express';
import { RequestWithUser } from './interface/requestWithUser';
import { RequestWithRefreshToken } from './interface/requestWithRefreshToken';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { UserService } from 'src/user/user.service';
export declare class AuthenticationController {
    private authenticationService;
    private refreshTokenService;
    private userService;
    constructor(authenticationService: AuthenticationService, refreshTokenService: RefreshTokenService, userService: UserService);
    login(request: RequestWithUser): Promise<import("src/schemas/user.schema").UserDocument>;
    handleRegister(userRegistrationData: UserRegisterDTO, request: Request): Promise<import("mongoose").Document<any, any, User> & User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
    getItem(request: Request): Promise<number>;
    refresh(request: RequestWithRefreshToken): Promise<string>;
    logout(request: RequestWithRefreshToken): Promise<{
        success: boolean;
    }>;
}
