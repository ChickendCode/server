import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenPayload } from '../interface/refresh-token.payload';
import { AuthenticationService } from '../authentication.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'refresh',
) {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly configService: ConfigService,
    private jwtService: JwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.RefreshToken;
        },
      ]),
      secretOrKey: configService.get<string>('JWT_SECRET'),
      passReqToCallback: true,
    });
  }

  // this can be improve by checking some additional information, like IP, User-agent,...
  // here let just ignore them and comeback later
  async validate(request: Request, payload: RefreshTokenPayload) {
    const refreshToken = await this.authenticationService.getActiveRefreshToken(
      payload.id,
    );
    return refreshToken;
  }
}
