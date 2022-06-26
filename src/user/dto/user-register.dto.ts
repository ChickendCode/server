import { IsNotEmpty } from 'class-validator';

export class UserRegisterDTO {
  @IsNotEmpty()
  username: string;

  @IsNotEmpty()
  password: string;
}
