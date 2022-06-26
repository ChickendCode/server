import { OnGatewayConnection } from '@nestjs/websockets';
import { Socket, Namespace } from 'socket.io';
export declare class ChatGateway implements OnGatewayConnection {
    handleConnection(socket: Socket): void;
    namespace: Namespace;
    listenForMessages(data: string, socket: Socket): Map<string, Set<string>>;
}
