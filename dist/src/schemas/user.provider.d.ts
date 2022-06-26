import { Connection } from 'mongoose';
export declare const userProvider: {
    provide: string;
    useFactory: (connection: Connection) => import("mongoose").Model<import("mongoose").Document<import("./user.schema").User, any, any>, any, any, any>;
    inject: string[];
}[];
