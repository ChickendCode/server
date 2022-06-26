import { Connection } from 'mongoose';
export declare const refreshTokenProvider: {
    provide: string;
    useFactory: (connection: Connection) => import("mongoose").Model<import("mongoose").Document<import("./refreshToken.schema").RefreshToken, any, any>, any, any, any>;
    inject: string[];
}[];
