import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket, Namespace } from 'socket.io';

@WebSocketGateway({ cors: true, namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection {
  handleConnection(socket: Socket) {
    // socket.join('room1');
    // this.namespace.emit('room_change', [
    //   ...this.namespace.adapter.rooms.get('room1'),
    // ]);
    // socket.to('room1').emit('hello', 'xinchao');
  }

  @WebSocketServer()
  namespace: Namespace;

  @SubscribeMessage('message')
  listenForMessages(
    @MessageBody() data: string,
    @ConnectedSocket() socket: Socket,
  ) {
    return this.namespace.adapter.rooms;
  }
}
