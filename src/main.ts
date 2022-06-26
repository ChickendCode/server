import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { SocketAdapter } from './gateway/websocket.adapter';
import { INestApplication } from '@nestjs/common';

async function bootstrap() {
  let app: INestApplication;
  try {
    app = await NestFactory.create(AppModule, {
      abortOnError: false,
    });
    app.enableCors({
      origin: ['http://localhost:3001'],
      credentials: true,
    });
    app.use(cookieParser());
    app.useWebSocketAdapter(new SocketAdapter(app));
    await app.listen(3000);
  } catch (error) {
    console.log('here');
    console.log(error);
    process.exit();
    // console.trace(error);
  }
}
bootstrap();
