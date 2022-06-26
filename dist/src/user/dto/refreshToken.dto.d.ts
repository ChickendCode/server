import { ObjectId } from 'mongoose';
export interface CreateRefreshTokenDTO {
    user: ObjectId;
    createdByIp: string;
    userAgent: string;
}
