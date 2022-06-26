import { HttpException, Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { UserRegisterDTO } from 'src/user/dto/user-register.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenPayload } from './interface/access-token.payload';
import { JwtConfig } from 'src/config/interface';
import { CreateRefreshTokenDTO } from 'src/user/dto/refreshToken.dto';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { RefreshTokenPayload } from './interface/refresh-token.payload';

@Injectable()
export class AuthenticationService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  public async validateCredential(username: string, plainTextPassword: string) {
    const userData = await this.userService.getUserWithCredential(
      username,
      plainTextPassword,
    );
    return userData;
  }

  public async verifyAccessToken(token: string) {
    const payload: AccessTokenPayload = await this.jwtService.verifyAsync(
      token,
      {
        secret: this.configService.get<string>('jwt.secret'),
      },
    );
    const userData = await this.userService.getUserWithId(payload.id);
    return userData;
  }

  public async register(userRegistrationData: UserRegisterDTO) {
    const userData = await this.userService.createUser(userRegistrationData);
    return userData;
  }

  public async createRefreshToken(refreshTokenData: CreateRefreshTokenDTO) {
    const refreshToken = await this.refreshTokenService.createRefreshToken(
      refreshTokenData,
    );
  }

  public async getActiveRefreshToken(refreshTokenId: string) {
    const refreshToken = await this.refreshTokenService.getRefreshToken(
      refreshTokenId,
    );
    if (!refreshToken) throw new HttpException('Invalid refresh token', 401);
    // this should be improved, like sending message to user to ask them
    // whether they just use the expired refresh token. Now just throw an error
    if (!refreshToken.isActive)
      throw new HttpException('Malicious action', 401);
    return refreshToken;
  }

  public async getUserWithId(id: string) {
    const user = await this.userService.getUserWithId(id);
    return user;
  }

  public async generateTokenCookie(
    accessTokenPayload: AccessTokenPayload,
    refreshTokenPayload: RefreshTokenPayload,
  ) {
    const accessTokenCookie = await this.generateAccessTokenCookie(
      accessTokenPayload,
    );
    const refreshTokenCookie = await this.generateRefreshTokenCookie(
      refreshTokenPayload,
    );
    return { accessTokenCookie, refreshTokenCookie };
  }

  private async generateAccessTokenCookie(tokenPayload: AccessTokenPayload) {
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      secret: jwtConfig.secret,
      expiresIn: 18000,
    });
    return `AccessToken=${accessToken}; HttpOnly; Path=/; Max-Age=${jwtConfig.accessTokenExpireTime}`;
  }

  private async generateRefreshTokenCookie(tokenPayload: RefreshTokenPayload) {
    const jwtConfig = this.configService.get<JwtConfig>('jwt');
    const refreshToken = await this.jwtService.signAsync(tokenPayload, {
      secret: jwtConfig.secret,
      expiresIn: 18000,
    });
    return `RefreshToken=${refreshToken}; HttpOnly; Path=${'/auth/refresh'}; Max-Age=${
      jwtConfig.refreshTokenExpireTime
    }`;
  }
}
