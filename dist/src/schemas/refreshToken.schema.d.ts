import { Document, ObjectId } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from './user.schema';
export declare type RefreshTokenDocument = RefreshToken & Document;
export declare class RefreshToken {
    id: string;
    user: User;
    expires: Date;
    createdByIp: string;
    userAgent: string;
    revokedAt: Date;
    replacedByToken: ObjectId;
    isExpired: boolean;
    isActive: boolean;
}
declare const RefreshTokenSchema: mongoose.Schema<Document<RefreshToken, any, any>, mongoose.Model<Document<RefreshToken, any, any>, any, any, any>, {}>;
export { RefreshTokenSchema };
