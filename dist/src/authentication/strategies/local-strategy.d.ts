/// <reference types="mongoose" />
import { Strategy } from 'passport-local';
import { AuthenticationService } from '../authentication.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authenticationService;
    constructor(authenticationService: AuthenticationService);
    validate(username: string, password: string): Promise<import("mongoose").Document<any, any, import("../../schemas/user.schema").User> & import("../../schemas/user.schema").User & {
        _id: import("mongoose").Schema.Types.ObjectId;
    }>;
}
export {};
