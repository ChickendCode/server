import { Request } from 'express';
import { RefreshTokenDocument } from 'src/schemas/refreshToken.schema';
export interface RequestWithRefreshToken extends Request {
  user: RefreshTokenDocument;
}
