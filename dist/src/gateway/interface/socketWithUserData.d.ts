import { Socket } from 'socket.io';
export interface ISocketWithUserData extends Socket {
    data: {
        userId: string;
    };
}
