"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const chat_gateway_1 = require("./chat/chat.gateway");
const game_gateway_1 = require("./game/game.gateway");
const user_module_1 = require("../user/user.module");
const websocket_strategy_1 = require("../authentication/strategies/websocket-strategy");
const jwt_1 = require("@nestjs/jwt");
const authentication_module_1 = require("../authentication/authentication.module");
const game_service_1 = require("./game/game.service");
let WebSocketModule = class WebSocketModule {
};
WebSocketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            passport_1.PassportModule,
            user_module_1.UserModule,
            jwt_1.JwtModule.register({}),
            authentication_module_1.AuthenticationModule,
        ],
        providers: [chat_gateway_1.ChatGateway, game_gateway_1.GameGateway, websocket_strategy_1.WebSocketStrategy, game_service_1.GameService],
    })
], WebSocketModule);
exports.WebSocketModule = WebSocketModule;
//# sourceMappingURL=gateway.module.js.map