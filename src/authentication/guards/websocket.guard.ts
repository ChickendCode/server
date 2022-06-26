import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class WebSocketGuard extends AuthGuard('web-socket') {}
