import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ChatGateway } from './chat/chat.gateway';
import { GameGateway } from './game/game.gateway';
import { UserModule } from '../user/user.module';
import { WebSocketStrategy } from 'src/authentication/strategies/websocket-strategy';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationModule } from 'src/authentication/authentication.module';
import { GameService } from './game/game.service';

@Module({
  imports: [
    PassportModule,
    UserModule,
    JwtModule.register({}),
    AuthenticationModule,
  ],
  providers: [ChatGateway, GameGateway, WebSocketStrategy, GameService],
})
export class WebSocketModule {}
