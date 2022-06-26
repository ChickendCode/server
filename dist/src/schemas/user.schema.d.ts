import { Document, ObjectId } from 'mongoose';
export declare type UserDocument = User & Document;
export declare class User {
    _id: ObjectId;
    username: string;
    password: string;
    currentRoom?: string;
    currentSocketInstances: string[];
    win: number;
    lose: number;
}
export declare const UserSchema: import("mongoose").Schema<Document<User, any, any>, import("mongoose").Model<Document<User, any, any>, any, any, any>, {}>;
