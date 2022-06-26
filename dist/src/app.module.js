"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_module_1 = require("./user/user.module");
const authentication_module_1 = require("./authentication/authentication.module");
const exception_module_1 = require("./exception/exception.module");
const gateway_module_1 = require("./gateway/gateway.module");
const config_1 = require("@nestjs/config");
const configuration_1 = require("./config/configuration");
const mongoose_1 = require("@nestjs/mongoose");
const validation_module_1 = require("./pipes/validation/validation.module");
const refresh_token_module_1 = require("./refresh-token/refresh-token.module");
const redis_module_1 = require("./redis/redis.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            user_module_1.UserModule,
            authentication_module_1.AuthenticationModule,
            exception_module_1.ExceptionModule,
            validation_module_1.ValidationModule,
            gateway_module_1.WebSocketModule,
            config_1.ConfigModule.forRoot({
                load: [configuration_1.default],
                isGlobal: true,
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => {
                    const database = configService.get('database.name');
                    return {
                        uri: `mongodb://localhost:27017`,
                        dbName: database,
                    };
                },
                inject: [config_1.ConfigService],
            }),
            refresh_token_module_1.RefreshTokenModule,
            redis_module_1.RedisModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map