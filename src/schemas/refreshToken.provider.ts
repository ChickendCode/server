import { Connection } from 'mongoose';
import { RefreshTokenSchema } from './refreshToken.schema';

export const refreshTokenProvider = [
  {
    provide: 'REFRESH_TOKEN_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('RefreshToken', RefreshTokenSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
