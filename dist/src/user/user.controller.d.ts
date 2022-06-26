import { RequestWithUser } from 'src/authentication/interface/requestWithUser';
import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    getUserInfo(request: RequestWithUser): Promise<import("src/schemas/user.schema").UserDocument>;
}
