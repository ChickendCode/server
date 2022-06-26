import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from '../interface/access-token.payload';
import { AuthenticationService } from '../authentication.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private authenticationService;
    constructor(configService: ConfigService, authenticationService: AuthenticationService);
    validate(payload: AccessTokenPayload): Promise<any>;
}
export {};
