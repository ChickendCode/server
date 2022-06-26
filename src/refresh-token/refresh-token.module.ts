import { Module } from '@nestjs/common';
import { RefreshTokenService } from './refresh-token.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshToken,
  RefreshTokenSchema,
} from 'src/schemas/refreshToken.schema';
import { DatabaseModule } from 'src/database/database.module';
import { refreshTokenProvider } from 'src/schemas/refreshToken.provider';

@Module({
  imports: [
    // MongooseModule.forFeature([
    //   { name: RefreshToken.name, schema: RefreshTokenSchema },
    // ]),
    DatabaseModule,
  ],
  providers: [RefreshTokenService, ...refreshTokenProvider],
  exports: [RefreshTokenService],
})
export class RefreshTokenModule {}
