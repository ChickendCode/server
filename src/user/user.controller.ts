import {
  Controller,
  Inject,
  Post,
  Get,
  UseGuards,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { JwtGuard } from 'src/authentication/guards/jwt.guard';
import { RequestWithUser } from 'src/authentication/interface/requestWithUser';
import MongooseClassSerializerInterceptor from 'src/interceptor/mongooseSerialize.interceptor';
import { User } from 'src/schemas/user.schema';
import { UserService } from './user.service';

@UseInterceptors(MongooseClassSerializerInterceptor(User))
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/')
  @UseGuards(JwtGuard)
  async getUserInfo(@Req() request: RequestWithUser) {
    const user = request.user;
    return user;
  }
}
