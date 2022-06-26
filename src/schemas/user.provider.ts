import { Connection } from 'mongoose';
// import { RefreshTokenSchema } from './refreshToken.schema';
import { UserSchema } from './user.schema';

export const userProvider = [
  {
    provide: 'USER_MODEL',
    useFactory: (connection: Connection) =>
      connection.model('User', UserSchema),
    inject: ['DATABASE_CONNECTION'],
  },
];
