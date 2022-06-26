import {
  Controller,
  ForbiddenException,
  Post,
  Get,
  Req,
  UseGuards,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { LocalGuard } from './guards/local.guard';
import { JwtGuard } from './guards/jwt.guard';
import { Worker } from 'worker_threads';
import { UserRegisterDTO } from 'src/user/dto/user-register.dto';
import MongooseClassSerializerInterceptor from 'src/interceptor/mongooseSerialize.interceptor';
import { User } from 'src/schemas/user.schema';
import { Request } from 'express';
import { RequestWithUser } from './interface/requestWithUser';
import { RefreshTokenGuard } from './guards/refresh_token.guard';
import { RequestWithRefreshToken } from './interface/requestWithRefreshToken';
import { RefreshTokenPayload } from './interface/refresh-token.payload';
import { RefreshTokenService } from 'src/refresh-token/refresh-token.service';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/user/user.service';

@Controller('auth')
@UseInterceptors(MongooseClassSerializerInterceptor(User))
export class AuthenticationController {
  constructor(
    private authenticationService: AuthenticationService,
    private refreshTokenService: RefreshTokenService,
    private userService: UserService,
  ) {}

  @Post('login')
  @UseGuards(LocalGuard)
  async login(@Req() request: RequestWithUser) {
    const { user: userData } = request;
    const refreshToken = await this.refreshTokenService.createRefreshToken({
      user: userData._id,
      createdByIp: request.ip,
      userAgent: request.headers['user-agent'],
    });
    const { accessTokenCookie, refreshTokenCookie } =
      await this.authenticationService.generateTokenCookie(
        {
          id: userData._id,
        },
        { id: refreshToken._id },
      );
    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
    return userData;
  }

  @Post('register')
  async handleRegister(
    @Body() userRegistrationData: UserRegisterDTO,
    @Req() request: Request,
  ) {
    const userData = await this.authenticationService.register(
      userRegistrationData,
    );
    const refreshToken = await this.refreshTokenService.createRefreshToken({
      user: userData._id,
      createdByIp: request.ip,
      userAgent: request.headers['user-agent'],
    });
    const { accessTokenCookie, refreshTokenCookie } =
      await this.authenticationService.generateTokenCookie(
        {
          id: userData._id.toString(),
        },
        { id: refreshToken._id },
      );
    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
    await this.userService.updateLeaderBoardsAfterRegister(userData);
    return userData;
  }

  @Get()
  async getItem(@Req() request: Request) {
    console.log('task');
    const time = Date.now();
    const promise = new Promise((res) => {
      const worker = new Worker('./worker.js', {
        workerData: {
          value: 45,
          path: './worker.ts',
        },
      });
      worker.on('message', (result) => {
        res(result);
      });
    });
    await promise;
    return Date.now() - time;
  }

  @Get('/refresh')
  @UseGuards(RefreshTokenGuard)
  async refresh(@Req() request: RequestWithRefreshToken) {
    const { user: refreshToken } = request;
    const newRefreshToken = await this.refreshTokenService.createRefreshToken({
      user: refreshToken.user._id,
      createdByIp: request.ip,
      userAgent: request.headers['user-agent'],
    });
    refreshToken.revokedAt = new Date();
    refreshToken.replacedByToken = newRefreshToken._id;
    await refreshToken.save();
    const { accessTokenCookie, refreshTokenCookie } =
      await this.authenticationService.generateTokenCookie(
        {
          id: refreshToken.user._id.toString(),
        },
        { id: newRefreshToken._id },
      );
    request.res.setHeader('Set-Cookie', [
      accessTokenCookie,
      refreshTokenCookie,
    ]);
    return 'OK';
  }

  @Get('/refresh/logout')
  @UseGuards(RefreshTokenGuard)
  async logout(@Req() request: RequestWithRefreshToken) {
    const { user: refreshToken } = request;
    refreshToken.revokedAt = new Date();
    await refreshToken.save();
    request.res.clearCookie('AccessToken');
    request.res.clearCookie('RefreshToken');
    return { success: true };
  }
}
