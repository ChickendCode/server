import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ExceptionModule } from './exception/exception.module';
import { WebSocketModule } from './gateway/gateway.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { MongooseModule } from '@nestjs/mongoose';
import { ValidationModule } from './pipes/validation/validation.module';
import { RefreshTokenModule } from './refresh-token/refresh-token.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    UserModule,
    AuthenticationModule,
    ExceptionModule,
    ValidationModule,
    WebSocketModule,
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    // MongooseModule.forRoot('mongodb://localhost:27017/caro-play'),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // const username = configService.get('MONGO_USERNAME');
        // const password = configService.get('MONGO_PASSWORD');
        const database = configService.get('database.name');
        // const host = configService.get('MONGO_HOST');

        return {
          uri: `mongodb://localhost:27017`,
          dbName: database,
        };
      },
      inject: [ConfigService],
    }),
    RefreshTokenModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
