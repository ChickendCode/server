import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Socket } from 'socket.io';

@Injectable()
export class WebSocketStrategy extends PassportStrategy(
  Strategy,
  'web-socket',
) {
  constructor(
    // private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request | Socket) => {
          const socket = request as Socket;
          // console.log(socket.handshake.headers);
          return 'request.';
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<any> {
    //remember to return something motherfucker
    return payload; // return payload;
  }
}
