import { HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { RefreshToken } from 'src/schemas/refreshToken.schema';
import { Model } from 'mongoose';
import { CreateRefreshTokenDTO } from 'src/user/dto/refreshToken.dto';

@Injectable()
export class RefreshTokenService {
  constructor(
    // @InjectModel(RefreshToken.name)
    // private refreshTokenModel: Model<RefreshToken>,
    @Inject('REFRESH_TOKEN_MODEL')
    private refreshTokenModel: Model<RefreshToken>,
  ) {}

  public async createRefreshToken(refreshTokenData: CreateRefreshTokenDTO) {
    const refreshToken = await this.refreshTokenModel.create(refreshTokenData);
    return refreshToken;
  }

  public async getRefreshToken(refreshTokenId: string) {
    const refreshToken = await this.refreshTokenModel
      .findById(refreshTokenId)
      .populate('user');
    return refreshToken;
  }
}
