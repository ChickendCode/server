import {
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/schemas/user.schema';
import { Model } from 'mongoose';
import { UserRegisterDTO } from './dto/user-register.dto';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from 'src/schemas/refreshToken.schema';
import { CreateRefreshTokenDTO } from './dto/refreshToken.dto';
import { RedisService } from 'src/redis/redis.service';
import { ILeaderBoard } from 'src/gateway/interface/leaderBoard';

@Injectable()
export class UserService {
  constructor(
    // @InjectModel(User.name) private userModel: Model<User>,
    @Inject('USER_MODEL')
    private userModel: Model<User>,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {}

  public async getLeaderBoard() {
    const leaderBoard = await this.userModel
      .find()
      .sort({ win: 'desc' })
      .limit(15)
      .select('username win lose -_id')
      .exec();
    return leaderBoard;
  }

  public async updateLeaderBoardsAfterRegister(user: UserDocument) {
    const leaderBoards = await this.redisService.cacheManager.get<
      ILeaderBoard[]
    >('game_leader_board');
    leaderBoards.push({
      username: user.username,
      win: user.win,
      lose: user.lose,
    });
    await this.redisService.cacheManager.set(
      'game_leader_board',
      leaderBoards.slice(0, 15),
    );
  }

  public async createUser(userRegistrationData: UserRegisterDTO) {
    const { username, password } = userRegistrationData;
    const isExist = await this.userModel.findOne({
      username: username,
    });
    if (isExist)
      throw new HttpException(
        'User with that username already exists',
        HttpStatus.CONFLICT,
      );
    const hashedPassword = await bcrypt.hash(
      password,
      parseInt(this.configService.get<string>('bcrypt_salt'), 10),
    );
    const user = await this.userModel.create({
      ...userRegistrationData,
      password: hashedPassword,
    });
    return user;
  }

  public async getUserWithCredential(
    username: string,
    plainTextPassword: string,
  ) {
    const user = await this.userModel.findOne({ username });
    if (!user)
      throw new HttpException('Invalid credential', HttpStatus.UNAUTHORIZED);
    await this.verifyPassword(plainTextPassword, user.password);
    return user;
  }

  public async getUserWithId(id: string) {
    const user = await this.userModel.findById(id);
    return user;
  }

  public async getUserWithUsername(username: string) {
    const user = await this.userModel.findOne({ username });
    return user;
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
    if (!isMatch)
      throw new HttpException('Invalid credential', HttpStatus.UNAUTHORIZED);
  }

  // public async getLeaderboard() {
  //   const leaderboard
  // }
}
