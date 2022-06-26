import { Request } from 'express';
import { UserDocument } from 'src/schemas/user.schema';
export interface RequestWithUser extends Request {
    user: UserDocument;
}
