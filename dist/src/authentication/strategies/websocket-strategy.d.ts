import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
declare const WebSocketStrategy_base: new (...args: any[]) => Strategy;
export declare class WebSocketStrategy extends WebSocketStrategy_base {
    private readonly configService;
    constructor(configService: ConfigService);
    validate(payload: any): Promise<any>;
}
export {};
