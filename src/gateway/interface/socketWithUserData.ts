import { Socket } from 'socket.io';
import { UserDocument } from 'src/schemas/user.schema';

export interface ISocketWithUserData extends Socket {
  data: {
    userId: string;
  };
}
