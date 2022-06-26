import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/schemas/user.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from 'src/schemas/refreshToken.schema';
import { DatabaseModule } from 'src/database/database.module';
import { userProvider } from 'src/schemas/user.provider';
import { RedisModule } from 'src/redis/redis.module';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: User.name, schema: UserSchema },
    //   { name: RefreshToken.name, schema: RefreshTokenSchema },
    // ]),
    DatabaseModule,
    RedisModule,
  ],
  controllers: [UserController],
  providers: [UserService, ...userProvider],
  exports: [UserService],
})
export class UserModule {}
