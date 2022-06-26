/// <reference types="mongoose" />
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interface/refresh-token.payload';
import { AuthenticationService } from '../authentication.service';
import { JwtService } from '@nestjs/jwt';
declare const RefreshTokenStrategy_base: new (...args: any[]) => Strategy;
export declare class RefreshTokenStrategy extends RefreshTokenStrategy_base {
    private readonly authenticationService;
    private readonly configService;
    private jwtService;
    constructor(authenticationService: AuthenticationService, configService: ConfigService, jwtService: JwtService);
    validate(request: Request, payload: RefreshTokenPayload): Promise<import("mongoose").Document<any, any, import("../../schemas/refreshToken.schema").RefreshToken> & import("../../schemas/refreshToken.schema").RefreshToken & {
        _id: import("mongoose").Types.ObjectId;
    }>;
}
export {};
